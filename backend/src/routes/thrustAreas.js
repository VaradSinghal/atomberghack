const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const router = express.Router();

// GET /api/thrust-areas
router.get("/", authenticate, async (req, res) => {
  try {
    const areas = await prisma.thrustArea.findMany({ orderBy: { name: "asc" } });
    res.json({ thrustAreas: areas });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch thrust areas" });
  }
});

// POST /api/thrust-areas
router.post("/", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const area = await prisma.thrustArea.create({ data: { name } });
    res.status(201).json({ thrustArea: area });
  } catch (error) {
    if (error.code === "P2002") return res.status(400).json({ error: "Thrust area already exists" });
    res.status(500).json({ error: "Failed to create thrust area" });
  }
});

module.exports = router;
