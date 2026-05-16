import { useEffect, useState } from "react";
import api from "../../lib/api";
import ScoreIndicator from "../../components/shared/ScoreIndicator";
import { Download, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/reports/achievement");
        setGoals(data.goals);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const exportExcel = async () => {
    try {
      const response = await api.get("/reports/achievement/export", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "achievement_report.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed");
    }
  };

  const getQ = (goal, q) => goal.achievements?.find((a) => a.quarter === q);

  return (
    <div className="page-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Achievement Report</h1>
          <p className="page-subtitle">Planned vs. actual across all employees</p>
        </div>
        <button className="btn btn-primary" onClick={exportExcel} id="export-excel-btn">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th><th>Goal</th><th>UoM</th><th>Target</th><th>Weight</th>
                <th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="font-semibold">{g.user.name}</div>
                    <div className="text-xs text-gray-400">{g.user.department}</div>
                  </td>
                  <td className="font-medium max-w-[200px] truncate">{g.title}</td>
                  <td className="text-xs">{g.uomType.replace(/_/g, " ")}</td>
                  <td>{g.target.toLocaleString()}</td>
                  <td className="font-semibold text-brand-600">{g.weightage}%</td>
                  {["Q1","Q2","Q3","Q4"].map((q) => {
                    const ach = getQ(g, q);
                    return (
                      <td key={q}>
                        {ach ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{ach.actualValue ?? "-"}</span>
                            <ScoreIndicator score={ach.score} />
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
