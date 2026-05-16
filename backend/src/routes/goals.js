const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const { logGoalChanges, logAuditChange } = require("../services/auditService");

const router = express.Router();

// GET /api/goals — get my goals (employee) or team goals (manager)
router.get("/", authenticate, async (req, res) => {
  try {
    const { role, id } = req.user;
    let goals;

    if (role === "MANAGER") {
      // Get direct reports' goals
      goals = await prisma.goal.findMany({
        where: {
          user: { managerId: id },
        },
        include: {
          user: { select: { id: true, name: true, email: true, department: true } },
          achievements: true,
          approvals: { orderBy: { timestamp: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "ADMIN") {
      goals = await prisma.goal.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, department: true } },
          achievements: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      goals = await prisma.goal.findMany({
        where: { userId: id },
        include: {
          achievements: true,
          approvals: { orderBy: { timestamp: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json({ goals });
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// GET /api/goals/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        achievements: { orderBy: { quarter: "asc" } },
        approvals: { orderBy: { timestamp: "desc" }, include: { manager: { select: { name: true } } } },
        checkinComments: { orderBy: { timestamp: "desc" }, include: { manager: { select: { name: true } } } },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Check access
    const { role, id } = req.user;
    if (role === "EMPLOYEE" && goal.userId !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ goal });
  } catch (error) {
    console.error("Get goal error:", error);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// POST /api/goals — create draft goal
router.post("/", authenticate, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const { thrustArea, title, description, uomType, target, targetDate, weightage } = req.body;

    // Check max 8 goals
    const existingCount = await prisma.goal.count({
      where: { userId: req.user.id, cycle: { isActive: true } },
    });

    if (existingCount >= 8) {
      return res.status(400).json({ error: "Maximum 8 goals per employee. You already have " + existingCount + " goals." });
    }

    // Check min 10% weightage
    if (weightage < 10) {
      return res.status(400).json({ error: "Minimum weightage per goal is 10%" });
    }

    // Get active cycle
    const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) {
      return res.status(400).json({ error: "No active goal cycle found" });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        cycleId: activeCycle.id,
        thrustArea,
        title,
        description,
        uomType,
        target: parseFloat(target),
        targetDate: targetDate ? new Date(targetDate) : null,
        weightage: parseFloat(weightage),
        status: "DRAFT",
      },
      include: { achievements: true },
    });

    res.status(201).json({ goal });
  } catch (error) {
    console.error("Create goal error:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// PUT /api/goals/:id — edit draft goal
router.put("/:id", authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Employees can only edit their own draft/returned goals
    if (req.user.role === "EMPLOYEE") {
      if (goal.userId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (goal.locked) {
        return res.status(403).json({ error: "Cannot edit a locked goal" });
      }
      if (!["DRAFT", "RETURNED"].includes(goal.status)) {
        return res.status(400).json({ error: "Can only edit draft or returned goals" });
      }
    }

    // Managers can edit during approval
    if (req.user.role === "MANAGER" && goal.locked && goal.status === "APPROVED") {
      return res.status(403).json({ error: "Cannot edit an approved locked goal" });
    }

    const { thrustArea, title, description, uomType, target, targetDate, weightage } = req.body;

    // Audit log for locked goal changes
    if (goal.locked) {
      await logGoalChanges(goal.id, req.user.id, goal, req.body);
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: {
        thrustArea: thrustArea || goal.thrustArea,
        title: title || goal.title,
        description: description !== undefined ? description : goal.description,
        uomType: uomType || goal.uomType,
        target: target !== undefined ? parseFloat(target) : goal.target,
        targetDate: targetDate ? new Date(targetDate) : goal.targetDate,
        weightage: weightage !== undefined ? parseFloat(weightage) : goal.weightage,
        status: goal.status === "RETURNED" ? "DRAFT" : goal.status,
      },
      include: { achievements: true },
    });

    res.json({ goal: updatedGoal });
  } catch (error) {
    console.error("Update goal error:", error);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// POST /api/goals/submit — submit all draft goals
router.post("/submit", authenticate, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) {
      return res.status(400).json({ error: "No active goal cycle found" });
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: req.user.id,
        cycleId: activeCycle.id,
        status: { in: ["DRAFT", "RETURNED"] },
      },
    });

    if (goals.length === 0) {
      return res.status(400).json({ error: "No draft goals to submit" });
    }

    // Validate total weightage = 100%
    const allGoals = await prisma.goal.findMany({
      where: { userId: req.user.id, cycleId: activeCycle.id },
    });

    const totalWeightage = allGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return res.status(400).json({
        error: `Total weightage must equal exactly 100%. Current total: ${totalWeightage}%`,
        currentTotal: totalWeightage,
      });
    }

    // Check min weightage per goal
    const invalidGoal = allGoals.find((g) => g.weightage < 10);
    if (invalidGoal) {
      return res.status(400).json({
        error: `Each goal must have at least 10% weightage. "${invalidGoal.title}" has ${invalidGoal.weightage}%`,
      });
    }

    // Submit all draft goals
    await prisma.goal.updateMany({
      where: {
        userId: req.user.id,
        cycleId: activeCycle.id,
        status: { in: ["DRAFT", "RETURNED"] },
      },
      data: { status: "SUBMITTED" },
    });

    const updatedGoals = await prisma.goal.findMany({
      where: { userId: req.user.id, cycleId: activeCycle.id },
      include: { achievements: true },
    });

    res.json({ goals: updatedGoals, message: "Goals submitted successfully" });
  } catch (error) {
    console.error("Submit goals error:", error);
    res.status(500).json({ error: "Failed to submit goals" });
  }
});

// POST /api/goals/:id/approve — approve goal (manager)
router.post("/:id/approve", authenticate, roleGuard("MANAGER"), async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (goal.user.managerId !== req.user.id) {
      return res.status(403).json({ error: "You are not this employee's manager" });
    }

    if (goal.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Goal must be in submitted status to approve" });
    }

    const { editedTarget, editedWeightage, comment } = req.body;

    // If manager edited values, log and update
    const updateData = {
      status: "APPROVED",
      locked: true,
    };

    if (editedTarget !== undefined) {
      updateData.target = parseFloat(editedTarget);
    }
    if (editedWeightage !== undefined) {
      updateData.weightage = parseFloat(editedWeightage);
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: updateData,
      include: { achievements: true, user: { select: { id: true, name: true, email: true } } },
    });

    // Create approval record
    await prisma.goalApproval.create({
      data: {
        goalId: goal.id,
        managerId: req.user.id,
        action: editedTarget || editedWeightage ? "EDITED_AND_APPROVED" : "APPROVED",
        comment: comment || null,
      },
    });

    // Audit log for edits
    if (editedTarget !== undefined && editedTarget !== goal.target) {
      await logAuditChange(goal.id, req.user.id, "target", goal.target, editedTarget);
    }
    if (editedWeightage !== undefined && editedWeightage !== goal.weightage) {
      await logAuditChange(goal.id, req.user.id, "weightage", goal.weightage, editedWeightage);
    }

    res.json({ goal: updatedGoal, message: "Goal approved and locked" });
  } catch (error) {
    console.error("Approve goal error:", error);
    res.status(500).json({ error: "Failed to approve goal" });
  }
});

// POST /api/goals/:id/return — return for rework (manager)
router.post("/:id/return", authenticate, roleGuard("MANAGER"), async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (goal.user.managerId !== req.user.id) return res.status(403).json({ error: "Not your report" });
    if (goal.status !== "SUBMITTED") return res.status(400).json({ error: "Goal must be submitted" });

    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: "Comment is required when returning for rework" });

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { status: "RETURNED" },
      include: { achievements: true, user: { select: { id: true, name: true, email: true } } },
    });

    await prisma.goalApproval.create({
      data: {
        goalId: goal.id,
        managerId: req.user.id,
        action: "RETURNED",
        comment,
      },
    });

    res.json({ goal: updatedGoal, message: "Goal returned for rework" });
  } catch (error) {
    console.error("Return goal error:", error);
    res.status(500).json({ error: "Failed to return goal" });
  }
});

