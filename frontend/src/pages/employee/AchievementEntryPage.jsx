import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import useGoalStore from "../../store/goalStore";
import StatusBadge from "../../components/shared/StatusBadge";
import ScoreIndicator from "../../components/shared/ScoreIndicator";
import { Save, CheckCircle } from "lucide-react";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function AchievementEntryPage() {
  const { goals, fetchGoals } = useGoalStore();
  const approvedGoals = goals.filter((g) => g.status === "APPROVED");
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [entries, setEntries] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => { fetchGoals(); }, []);

  useEffect(() => {
    const initial = {};
    approvedGoals.forEach((g) => {
      const ach = g.achievements?.find((a) => a.quarter === selectedQuarter);
      initial[g.id] = {
        actualValue: ach?.actualValue ?? "",
        actualDate: ach?.actualDate?.split("T")[0] ?? "",
        status: ach?.status ?? "NOT_STARTED",
        score: ach?.score ?? null,
      };
    });
    setEntries(initial);
  }, [goals, selectedQuarter]);

  const handleSave = async (goalId, goal) => {
    setSaving((s) => ({ ...s, [goalId]: true }));
    try {
      const entry = entries[goalId];
      const body = { status: entry.status };
      if (goal.uomType === "TIMELINE") {
        body.actualDate = entry.actualDate;
      } else {
        body.actualValue = parseFloat(entry.actualValue);
      }
      const { data } = await api.put(`/achievements/${goalId}/${selectedQuarter}`, body);
      setEntries((e) => ({ ...e, [goalId]: { ...e[goalId], score: data.achievement.score } }));
      toast.success(`Achievement saved for "${goal.title}"`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save");
    }
    setSaving((s) => ({ ...s, [goalId]: false }));
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header">
        <h1 className="page-title">Achievement Entry</h1>
        <p className="page-subtitle">Enter your quarterly actuals for approved goals</p>
      </div>

      {/* Quarter Tabs */}
      <div className="flex gap-2 mb-6">
        {QUARTERS.map((q) => (
          <button
            key={q}
            onClick={() => setSelectedQuarter(q)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              selectedQuarter === q
                ? "bg-brand-500 text-white shadow-md"
                : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {approvedGoals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No approved goals yet</h3>
          <p className="text-sm text-gray-400 mt-1">Your goals need manager approval before you can enter achievements</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvedGoals.map((goal) => (
            <div key={goal.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{goal.thrustArea}</span>
                    <span className="text-xs font-bold text-brand-600">{goal.weightage}%</span>
                  </div>
                  <h3 className="font-bold text-gray-900">{goal.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Target: {goal.uomType === "TIMELINE" ? new Date(goal.targetDate).toLocaleDateString() : goal.target.toLocaleString()}
                    {" · "}UoM: {goal.uomType.replace(/_/g, " ")}
                  </p>
                </div>
                <ScoreIndicator score={entries[goal.id]?.score} />
              </div>

              <div className="flex items-end gap-4">
                {goal.uomType === "TIMELINE" ? (
                  <div className="form-group flex-1">
                    <label className="form-label">Actual Completion Date</label>
                    <input
                      type="date"
                      className="form-input w-full"
                      value={entries[goal.id]?.actualDate || ""}
                      onChange={(e) => setEntries((s) => ({ ...s, [goal.id]: { ...s[goal.id], actualDate: e.target.value } }))}
                    />
                  </div>
                ) : goal.uomType !== "ZERO" ? (
                  <div className="form-group flex-1">
                    <label className="form-label">Actual Value</label>
                    <input
                      type="number"
                      className="form-input w-full"
                      placeholder="Enter actual achievement"
                      value={entries[goal.id]?.actualValue ?? ""}
                      onChange={(e) => setEntries((s) => ({ ...s, [goal.id]: { ...s[goal.id], actualValue: e.target.value } }))}
                    />
                  </div>
                ) : (
                  <div className="form-group flex-1">
                    <label className="form-label">Actual Value (0 = success)</label>
                    <input
                      type="number"
                      className="form-input w-full"
                      placeholder="Enter 0 for success"
                      value={entries[goal.id]?.actualValue ?? ""}
                      onChange={(e) => setEntries((s) => ({ ...s, [goal.id]: { ...s[goal.id], actualValue: e.target.value } }))}
                    />
                  </div>
                )}

                <div className="form-group w-40">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input form-select w-full"
                    value={entries[goal.id]?.status || "NOT_STARTED"}
                    onChange={(e) => setEntries((s) => ({ ...s, [goal.id]: { ...s[goal.id], status: e.target.value } }))}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => handleSave(goal.id, goal)}
                  disabled={saving[goal.id]}
                >
                  <Save className="w-4 h-4" />
                  {saving[goal.id] ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
