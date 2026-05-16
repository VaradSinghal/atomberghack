const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const router = express.Router();

// GET /api/escalations
router.get("/", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const escalations = await prisma.escalation.findMany({
      include: { targetUser: { select: { name: true, email: true, role: true } } },
      orderBy: { triggeredAt: "desc" },
    });
    const rules = await prisma.escalationRule.findMany({ orderBy: { daysAfter: "asc" } });
    res.json({ escalations, rules });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch escalations" });
  }
});

// POST /api/escalations/rules
router.post("/rules", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const { ruleType, daysAfter, notifyRole } = req.body;
    const rule = await prisma.escalationRule.create({
      data: { ruleType, daysAfter: parseInt(daysAfter), notifyRole },
    });
    res.status(201).json({ rule });
  } catch (error) {
    res.status(500).json({ error: "Failed to create rule" });
  }
});

// POST /api/escalations/:id/resolve
router.post("/:id/resolve", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const escalation = await prisma.escalation.update({
      where: { id: req.params.id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    res.json({ escalation });
  } catch (error) {
    res.status(500).json({ error: "Failed to resolve escalation" });
  }
});

module.exports = router;
