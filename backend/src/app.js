const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const goalRoutes = require("./routes/goals");
const achievementRoutes = require("./routes/achievements");
const checkinRoutes = require("./routes/checkins");
const cycleRoutes = require("./routes/cycles");
const sharedGoalRoutes = require("./routes/sharedGoals");
const reportRoutes = require("./routes/reports");
const auditRoutes = require("./routes/audit");
const thrustAreaRoutes = require("./routes/thrustAreas");
const escalationRoutes = require("./routes/escalations");
const { startCronJobs } = require("./services/cronService");

const app = express();

// Start background jobs
startCronJobs();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/cycles", cycleRoutes);
app.use("/api/shared-goals", sharedGoalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/thrust-areas", thrustAreaRoutes);
app.use("/api/escalations", escalationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 GoalTrack API running on port ${PORT}`);
  });
}

module.exports = app;
