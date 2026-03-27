import express from "express";
import prisma from "../config/db.js";

const router = express.Router();

// Get all players (public - no auth required)
router.get("/", async (req, res) => {
  try {
    const { teamId } = req.query;

    const where = teamId ? { teamId: parseInt(teamId) } : {};

    const players = await prisma.player.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(players);
  } catch (error) {
    console.error("Get players error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single player (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id: parseInt(id) },
      include: {
        team: true,
      },
    });

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    res.json(player);
  } catch (error) {
    console.error("Get player error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create player (admin only)
router.post("/", async (req, res) => {
  try {
    const { name, teamId } = req.body;

    if (!name || !teamId) {
      return res.status(400).json({ error: "Name and teamId are required" });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId) },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const player = await prisma.player.create({
      data: {
        name,
        teamId: parseInt(teamId),
      },
    });

    res.status(201).json(player);
  } catch (error) {
    console.error("Create player error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update player (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, teamId } = req.body;

    const data = { name };
    if (teamId) {
      data.teamId = parseInt(teamId);
    }

    const player = await prisma.player.update({
      where: { id: parseInt(id) },
      data,
    });

    res.json(player);
  } catch (error) {
    console.error("Update player error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete player (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.player.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Delete player error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
