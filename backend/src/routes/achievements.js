const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const { computeScore } = require("../services/scoreService");

const router = express.Router();

// GET /api/achievements/:goalId — all quarter achievements for a goal
router.get("/:goalId", authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.goalId },
      include: { achievements: { orderBy: { quarter: "asc" } } },
    });

    if (!goal) return res.status(404).json({ error: "Goal not found" });

    res.json({ achievements: goal.achievements });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

// PUT /api/achievements/:goalId/:quarter — update achievement
router.put("/:goalId/:quarter", authenticate, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { goalId, quarter } = req.params;
    const { actualValue, actualDate, status } = req.body;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (goal.userId !== req.user.id) return res.status(403).json({ error: "Not your goal" });
    if (goal.status !== "APPROVED") return res.status(400).json({ error: "Goal must be approved to enter achievements" });

    // Validate quarter
    const validQuarters = ["Q1", "Q2", "Q3", "Q4"];
    if (!validQuarters.includes(quarter)) {
      return res.status(400).json({ error: "Invalid quarter" });
    }

    // Compute score server-side
    const score = computeScore(
      goal.uomType,
      goal.target,
      actualValue !== undefined ? parseFloat(actualValue) : null,
      goal.targetDate,
      actualDate ? new Date(actualDate) : null
    );

    const achievement = await prisma.achievement.upsert({
      where: {
        goalId_quarter: { goalId, quarter },
      },
      update: {
        actualValue: actualValue !== undefined ? parseFloat(actualValue) : null,
        actualDate: actualDate ? new Date(actualDate) : null,
        status: status || "ON_TRACK",
        score,
      },
      create: {
        goalId,
        quarter,
        actualValue: actualValue !== undefined ? parseFloat(actualValue) : null,
        actualDate: actualDate ? new Date(actualDate) : null,
        status: status || "NOT_STARTED",
        score,
      },
    });

    res.json({ achievement, message: "Achievement updated" });
  } catch (error) {
    console.error("Update achievement error:", error);
    res.status(500).json({ error: "Failed to update achievement" });
  }
});

module.exports = router;
