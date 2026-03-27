import express from "express";
import prisma from "../config/db.js";
import { updatePointsTable } from "../utils/nrr.js";

const router = express.Router();

// Get all matches (public - no auth required)
router.get("/", async (req, res) => {
  try {
    const { status, round } = req.query;

    const where = {};
    if (status) where.status = status;
    if (round) where.round = round;

    const matches = await prisma.match.findMany({
      where,
      include: {
        team1: true,
        team2: true,
      },
      orderBy: [{ matchDate: "asc" }, { matchTime: "asc" }],
    });

    res.json(matches);
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single match (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: parseInt(id) },
      include: {
        team1: true,
        team2: true,
      },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json(match);
  } catch (error) {
    console.error("Get match error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Generate round-robin fixtures with configurable matches per team
// Ensures at least one match gap between each team's matches
router.post("/generate-fixtures", async (req, res) => {
  try {
    const {
      matchesPerTeam = 2,
      totalOvers = 20,
      startDate,
      venue = "Stadium",
    } = req.body;

    const teams = await prisma.team.findMany();

    if (teams.length < 2) {
      return res.status(400).json({ error: "Need at least 2 teams" });
    }

    // Delete existing league matches
    await prisma.match.deleteMany({
      where: { round: "league" },
    });

    // Reset points table
    await prisma.pointsTable.updateMany({
      data: {
        matches: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        points: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        nrr: 0,
      },
    });

    const n = teams.length;
    const numOpponents = Math.min(matchesPerTeam, n - 1);

    // Generate all round-robin pairs
    const allPairs = [];
    for (let i = 0; i < n; i++) {
      for (let j = 1; j <= numOpponents; j++) {
        const oppIdx = (i + j) % n;
        if (i < oppIdx) {
          allPairs.push({ team1Id: teams[i].id, team2Id: teams[oppIdx].id });
        }
      }
    }

    // Interleave matches to ensure at least one gap between team matches
    // Use round-robin scheduling algorithm
    const scheduledMatches = [];
    const teamMatchCount = {};
    teams.forEach((t) => (teamMatchCount[t.id] = 0));

    let round = 0;
    const maxRounds = allPairs.length;

    while (scheduledMatches.length < allPairs.length && round < maxRounds * 2) {
      round++;
      const roundMatches = [];
      const teamPlayedThisRound = {};

      // Try to add matches where both teams haven't played recently
      for (const pair of allPairs) {
        if (scheduledMatches.includes(pair)) continue;

        const t1LastMatch = scheduledMatches
          .filter(
            (m) => m.team1Id === pair.team1Id || m.team2Id === pair.team1Id,
          )
          .slice(-1)[0];
        const t2LastMatch = scheduledMatches
          .filter(
            (m) => m.team1Id === pair.team2Id || m.team2Id === pair.team2Id,
          )
          .slice(-1)[0];

        // Check if this pair was just played
        const lastMatchWithTeam1 = scheduledMatches
          .filter(
            (m) => m.team1Id === pair.team1Id || m.team2Id === pair.team1Id,
          )
          .pop();
        const lastMatchWithTeam2 = scheduledMatches
          .filter(
            (m) => m.team1Id === pair.team2Id || m.team2Id === pair.team2Id,
          )
          .pop();

        // If both teams haven't played in last 2 matches, schedule this pair
        const recentMatchesCount = scheduledMatches.filter(
          (m) =>
            m.team1Id === pair.team1Id ||
            m.team2Id === pair.team1Id ||
            m.team1Id === pair.team2Id ||
            m.team2Id === pair.team2Id,
        ).length;

        // Simple interleaving: don't schedule if a team already has a match this round
        if (
          !teamPlayedThisRound[pair.team1Id] &&
          !teamPlayedThisRound[pair.team2Id]
        ) {
          // Check minimum gap: team shouldn't have played in the last match
          const team1InLast =
            scheduledMatches.length > 0
              ? scheduledMatches[scheduledMatches.length - 1].team1Id ===
                  pair.team1Id ||
                scheduledMatches[scheduledMatches.length - 1].team2Id ===
                  pair.team1Id
              : false;
          const team2InLast =
            scheduledMatches.length > 0
              ? scheduledMatches[scheduledMatches.length - 1].team1Id ===
                  pair.team2Id ||
                scheduledMatches[scheduledMatches.length - 1].team2Id ===
                  pair.team2Id
              : false;

          if (!team1InLast && !team2InLast) {
            roundMatches.push(pair);
            teamPlayedThisRound[pair.team1Id] = true;
            teamPlayedThisRound[pair.team2Id] = true;
          }
        }
      }

      // If round is empty, just take any remaining pair
      if (
        roundMatches.length === 0 &&
        scheduledMatches.length < allPairs.length
      ) {
        for (const pair of allPairs) {
          if (
            !scheduledMatches.includes(pair) &&
            !teamPlayedThisRound[pair.team1Id] &&
            !teamPlayedThisRound[pair.team2Id]
          ) {
            roundMatches.push(pair);
            teamPlayedThisRound[pair.team1Id] = true;
            teamPlayedThisRound[pair.team2Id] = true;
            break;
          }
        }
      }

      // Add round matches to scheduled
      for (const pair of roundMatches) {
        const matchDate = new Date(startDate || new Date());
        matchDate.setDate(
          matchDate.getDate() + Math.floor(scheduledMatches.length / 3),
        );

        scheduledMatches.push({
          team1Id: pair.team1Id,
          team2Id: pair.team2Id,
          matchDate,
          matchTime: "14:00",
          venue,
          totalOvers,
          status: "scheduled",
          round: "league",
        });
      }
    }

    if (scheduledMatches.length > 0) {
      await prisma.match.createMany({
        data: scheduledMatches,
      });
    }

    res.status(201).json({
      message: "Fixtures generated successfully",
      count: scheduledMatches.length,
    });
  } catch (error) {
    console.error("Generate fixtures error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update match result (admin only)
router.put("/:id/result", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      team1Score,
      team1Overs,
      team2Score,
      team2Overs,
      totalOvers,
      battingFirst,
      matchDate,
      matchTime,
      venue,
    } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: parseInt(id) },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.status === "completed") {
      return res.status(400).json({ error: "Match already completed" });
    }

    // Determine winner
    let winnerTeamId = null;
    let status = "completed";

    if (team1Score > team2Score) {
      winnerTeamId = match.team1Id;
    } else if (team2Score > team1Score) {
      winnerTeamId = match.team2Id;
    } else {
      status = "tie";
    }

    // Update match with batting order from toss
    const updatedMatch = await prisma.match.update({
      where: { id: parseInt(id) },
      data: {
        team1Score,
        team1Overs,
        team2Score,
        team2Overs,
        winnerTeamId,
        status,
        matchDate: matchDate ? new Date(matchDate) : null,
        matchTime,
        venue,
        totalOvers: totalOvers || match.totalOvers,
        battingFirst: battingFirst || null,
      },
    });

    // Update points table with NRR calculation
    await updatePointsTable(match, {
      team1Score,
      team1Overs,
      team2Score,
      team2Overs,
      winnerTeamId,
      status,
      totalOvers: totalOvers || match.totalOvers,
    });

    res.json(updatedMatch);
  } catch (error) {
    console.error("Update result error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update match (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { matchDate, matchTime, venue, status } = req.body;

    const match = await prisma.match.update({
      where: { id: parseInt(id) },
      data: {
        matchDate: matchDate ? new Date(matchDate) : undefined,
        matchTime,
        venue,
        status,
      },
    });

    res.json(match);
  } catch (error) {
    console.error("Update match error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
