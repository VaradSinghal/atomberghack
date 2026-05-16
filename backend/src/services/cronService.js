const cron = require("node-cron");
const prisma = require("../lib/prisma");

// Run every day at midnight (0 0 * * *)
// For testing/hackathon purposes, we could run it more frequently, but let's stick to daily
const startCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏳ Running daily escalation check...");
    try {
      // Find all active goals
      const activeGoals = await prisma.goal.findMany({
        where: {
          cycle: { isActive: true },
          status: { in: ["DRAFT", "RETURNED", "SUBMITTED"] }, // Things that need action
        },
        include: { user: true },
      });

      const rules = await prisma.escalationRule.findMany();

      for (const goal of activeGoals) {
        // Simple logic: if updated more than X days ago and not approved
        const daysSinceUpdate = Math.floor((new Date() - new Date(goal.updatedAt)) / (1000 * 60 * 60 * 24));

        for (const rule of rules) {
          if (daysSinceUpdate >= rule.daysAfter) {
            // Check if escalation already exists for this rule and goal
            const existing = await prisma.escalation.findFirst({
              where: { goalId: goal.id, ruleId: rule.id },
            });

            if (!existing) {
              await prisma.escalation.create({
                data: {
                  goalId: goal.id,
                  ruleId: rule.id,
                  // Target user is employee for DRAFT, or manager for SUBMITTED
                  targetUserId: goal.status === "SUBMITTED" ? goal.user.managerId : goal.userId,
                },
              });
              console.log(`🚨 Escalation created for goal ${goal.id} (Rule: ${rule.ruleType})`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });
  console.log("📅 Cron jobs scheduled");
};

module.exports = { startCronJobs };
