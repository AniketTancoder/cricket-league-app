import express from "express";
import prisma from "../config/db.js";

const router = express.Router();

// Get all playoffs (public - no auth required)
router.get("/", async (req, res) => {
  try {
    const playoffs = await prisma.playoff.findMany({
      orderBy: { type: "asc" },
    });

    res.json(playoffs);
  } catch (error) {
    console.error("Get playoffs error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Generate playoffs based on points table (admin only)
router.post("/generate", async (req, res) => {
  try {
    // Get top 4 teams from points table
    const pointsTable = await prisma.pointsTable.findMany({
      include: { team: true },
      orderBy: [{ points: "desc" }, { nrr: "desc" }],
      take: 4,
    });

    if (pointsTable.length < 4) {
      return res
        .status(400)
        .json({ error: "Not enough teams to generate playoffs" });
    }

    // Delete existing playoffs
    await prisma.playoff.deleteMany();

    // Create semi-finals
    // SF1: Rank 1 vs Rank 4
    // SF2: Rank 2 vs Rank 3
    await prisma.playoff.create({
      data: {
        type: "semi_final_1",
        team1Id: pointsTable[0].teamId,
        team2Id: pointsTable[3].teamId,
        status: "scheduled",
      },
    });

    await prisma.playoff.create({
      data: {
        type: "semi_final_2",
        team1Id: pointsTable[1].teamId,
        team2Id: pointsTable[2].teamId,
        status: "scheduled",
      },
    });

    res.status(201).json({ message: "Playoffs generated successfully" });
  } catch (error) {
    console.error("Generate playoffs error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update playoff result (admin only)
router.put("/:id/result", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      team1Score,
      team1Overs,
      team2Score,
      team2Overs,
      matchDate,
      matchTime,
      venue,
    } = req.body;

    const playoff = await prisma.playoff.findUnique({
      where: { id: parseInt(id) },
    });

    if (!playoff) {
      return res.status(404).json({ error: "Playoff not found" });
    }

    if (playoff.status === "completed") {
      return res.status(400).json({ error: "Playoff already completed" });
    }

    // Determine winner
    let winnerTeamId = null;
    let status = "completed";

    if (team1Score > team2Score) {
      winnerTeamId = playoff.team1Id;
    } else if (team2Score > team1Score) {
      winnerTeamId = playoff.team2Id;
    } else {
      status = "tie";
    }

    // Update playoff
    const updatedPlayoff = await prisma.playoff.update({
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
      },
    });

    // Auto-generate final if semi-final completed
    if (playoff.type.startsWith("semi_final") && status === "completed") {
      await generateFinal();
    }

    res.json(updatedPlayoff);
  } catch (error) {
    console.error("Update playoff result error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update playoff (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { matchDate, matchTime, venue, status, team1Id, team2Id } = req.body;

    const data = {};
    if (matchDate) data.matchDate = new Date(matchDate);
    if (matchTime) data.matchTime = matchTime;
    if (venue) data.venue = venue;
    if (status) data.status = status;
    if (team1Id) data.team1Id = team1Id;
    if (team2Id) data.team2Id = team2Id;

    const playoff = await prisma.playoff.update({
      where: { id: parseInt(id) },
      data,
    });

    res.json(playoff);
  } catch (error) {
    console.error("Update playoff error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to generate final
async function generateFinal() {
  const sf1 = await prisma.playoff.findUnique({
    where: { type: "semi_final_1" },
  });

  const sf2 = await prisma.playoff.findUnique({
    where: { type: "semi_final_2" },
  });

  if (sf1?.status === "completed" && sf2?.status === "completed") {
    // Check if final already exists
    const existingFinal = await prisma.playoff.findUnique({
      where: { type: "final" },
    });

    if (!existingFinal) {
      await prisma.playoff.create({
        data: {
          type: "final",
          team1Id: sf1.winnerTeamId,
          team2Id: sf2.winnerTeamId,
          status: "scheduled",
        },
      });
    }
  }
}

export default router;
