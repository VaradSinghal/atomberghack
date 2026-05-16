const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const router = express.Router();

// GET /api/audit — full audit log
router.get("/", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const { goalId, userId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (goalId) where.goalId = goalId;
    if (userId) where.changedById = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          goal: { select: { title: true, user: { select: { name: true } } } },
          changedBy: { select: { name: true, role: true } },
        },
        orderBy: { timestamp: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;
