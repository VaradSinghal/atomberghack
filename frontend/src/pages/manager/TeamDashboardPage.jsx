import { useEffect } from "react";
import useGoalStore from "../../store/goalStore";
import StatusBadge from "../../components/shared/StatusBadge";
import { Users, Target, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TeamDashboardPage() {
  const { goals, fetchGoals, loading } = useGoalStore();
  const navigate = useNavigate();

  useEffect(() => { fetchGoals(); }, []);

  // Group goals by employee
  const grouped = {};
  goals.forEach((g) => {
    if (!g.user) return;
    if (!grouped[g.user.id]) grouped[g.user.id] = { user: g.user, goals: [] };
    grouped[g.user.id].goals.push(g);
  });
  const employees = Object.values(grouped);

  const stats = {
    totalEmployees: employees.length,
    pendingApprovals: goals.filter((g) => g.status === "SUBMITTED").length,
    approved: goals.filter((g) => g.status === "APPROVED").length,
    returned: goals.filter((g) => g.status === "RETURNED").length,
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Team Dashboard</h1>
        <p className="page-subtitle">Overview of your direct reports' goals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Team Members", value: stats.totalEmployees, color: "text-brand-600", bg: "bg-brand-50" },
          { icon: Clock, label: "Pending Approvals", value: stats.pendingApprovals, color: "text-amber-600", bg: "bg-amber-50" },
          { icon: CheckCircle, label: "Approved Goals", value: stats.approved, color: "text-green-600", bg: "bg-green-50" },
          { icon: AlertCircle, label: "Returned", value: stats.returned, color: "text-red-600", bg: "bg-red-50" },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Employee Cards */}
      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-32 w-full" />)}</div>
      ) : employees.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No direct reports found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map(({ user, goals: userGoals }) => {
            const pending = userGoals.filter((g) => g.status === "SUBMITTED").length;
            const total = userGoals.reduce((s, g) => s + g.weightage, 0);
            return (
              <div key={user.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-xs text-gray-400">{user.email} · {user.department}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {pending > 0 && (
                      <button className="btn btn-sm btn-primary" onClick={() => navigate("/team/approvals")}>
                        Review ({pending})
                      </button>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate("/team/checkins")}>
                      Check-in
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {userGoals.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-xs">
                      <StatusBadge status={g.status} />
                      <span className="text-gray-600 font-medium truncate max-w-[200px]">{g.title}</span>
                      <span className="text-gray-400">{g.weightage}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  {userGoals.length} goals · {total}% total weightage
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
