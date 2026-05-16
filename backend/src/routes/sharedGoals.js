const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const router = express.Router();

// POST /api/shared-goals — push a goal to multiple employees
router.post("/", authenticate, roleGuard("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const { thrustArea, title, description, uomType, target, targetDate, recipientUserIds } = req.body;
    if (!recipientUserIds || recipientUserIds.length === 0) {
      return res.status(400).json({ error: "At least one recipient required" });
    }
    const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) return res.status(400).json({ error: "No active cycle" });

    const created = [];
    for (const userId of recipientUserIds) {
      // Check max 8 goals
      const count = await prisma.goal.count({ where: { userId, cycleId: activeCycle.id } });
      if (count >= 8) continue;

      const goal = await prisma.goal.create({
        data: {
          userId, cycleId: activeCycle.id, thrustArea, title, description,
          uomType, target: parseFloat(target), targetDate: targetDate ? new Date(targetDate) : null,
          weightage: 10, status: "DRAFT", isShared: true,
        },
      });
      created.push(goal);
    }
    res.status(201).json({ goals: created, message: `Shared goal pushed to ${created.length} employees` });
  } catch (error) {
    console.error("Share goal error:", error);
    res.status(500).json({ error: "Failed to share goal" });
  }
});

// GET /api/shared-goals
router.get("/", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { isShared: true },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shared goals" });
  }
});

module.exports = router;
