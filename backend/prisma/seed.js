const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Customer Success"];
const THRUST_AREAS = ["Core Business", "Innovation", "Quality", "Efficiency", "Team Growth"];

const GOAL_TEMPLATES = {
  Engineering: [
    { title: "Ship v2.0 Platform", uom: "TIMELINE", target: 100, min: 60, max: 100 },
    { title: "Reduce P0 bugs", uom: "NUMERIC_MIN", target: 5, min: 2, max: 15 },
    { title: "Improve Test Coverage", uom: "NUMERIC_MAX", target: 90, min: 60, max: 95 },
    { title: "Zero Downtime Deployments", uom: "ZERO", target: 0, min: 0, max: 1 },
    { title: "Optimize API Latency", uom: "NUMERIC_MIN", target: 100, min: 80, max: 300 },
  ],
  Sales: [
    { title: "Quarterly Revenue", uom: "NUMERIC_MAX", target: 500000, min: 200000, max: 600000 },
    { title: "New Enterprise Logos", uom: "NUMERIC_MAX", target: 10, min: 2, max: 15 },
    { title: "Reduce Churn Rate", uom: "NUMERIC_MIN", target: 2, min: 1, max: 8 },
    { title: "Sales Training Completed", uom: "TIMELINE", target: 100, min: 50, max: 100 },
  ],
  Marketing: [
    { title: "Increase Inbound Leads", uom: "NUMERIC_MAX", target: 1000, min: 400, max: 1200 },
    { title: "Launch Global Campaign", uom: "TIMELINE", target: 100, min: 40, max: 100 },
    { title: "Lower CAC", uom: "NUMERIC_MIN", target: 150, min: 100, max: 300 },
    { title: "Brand Mentions", uom: "NUMERIC_MAX", target: 500, min: 200, max: 600 },
  ],
  HR: [
    { title: "Hire 50 Engineers", uom: "NUMERIC_MAX", target: 50, min: 10, max: 60 },
    { title: "Employee Satisfaction", uom: "NUMERIC_MAX", target: 8.5, min: 5.0, max: 9.5 },
    { title: "Reduce Time-to-Hire", uom: "NUMERIC_MIN", target: 30, min: 20, max: 60 },
    { title: "Diversity Initiatives", uom: "TIMELINE", target: 100, min: 50, max: 100 },
  ],
  Finance: [
    { title: "Reduce OPEX by 10%", uom: "NUMERIC_MIN", target: 10, min: 5, max: 20 },
    { title: "Audit Completion", uom: "TIMELINE", target: 100, min: 50, max: 100 },
    { title: "Increase Gross Margin", uom: "NUMERIC_MAX", target: 65, min: 40, max: 70 },
  ],
  Operations: [
    { title: "Supply Chain Optimization", uom: "TIMELINE", target: 100, min: 40, max: 100 },
    { title: "Reduce Vendor Costs", uom: "NUMERIC_MIN", target: 15, min: 5, max: 30 },
    { title: "Compliance Training", uom: "NUMERIC_MAX", target: 100, min: 60, max: 100 },
  ],
  "Customer Success": [
    { title: "Net Promoter Score", uom: "NUMERIC_MAX", target: 70, min: 30, max: 80 },
    { title: "Reduce Resolution Time", uom: "NUMERIC_MIN", target: 12, min: 8, max: 48 },
    { title: "Upsell Revenue", uom: "NUMERIC_MAX", target: 100000, min: 20000, max: 120000 },
  ]
};

const FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getScore = (actual, target, uom) => {
  if (actual == null) return null;
  if (uom === "ZERO") return actual <= target ? 100 : 0;
  if (target === 0) return 0;
  
  let s = 0;
  if (uom === "NUMERIC_MAX" || uom === "TIMELINE") {
    s = (actual / target) * 100;
  } else if (uom === "NUMERIC_MIN") {
    s = (target / actual) * 100;
  }
  return Math.min(Math.round(s * 100) / 100, 150);
};

