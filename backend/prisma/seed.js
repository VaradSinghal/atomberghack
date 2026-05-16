const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.goalApproval.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.escalationRule.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.cyclePhaseDate.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.thrustArea.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("demo123", 10);

  // Create users
  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@company.com", passwordHash: hash, role: "ADMIN", department: "HR" },
  });

  const bob = await prisma.user.create({
    data: { name: "Bob Manager", email: "bob@company.com", passwordHash: hash, role: "MANAGER", department: "Engineering" },
  });

  const alice = await prisma.user.create({
    data: { name: "Alice Employee", email: "alice@company.com", passwordHash: hash, role: "EMPLOYEE", department: "Engineering", managerId: bob.id },
  });

  const carol = await prisma.user.create({
    data: { name: "Carol Employee", email: "carol@company.com", passwordHash: hash, role: "EMPLOYEE", department: "Engineering", managerId: bob.id },
  });

  console.log("✅ Users created");

  // Thrust Areas
  const thrustAreas = ["Revenue Growth", "Customer Experience", "Operational Excellence", "People Development"];
  for (const name of thrustAreas) {
    await prisma.thrustArea.create({ data: { name } });
  }
  console.log("✅ Thrust areas created");

  // Active Cycle
  const cycle = await prisma.cycle.create({
    data: {
      name: "FY 2026-27",
      phase: "GOAL_SETTING",
      isActive: true,
      phases: {
        create: [
          { phase: "GOAL_SETTING", openDate: new Date("2026-05-01"), closeDate: new Date("2026-06-30") },
          { phase: "Q1_CHECKIN", openDate: new Date("2026-07-01"), closeDate: new Date("2026-07-31") },
          { phase: "Q2_CHECKIN", openDate: new Date("2026-10-01"), closeDate: new Date("2026-10-31") },
          { phase: "Q3_CHECKIN", openDate: new Date("2027-01-01"), closeDate: new Date("2027-01-31") },
          { phase: "Q4_ANNUAL", openDate: new Date("2027-03-01"), closeDate: new Date("2027-04-30") },
        ],
      },
    },
  });
  console.log("✅ Cycle created");

  // Alice's goals — SUBMITTED (mix of UoM types)
  const aliceGoals = [
    { thrustArea: "Revenue Growth", title: "Achieve Sales Revenue Target", description: "Drive Q-on-Q sales revenue to hit annual target", uomType: "NUMERIC_MIN", target: 50000000, weightage: 30 },
    { thrustArea: "Operational Excellence", title: "Reduce Operational Costs", description: "Reduce department operational costs by optimizing processes", uomType: "NUMERIC_MAX", target: 2000000, weightage: 25 },
    { thrustArea: "Customer Experience", title: "Launch Product V2", description: "Ship product V2 with all planned features by deadline", uomType: "TIMELINE", target: 0, targetDate: new Date("2026-08-31"), weightage: 25 },
    { thrustArea: "Operational Excellence", title: "Zero Critical Defects", description: "Maintain zero critical production defects for the quarter", uomType: "ZERO", target: 0, weightage: 20 },
  ];

  for (const g of aliceGoals) {
    await prisma.goal.create({
      data: { ...g, userId: alice.id, cycleId: cycle.id, status: "SUBMITTED" },
    });
  }
  console.log("✅ Alice's goals created (SUBMITTED)");

  // Carol's goals — APPROVED with Q1 achievements
  const carolGoals = [
    { thrustArea: "Customer Experience", title: "Improve NPS Score", description: "Increase NPS from current 72 to target", uomType: "NUMERIC_MIN", target: 85, weightage: 40 },
    { thrustArea: "Operational Excellence", title: "Reduce Onboarding Time", description: "Reduce new hire onboarding time to under target days", uomType: "NUMERIC_MAX", target: 14, weightage: 30 },
    { thrustArea: "People Development", title: "Complete Team Training Program", description: "All team members complete mandatory training by deadline", uomType: "TIMELINE", target: 0, targetDate: new Date("2026-09-30"), weightage: 30 },
  ];

  for (const g of carolGoals) {
    const goal = await prisma.goal.create({
      data: { ...g, userId: carol.id, cycleId: cycle.id, status: "APPROVED", locked: true },
    });

    // Add approval record
    await prisma.goalApproval.create({
      data: { goalId: goal.id, managerId: bob.id, action: "APPROVED" },
    });

    // Add Q1 achievement
    let score = null;
    let actualValue = null;
    if (g.uomType === "NUMERIC_MIN") { actualValue = 78; score = (78 / 85) * 100; }
    if (g.uomType === "NUMERIC_MAX") { actualValue = 16; score = (14 / 16) * 100; }

    if (actualValue !== null) {
      await prisma.achievement.create({
        data: { goalId: goal.id, quarter: "Q1", actualValue, status: "ON_TRACK", score: Math.round(score * 100) / 100 },
      });
    }
  }
  console.log("✅ Carol's goals created (APPROVED + Q1 achievements)");

  // Escalation rules
  await prisma.escalationRule.createMany({
    data: [
      { ruleType: "GOAL_SUBMISSION", daysAfter: 14, notifyRole: "EMPLOYEE" },
      { ruleType: "GOAL_SUBMISSION", daysAfter: 21, notifyRole: "MANAGER" },
      { ruleType: "MANAGER_APPROVAL", daysAfter: 7, notifyRole: "MANAGER" },
      { ruleType: "CHECKIN", daysAfter: 10, notifyRole: "EMPLOYEE" },
    ],
  });
  console.log("✅ Escalation rules created");

  console.log("\n🎉 Seed complete! Demo credentials:");
  console.log("  alice@company.com / demo123 → Employee");
  console.log("  bob@company.com   / demo123 → Manager");
  console.log("  carol@company.com / demo123 → Employee");
  console.log("  admin@company.com / demo123 → Admin");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
