const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { generateToken } = require("../utils/jwt");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        managerId: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    const { passwordHash, ...userData } = user;

    res.json({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
