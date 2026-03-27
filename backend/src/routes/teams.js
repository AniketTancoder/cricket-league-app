import express from "express";
import prisma from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/logos");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// Get all teams (public - no auth required)
router.get("/", async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        players: true,
        pointsTable: true,
      },
      orderBy: { name: "asc" },
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const teamsWithFullLogoUrl = teams.map((team) => ({
      ...team,
      logo: team.logo ? `${baseUrl}${team.logo}` : null,
    }));

    res.json(teamsWithFullLogoUrl);
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single team (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        players: true,
        pointsTable: true,
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    res.json({
      ...team,
      logo: team.logo ? `${baseUrl}${team.logo}` : null,
    });
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create team (admin only)
router.post("/", async (req, res) => {
  try {
    const { name, logo } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Team name is required" });
    }

    // Check if team already exists
    const existingTeam = await prisma.team.findUnique({
      where: { name },
    });

    if (existingTeam) {
      return res.status(400).json({ error: "Team name already exists" });
    }

    const team = await prisma.team.create({
      data: {
        name,
        logo: logo || null,
      },
    });

    // Create initial points table entry
    await prisma.pointsTable.create({
      data: {
        teamId: team.id,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    console.error("Create team error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update team (admin only)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo } = req.body;

    const team = await prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        name,
        logo,
      },
    });

    res.json(team);
  } catch (error) {
    console.error("Update team error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete team (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id);

    // First delete related records in proper order

    // 1. Delete matches where this team is team1 or team2
    await prisma.match.deleteMany({
      where: {
        OR: [{ team1Id: teamId }, { team2Id: teamId }],
      },
    });

    // 2. Delete players
    await prisma.player.deleteMany({
      where: { teamId },
    });

    // 3. Delete points table
    await prisma.pointsTable.deleteMany({
      where: { teamId },
    });

    // 4. Delete the team
    await prisma.team.delete({
      where: { id: teamId },
    });

    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Delete team error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create team with logo (admin only) - uses multipart/form-data
router.post("/with-logo", upload.single("logo"), async (req, res) => {
  try {
    const { name } = req.body;
    const logoFile = req.file;

    if (!name) {
      return res.status(400).json({ error: "Team name is required" });
    }

    // Check if team already exists
    const existingTeam = await prisma.team.findUnique({
      where: { name },
    });

    if (existingTeam) {
      return res.status(400).json({ error: "Team name already exists" });
    }

    // Save logo path
    const logoPath = logoFile ? `/uploads/logos/${logoFile.filename}` : null;

    const team = await prisma.team.create({
      data: {
        name,
        logo: logoPath,
      },
    });

    // Create initial points table entry
    await prisma.pointsTable.create({
      data: {
        teamId: team.id,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    console.error("Create team with logo error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
