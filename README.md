# GoalTrack — AtomQuest Hackathon 1.0

A complete, multi-role web-based Goal Setting & Tracking Portal built for the full employee performance lifecycle — from goal creation to quarterly check-ins and final annual appraisal.

## 🚀 Architecture & Tech Stack

This project uses a modern, cost-optimized, and type-safe architecture:

### Frontend
- **React 18 (Vite)**: Fast, component-based UI perfect for role-based dashboards.
- **TailwindCSS v4 & shadcn-like Custom CSS**: Premium, responsive glass-morphic design system.
- **Zustand**: Lightweight global state management (Auth, Goals, Cycles).
- **Recharts**: Advanced data visualization for the Analytics dashboard.
- **Axios & Sonner**: Robust API communication and elegant toast notifications.

### Backend
- **Node.js + Express**: Minimalist, fast, and scalable REST API.
- **Prisma ORM (v7)**: Type-safe database interactions and schema migrations.
- **PostgreSQL (Supabase)**: Reliable, relational database with pooling (`pgbouncer`).
- **JWT (JSON Web Tokens) & bcryptjs**: Secure, stateless role-based authentication.
- **ExcelJS**: For generating formatted, downloadable Excel achievement reports.

### Key Features Implemented

1. **Strict Business Validations**: Enforced 100% total weightage, 10% minimum per goal, and max 8 goals.
2. **Three Distinct Roles**: Dedicated flows for `EMPLOYEE`, `MANAGER`, and `ADMIN`.
3. **Advanced UoM Scoring**: Server-side score computation for Numeric (Min/Max), Timeline, and Zero-based goals.
4. **Audit Trail**: Every change to a locked goal is automatically logged via Prisma middleware/services.
5. **Real-time Analytics**: QoQ trend lines, department heatmaps, and distribution charts.
6. **Excel Exports**: Managers and Admins can download full planned vs. actual reports.

---

## 🛠 Local Setup & Running the Project

### Prerequisites
- Node.js v18+
- A Supabase project (or any PostgreSQL database)

### 1. Database Configuration
1. Create a Supabase project and get your connection strings.
2. In the `backend` directory, update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
   JWT_SECRET="your-secret"
   ```

### 2. Backend Setup
```bash
cd backend
npm install
npm run db:push     # Push schema to Supabase
npm run db:generate # Generate Prisma client
npm run seed        # Load demo users and goals
npm run dev         # Start API server on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev         # Start React app on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

The `npm run seed` command automatically populates these accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Employee** | `alice@company.com` | `demo123` | Has 4 draft goals ready to submit. |
| **Manager** | `bob@company.com` | `demo123` | Manages Alice and Carol. |
| **Employee** | `carol@company.com` | `demo123` | Has approved goals; can demo entering Q1/Q2 achievements. |
| **Admin** | `admin@company.com` | `demo123` | Has full access to cycles, reports, and escalations. |

*Tip: Use the quick-login buttons on the login page for fast switching during the demo.*

---

## 💡 Hackathon Evaluation Notes

We have specifically focused on the key scoring criteria:
- **Validations**: Try submitting a goal sheet with 95% weightage; the system blocks it with a clear error.
- **Role Journeys**: The sidebar and dashboards dynamically adapt. Notice how Bob (Manager) has inline-editing capabilities on the approval screen.
- **Reporting**: The Admin completion dashboard aggregates data efficiently, and the Excel export generates a properly formatted spreadsheet.
- **Bonus Modules**: Analytics (Recharts) and Escalation Rules are fully implemented.
