const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const router = express.Router();

// GET /api/cycles/active
router.get("/active", authenticate, async (req, res) => {
  try {
    const cycle = await prisma.cycle.findFirst({
      where: { isActive: true },
      include: { phases: { orderBy: { openDate: "asc" } } },
    });
    res.json({ cycle });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cycle" });
  }
});

// POST /api/cycles
router.post("/", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const { name, phases } = req.body;
    // Deactivate existing cycles
    await prisma.cycle.updateMany({ where: { isActive: true }, data: { isActive: false } });
    const cycle = await prisma.cycle.create({
      data: {
        name,
        phases: {
          create: phases.map((p) => ({
            phase: p.phase,
            openDate: new Date(p.openDate),
            closeDate: new Date(p.closeDate),
          })),
        },
      },
      include: { phases: true },
    });
    res.status(201).json({ cycle });
  } catch (error) {
    console.error("Create cycle error:", error);
    res.status(500).json({ error: "Failed to create cycle" });
  }
});

// PUT /api/cycles/:id/phase — advance cycle phase
router.put("/:id/phase", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const { phase } = req.body;
    const cycle = await prisma.cycle.update({
      where: { id: req.params.id },
      data: { phase },
      include: { phases: true },
    });
    res.json({ cycle });
  } catch (error) {
    res.status(500).json({ error: "Failed to update phase" });
  }
});

module.exports = router;
