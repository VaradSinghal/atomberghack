import { useEffect, useState } from "react";
import api from "../../lib/api";
import { CheckCircle, XCircle, Users } from "lucide-react";

export default function CompletionDashPage() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/reports/completion");
        setReport(data.report);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = report.filter((u) => {
    if (filter === "submitted") return u.goalSubmissionComplete;
    if (filter === "pending") return !u.goalSubmissionComplete;
    return true;
  });

  const completedCount = report.filter((u) => u.goalSubmissionComplete).length;

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header">
        <h1 className="page-title">Completion Dashboard</h1>
        <p className="page-subtitle">Track who has submitted goals and completed check-ins</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-value">{report.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-green-600">{completedCount}</div>
          <div className="stat-label">Submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-red-600">{report.length - completedCount}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "submitted", "pending"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
          >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Department</th>
                <th>Goals</th><th>Submitted</th><th>Approved</th><th>Check-ins</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td className="text-gray-500">{u.email}</td>
                  <td><span className="badge badge-draft">{u.role}</span></td>
                  <td>{u.department || "-"}</td>
                  <td>{u.totalGoals}</td>
                  <td>{u.submitted}</td>
                  <td>{u.approved}</td>
                  <td>{u.checkinsDone}</td>
                  <td>
                    {u.goalSubmissionComplete ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-sm font-semibold">
                        <XCircle className="w-4 h-4" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
