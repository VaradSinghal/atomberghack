const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");

const router = express.Router();

// GET /api/checkins/team
router.get("/team", authenticate, roleGuard("MANAGER"), async (req, res) => {
  try {
    const { quarter } = req.query;
    const reports = await prisma.user.findMany({
      where: { managerId: req.user.id },
      select: {
        id: true, name: true, email: true, department: true,
        goals: {
          where: { status: "APPROVED" },
          include: {
            achievements: quarter ? { where: { quarter } } : true,
            checkinComments: {
              where: quarter ? { quarter, managerId: req.user.id } : { managerId: req.user.id },
              orderBy: { timestamp: "desc" },
            },
          },
        },
      },
    });
    res.json({ team: reports });
  } catch (error) {
    console.error("Get team checkins error:", error);
    res.status(500).json({ error: "Failed to fetch team data" });
  }
});

// POST /api/checkins/:goalId/:quarter
router.post("/:goalId/:quarter", authenticate, roleGuard("MANAGER"), async (req, res) => {
  try {
    const { goalId, quarter } = req.params;
    const { comment } = req.body;
    if (!comment?.trim()) return res.status(400).json({ error: "Comment is required" });

    const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { user: true } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (goal.user.managerId !== req.user.id) return res.status(403).json({ error: "Not your report" });

    const checkinComment = await prisma.checkinComment.create({
      data: { goalId, managerId: req.user.id, quarter, comment: comment.trim() },
      include: { manager: { select: { name: true } } },
    });
    res.json({ checkinComment, message: "Check-in comment added" });
  } catch (error) {
    console.error("Add checkin error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

module.exports = router;
