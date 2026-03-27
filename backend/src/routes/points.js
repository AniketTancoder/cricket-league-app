import express from "express";
import prisma from "../config/db.js";

const router = express.Router();

// Get points table (public - no auth required)
router.get("/", async (req, res) => {
  try {
    // First get all teams with their points, sorted by points then NRR
    const pointsTable = await prisma.pointsTable.findMany({
      include: {
        team: true,
      },
      orderBy: [
        { points: "desc" }, // Primary: Points
        { nrr: "desc" }, // Secondary: NRR (for tie-breaking when points are equal)
      ],
    });

    // Now assign ranks properly - each team gets unique sequential rank
    let currentRank = 0;

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const ranked = pointsTable.map((pt) => {
      // Always increment rank for each team (unique sequential ranking)
      currentRank++;

      // Prepend base URL to logo path
      const logoUrl = pt.team.logo ? `${baseUrl}${pt.team.logo}` : null;

      return {
        ...pt,
        team: {
          ...pt.team,
          logo: logoUrl,
        },
        rank: currentRank,
        qualified: pt.wins >= 3 && currentRank <= 4,
        eliminated: pt.wins < 3 || currentRank > 4,
      };
    });

    res.json(ranked);
  } catch (error) {
    console.error("Get points table error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get specific team stats (public)
router.get("/team/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;

    const points = await prisma.pointsTable.findUnique({
      where: { teamId: parseInt(teamId) },
      include: {
        team: true,
      },
    });

    if (!points) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(points);
  } catch (error) {
    console.error("Get team stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset points table (admin only)
router.post("/reset", async (req, res) => {
  try {
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

    res.json({ message: "Points table reset successfully" });
  } catch (error) {
    console.error("Reset points table error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
