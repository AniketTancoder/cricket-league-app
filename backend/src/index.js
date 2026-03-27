// Server entry point
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
import authRoutes from "./routes/auth.js";
import teamRoutes from "./routes/teams.js";
import playerRoutes from "./routes/players.js";
import matchRoutes from "./routes/matches.js";
import pointsRoutes from "./routes/points.js";
import playoffRoutes from "./routes/playoffs.js";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/playoffs", playoffRoutes);

// Environment-specific configuration
const isRailway = process.env.RAILWAY_DATABASE_URL;
const databaseUrl = isRailway
  ? process.env.RAILWAY_DATABASE_URL
  : process.env.DATABASE_URL;
const jwtSecret = isRailway
  ? process.env.RAILWAY_JWT_SECRET
  : process.env.JWT_SECRET;
const port = isRailway ? process.env.RAILWAY_PORT : process.env.PORT || 5000;
const frontendUrl = isRailway
  ? process.env.RAILWAY_FRONTEND_URL
  : process.env.FRONTEND_URL || "http://localhost:5173";

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle multer errors (file upload errors)
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: "File too large. Maximum size is 5MB." });
    }
    return res.status(400).json({ error: err.message });
  }

  // Handle other errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ error: message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${isRailway ? "Railway" : "Local"}`);
  console.log(`Database: ${databaseUrl}`);
  console.log(`Frontend URL: ${frontendUrl}`);
});
