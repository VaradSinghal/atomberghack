const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const ExcelJS = require("exceljs");
const router = express.Router();

// GET /api/reports/achievement — achievement report data
router.get("/achievement", authenticate, roleGuard("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "MANAGER") {
      where.user = { managerId: req.user.id };
    }
    const goals = await prisma.goal.findMany({
      where: { ...where, status: "APPROVED" },
      include: {
        user: { select: { name: true, email: true, department: true } },
        achievements: { orderBy: { quarter: "asc" } },
      },
      orderBy: [{ user: { name: "asc" } }, { createdAt: "asc" }],
    });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// GET /api/reports/achievement/export — download Excel
router.get("/achievement/export", authenticate, roleGuard("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "MANAGER") where.user = { managerId: req.user.id };

    const goals = await prisma.goal.findMany({
      where: { ...where, status: "APPROVED" },
      include: {
        user: { select: { name: true, email: true, department: true } },
        achievements: { orderBy: { quarter: "asc" } },
      },
      orderBy: [{ user: { name: "asc" } }],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Achievement Report");

    sheet.columns = [
      { header: "Employee", key: "employee", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Goal", key: "goal", width: 35 },
      { header: "UoM", key: "uom", width: 15 },
      { header: "Target", key: "target", width: 12 },
      { header: "Weightage", key: "weightage", width: 12 },
      { header: "Q1 Actual", key: "q1", width: 12 },
      { header: "Q1 Score", key: "q1s", width: 10 },
      { header: "Q2 Actual", key: "q2", width: 12 },
      { header: "Q2 Score", key: "q2s", width: 10 },
      { header: "Q3 Actual", key: "q3", width: 12 },
      { header: "Q3 Score", key: "q3s", width: 10 },
      { header: "Q4 Actual", key: "q4", width: 12 },
      { header: "Q4 Score", key: "q4s", width: 10 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4263EB" } };

    for (const goal of goals) {
      const getQ = (q) => goal.achievements.find((a) => a.quarter === q);
      sheet.addRow({
        employee: goal.user.name,
        department: goal.user.department || "-",
        goal: goal.title,
        uom: goal.uomType,
        target: goal.target,
        weightage: `${goal.weightage}%`,
        q1: getQ("Q1")?.actualValue ?? "-",
        q1s: getQ("Q1")?.score != null ? `${getQ("Q1").score}%` : "-",
        q2: getQ("Q2")?.actualValue ?? "-",
        q2s: getQ("Q2")?.score != null ? `${getQ("Q2").score}%` : "-",
        q3: getQ("Q3")?.actualValue ?? "-",
        q3s: getQ("Q3")?.score != null ? `${getQ("Q3").score}%` : "-",
        q4: getQ("Q4")?.actualValue ?? "-",
        q4s: getQ("Q4")?.score != null ? `${getQ("Q4").score}%` : "-",
      });
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=achievement_report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export" });
  }
});

// GET /api/reports/completion — completion dashboard
router.get("/completion", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const { quarter } = req.query;
    const users = await prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
      select: {
        id: true, name: true, email: true, role: true, department: true,
        goals: {
          select: {
            id: true, status: true,
            achievements: quarter ? { where: { quarter } } : true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const report = users.map((u) => {
      const totalGoals = u.goals.length;
      const submitted = u.goals.filter((g) => g.status !== "DRAFT").length;
      const approved = u.goals.filter((g) => g.status === "APPROVED").length;
      const checkinsDone = u.goals.filter((g) =>
        g.achievements.some((a) => a.actualValue !== null)
      ).length;
      return {
        ...u, goals: undefined,
        totalGoals, submitted, approved, checkinsDone,
        goalSubmissionComplete: totalGoals > 0 && submitted === totalGoals,
        checkinComplete: approved > 0 && checkinsDone === approved,
      };
    });

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch completion data" });
  }
});

module.exports = router;