async function main() {
  console.log("🌊 Commencing Mega-Flood of the Database...");

  // 1. Clean Database
  await prisma.goalApproval.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.escalationRule.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.thrustArea.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo123", 10);

  // 2. Base Metadata
  await prisma.cycle.create({ data: { name: "FY 2026-27", isActive: true } });
  const cycle = await prisma.cycle.findFirst();

  for (const name of THRUST_AREAS) {
    await prisma.thrustArea.create({ data: { name } });
  }

  const rules = [
    await prisma.escalationRule.create({ data: { ruleType: "GOAL_SETTING_DELAY", daysAfter: 14, notifyRole: "MANAGER" } }),
    await prisma.escalationRule.create({ data: { ruleType: "CHECKIN_DELAY", daysAfter: 7, notifyRole: "MANAGER" } })
  ];

  // 3. Create Specific Demo Accounts FIRST (to guarantee they exist and get specific IDs/Managers)
  const admin = await prisma.user.create({ data: { name: "Admin Setup", email: "admin@company.com", passwordHash, role: "ADMIN", department: "IT" } });
  
  // Create Managers for the core demo people
  const bobManager = await prisma.user.create({ data: { name: "Bob Manager", email: "bob@company.com", passwordHash, role: "MANAGER", department: "Sales" } });
  const engManager = await prisma.user.create({ data: { name: "Eve Manager", email: "eve@company.com", passwordHash, role: "MANAGER", department: "Engineering" } });

  // Create core demo Employees
  const alice = await prisma.user.create({ data: { name: "Alice Employee", email: "alice@company.com", passwordHash, role: "EMPLOYEE", department: "Sales", managerId: bobManager.id } });
  const carol = await prisma.user.create({ data: { name: "Carol Employee", email: "carol@company.com", passwordHash, role: "EMPLOYEE", department: "Engineering", managerId: engManager.id } });

  // 4. Create Mass Managers (1 per department)
  const managerMap = { Sales: bobManager.id, Engineering: engManager.id };
  for (const dept of DEPARTMENTS) {
    if (!managerMap[dept]) {
      const fn = rand(FIRST_NAMES);
      const ln = rand(LAST_NAMES);
      const m = await prisma.user.create({
        data: { name: `${fn} ${ln}`, email: `${fn.toLowerCase()}.${ln.toLowerCase()}_mgr_${dept.replace(/\s/g, '')}@company.com`, passwordHash, role: "MANAGER", department: dept }
      });
      managerMap[dept] = m.id;
    }
  }

  // 5. Create Mass Employees
  const allEmployees = [alice, carol];
  for (let i = 0; i < 50; i++) {
    const fn = rand(FIRST_NAMES);
    const ln = rand(LAST_NAMES);
    const dept = rand(DEPARTMENTS);
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@company.com`;
    
    const emp = await prisma.user.create({
      data: { name: `${fn} ${ln}`, email, passwordHash, role: "EMPLOYEE", department: dept, managerId: managerMap[dept] }
    });
    allEmployees.push(emp);
  }

  // Generate goals for Managers too (so they show up in completion tracking)
  const allUsersToGetGoals = [...allEmployees];
  for (const dept in managerMap) {
    const mUser = await prisma.user.findUnique({ where: { id: managerMap[dept] } });
    if (mUser) allUsersToGetGoals.push(mUser);
  }

  // 6. Generate Goals and Achievements for EVERYONE
  let totalGoalsCreated = 0;
  for (const user of allUsersToGetGoals) {
    const deptTemplates = GOAL_TEMPLATES[user.department] || GOAL_TEMPLATES["Engineering"];
    
    // Pick 3-5 random goals
    const numGoals = randInt(3, 5);
    // Shuffle and slice
    const selectedTemplates = [...deptTemplates].sort(() => 0.5 - Math.random()).slice(0, numGoals);
    
    // Distribute 100% weightage
    let weights = [];
    let remaining = 100;
    for (let i = 0; i < numGoals - 1; i++) {
      const w = randInt(15, Math.floor(remaining / 2));
      weights.push(w);
      remaining -= w;
    }
    weights.push(remaining); // exact 100 total

    // Random status
    const r = Math.random();
    let status = "APPROVED";
    let locked = true;
    if (r > 0.85) { status = "SUBMITTED"; locked = false; }
    else if (r > 0.92) { status = "DRAFT"; locked = false; }
    else if (r > 0.97) { status = "RETURNED"; locked = false; }

    for (let i = 0; i < selectedTemplates.length; i++) {
      const t = selectedTemplates[i];
      const goal = await prisma.goal.create({
        data: {
          userId: user.id,
          cycleId: cycle.id,
          thrustArea: rand(THRUST_AREAS),
          title: t.title,
          description: `Strategic objective targeting ${t.title} for ${user.department}`,
          uomType: t.uom,
          target: t.target,
          weightage: weights[i],
          status: status,
          locked: locked,
        }
      });
      totalGoalsCreated++;

      // Create Approval Record if not draft
      if (status !== "DRAFT") {
        await prisma.goalApproval.create({
          data: {
            goalId: goal.id,
            managerId: user.managerId || admin.id,
            action: status === "SUBMITTED" ? "PENDING" : status,
          }
        });
      }

      // Generate Quarterly Achievements if Approved
      if (status === "APPROVED") {
        for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
          // Add some randomness so not everything is perfectly filled, especially Q4
          let actual = null;
          let score = null;
          
          if (q === "Q1" || q === "Q2") {
            actual = randInt(t.min, t.max);
          } else if (q === "Q3" && Math.random() > 0.3) {
            actual = randInt(t.min, t.max);
          } else if (q === "Q4" && Math.random() > 0.8) {
            actual = randInt(t.min, t.max);
          }

          if (actual !== null) {
            score = getScore(actual, t.target, t.uom);
          }

          await prisma.achievement.create({
            data: {
              goalId: goal.id,
              quarter: q,
              actualValue: actual,
              score: score,
            }
          });

          if (actual !== null && Math.random() > 0.5) {
            await prisma.checkinComment.create({
              data: {
                goalId: goal.id,
                managerId: user.managerId || admin.id,
                quarter: q,
                comment: "Good progress so far. Keep it up."
              }
            });
          }
        }
      } else {
        // Just create empty achievements
        for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
          await prisma.achievement.create({ data: { goalId: goal.id, quarter: q, actualValue: null, score: null } });
        }
      }
    }
  }

  console.log(`✅ Seeded ${allEmployees.length} employees, 7 managers, 1 admin.`);
  console.log(`✅ Created ${totalGoalsCreated} goals with robust tracking data.`);
  console.log(`🎉 Demo Ready! Use alice@company.com, bob@company.com, carol@company.com, admin@company.com (password: demo123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
