import prisma from "../config/db.js";

// Convert overs to decimal format (e.g., 19.3 -> 19.5)
// Format: X.Y where X is overs and Y is balls (0-5)
export const convertOversToDecimal = (overs) => {
  if (!overs) return 0;
  const wholeOvers = Math.floor(overs);
  const balls = Math.round((overs - wholeOvers) * 10);
  return wholeOvers + balls / 6;
};

// Convert decimal overs back to cricket format (e.g., 19.5 -> 19.3)
export const convertDecimalToOvers = (decimalOvers) => {
  if (!decimalOvers) return 0;
  const wholeOvers = Math.floor(decimalOvers);
  const balls = Math.round((decimalOvers - wholeOvers) * 6);
  return `${wholeOvers}.${balls}`;
};

// Calculate NRR
export const calculateNRR = (
  runsScored,
  oversFaced,
  runsConceded,
  oversBowled,
) => {
  if (!oversFaced || !oversBowled || oversFaced === 0 || oversBowled === 0) {
    return 0;
  }

  const runRateScored = runsScored / oversFaced;
  const runRateConceded = runsConceded / oversBowled;

  return parseFloat((runRateScored - runRateConceded).toFixed(3));
};

// Update points table after a match
export const updatePointsTable = async (match, result) => {
  const {
    team1Score,
    team1Overs,
    team2Score,
    team2Overs,
    winnerTeamId,
    status,
  } = result;

  // Get current points for both teams
  const team1Points = await prisma.pointsTable.findUnique({
    where: { teamId: match.team1Id },
  });

  const team2Points = await prisma.pointsTable.findUnique({
    where: { teamId: match.team2Id },
  });

  // Update team 1
  await prisma.pointsTable.update({
    where: { teamId: match.team1Id },
    data: {
      matches: team1Points.matches + 1,
      runsScored: team1Points.runsScored + team1Score,
      oversFaced: team1Points.oversFaced + team1Overs,
      runsConceded: team1Points.runsConceded + team2Score,
      oversBowled: team1Points.oversBowled + team2Overs,
    },
  });

  // Update team 2
  await prisma.pointsTable.update({
    where: { teamId: match.team2Id },
    data: {
      matches: team2Points.matches + 1,
      runsScored: team2Points.runsScored + team2Score,
      oversFaced: team2Points.oversFaced + team2Overs,
      runsConceded: team2Points.runsConceded + team1Score,
      oversBowled: team2Points.oversBowled + team1Overs,
    },
  });

  // Update wins/losses/points based on result
  if (status === "completed" && winnerTeamId) {
    if (winnerTeamId === match.team1Id) {
      await prisma.pointsTable.update({
        where: { teamId: match.team1Id },
        data: {
          wins: team1Points.wins + 1,
          points: team1Points.points + 2,
        },
      });
      await prisma.pointsTable.update({
        where: { teamId: match.team2Id },
        data: {
          losses: team2Points.losses + 1,
        },
      });
    } else {
      await prisma.pointsTable.update({
        where: { teamId: match.team2Id },
        data: {
          wins: team2Points.wins + 1,
          points: team2Points.points + 2,
        },
      });
      await prisma.pointsTable.update({
        where: { teamId: match.team1Id },
        data: {
          losses: team1Points.losses + 1,
        },
      });
    }
  } else if (status === "tie") {
    // Both teams get 1 point in case of tie
    await prisma.pointsTable.update({
      where: { teamId: match.team1Id },
      data: {
        ties: team1Points.ties + 1,
        points: team1Points.points + 1,
      },
    });
    await prisma.pointsTable.update({
      where: { teamId: match.team2Id },
      data: {
        ties: team2Points.ties + 1,
        points: team2Points.points + 1,
      },
    });
  }

  // Recalculate NRR for both teams
  await recalculateNRR(match.team1Id);
  await recalculateNRR(match.team2Id);
};

// Recalculate NRR for a team
export const recalculateNRR = async (teamId) => {
  const points = await prisma.pointsTable.findUnique({
    where: { teamId },
  });

  const nrr = calculateNRR(
    points.runsScored,
    points.oversFaced,
    points.runsConceded,
    points.oversBowled,
  );

  await prisma.pointsTable.update({
    where: { teamId },
    data: { nrr },
  });
};

// Get qualified teams (top 4 with >= 3 wins)
export const getQualifiedTeams = async () => {
  const pointsTable = await prisma.pointsTable.findMany({
    include: { team: true },
    orderBy: [{ points: "desc" }, { nrr: "desc" }],
  });

  return pointsTable.filter((t) => t.wins >= 3).slice(0, 4);
};

export default {
  convertOversToDecimal,
  convertDecimalToOvers,
  calculateNRR,
  updatePointsTable,
  recalculateNRR,
  getQualifiedTeams,
};