// POST /api/goals/:id/unlock — unlock locked goal (admin only)
router.post("/:id/unlock", authenticate, roleGuard("ADMIN"), async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (!goal.locked) return res.status(400).json({ error: "Goal is not locked" });

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { locked: false },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logAuditChange(goal.id, req.user.id, "locked", "true", "false");

    res.json({ goal: updatedGoal, message: "Goal unlocked" });
  } catch (error) {
    console.error("Unlock goal error:", error);
    res.status(500).json({ error: "Failed to unlock goal" });
  }
});

// DELETE /api/goals/:id — delete draft goal
router.delete("/:id", authenticate, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (goal.userId !== req.user.id) return res.status(403).json({ error: "Not your goal" });
    if (goal.status !== "DRAFT") return res.status(400).json({ error: "Can only delete draft goals" });

    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ message: "Goal deleted" });
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// POST /api/goals/approve-all — approve all submitted goals for an employee (manager)
router.post("/approve-all/:userId", authenticate, roleGuard("MANAGER"), async (req, res) => {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!targetUser || targetUser.managerId !== req.user.id) {
      return res.status(403).json({ error: "Not your report" });
    }

    const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    const goals = await prisma.goal.findMany({
      where: { userId: req.params.userId, cycleId: activeCycle.id, status: "SUBMITTED" },
    });

    if (goals.length === 0) {
      return res.status(400).json({ error: "No submitted goals to approve" });
    }

    // Validate total = 100%
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    const allUserGoals = await prisma.goal.findMany({
      where: { userId: req.params.userId, cycleId: activeCycle.id },
    });
    const fullTotal = allUserGoals.reduce((sum, g) => sum + g.weightage, 0);

    if (Math.abs(fullTotal - 100) > 0.01) {
      return res.status(400).json({ error: `Total weightage is ${fullTotal}%, must be 100%` });
    }

    await prisma.goal.updateMany({
      where: { userId: req.params.userId, cycleId: activeCycle.id, status: "SUBMITTED" },
      data: { status: "APPROVED", locked: true },
    });

    for (const goal of goals) {
      await prisma.goalApproval.create({
        data: { goalId: goal.id, managerId: req.user.id, action: "APPROVED" },
      });
    }

    res.json({ message: `${goals.length} goals approved and locked` });
  } catch (error) {
    console.error("Approve all error:", error);
    res.status(500).json({ error: "Failed to approve goals" });
  }
});

module.exports = router;
