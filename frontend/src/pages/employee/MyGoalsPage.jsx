import { useEffect, useState } from "react";
import { toast } from "sonner";
import useGoalStore from "../../store/goalStore";
import useCycleStore from "../../store/cycleStore";
import useAuthStore from "../../store/authStore";
import StatusBadge from "../../components/shared/StatusBadge";
import WeightageBar from "../../components/shared/WeightageBar";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import ScoreIndicator from "../../components/shared/ScoreIndicator";
import api from "../../lib/api";
import { Plus, Send, Edit3, Trash2, X, Save, Target } from "lucide-react";

const UOM_LABELS = {
  NUMERIC_MIN: "Numeric (Higher is better)",
  NUMERIC_MAX: "Numeric (Lower is better)",
  TIMELINE: "Timeline (Date-based)",
  ZERO: "Zero-based",
};

export default function MyGoalsPage() {
  const { goals, fetchGoals, createGoal, updateGoal, deleteGoal, submitGoals, loading } = useGoalStore();
  const { fetchActiveCycle } = useCycleStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [form, setForm] = useState({ thrustArea: "", title: "", description: "", uomType: "NUMERIC_MIN", target: "", targetDate: "", weightage: "" });

  useEffect(() => { fetchGoals(); fetchActiveCycle(); loadThrustAreas(); }, []);

  const loadThrustAreas = async () => {
    try {
      const { data } = await api.get("/thrust-areas");
      setThrustAreas(data.thrustAreas);
    } catch {}
  };

  const totalWeightage = goals.reduce((s, g) => s + (g.weightage || 0), 0);
  const canSubmit = Math.abs(totalWeightage - 100) < 0.01 && goals.length > 0 &&
    goals.every((g) => g.weightage >= 10) && goals.some((g) => ["DRAFT", "RETURNED"].includes(g.status));

  const resetForm = () => {
    setForm({ thrustArea: "", title: "", description: "", uomType: "NUMERIC_MIN", target: "", targetDate: "", weightage: "" });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    try {
      if (!form.title || !form.thrustArea || !form.weightage) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (parseFloat(form.weightage) < 10) {
        toast.error("Minimum weightage per goal is 10%");
        return;
      }
      if (goals.length >= 8 && !editingGoal) {
        toast.error("Maximum 8 goals per employee");
        return;
      }
      if (editingGoal) {
        await updateGoal(editingGoal.id, form);
        toast.success("Goal updated");
      } else {
        await createGoal(form);
        toast.success("Goal created");
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save goal");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGoal(id);
      toast.success("Goal deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete");
    }
  };

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    try {
      await submitGoals();
      toast.success("Goals submitted for manager approval!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit");
    }
  };

  const startEdit = (goal) => {
    setForm({
      thrustArea: goal.thrustArea, title: goal.title, description: goal.description || "",
      uomType: goal.uomType, target: goal.target, targetDate: goal.targetDate?.split("T")[0] || "", weightage: goal.weightage,
    });
    setEditingGoal(goal);
    setShowForm(true);
  };

  const latestScore = (goal) => {
    if (!goal.achievements?.length) return null;
    const scored = goal.achievements.filter(a => a.score !== null);
    return scored.length > 0 ? scored[scored.length - 1].score : null;
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">My Goals</h1>
          <p className="page-subtitle">{goals.length} goal{goals.length !== 1 ? "s" : ""} this cycle</p>
        </div>
        <div className="flex gap-3">
          {goals.some(g => ["DRAFT", "RETURNED"].includes(g.status)) && goals.length < 8 && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} id="add-goal-btn">
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          )}
          {canSubmit && (
            <button className="btn btn-success" onClick={() => setConfirmSubmit(true)} id="submit-goals-btn">
              <Send className="w-4 h-4" /> Submit All
            </button>
          )}
        </div>
      </div>

      {/* Weightage Bar */}
      {goals.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <WeightageBar current={totalWeightage} />
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="modal-title mb-0">{editingGoal ? "Edit Goal" : "Create New Goal"}</h3>
              <button onClick={resetForm} className="btn btn-icon btn-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Thrust Area *</label>
                <select className="form-input form-select w-full" value={form.thrustArea} onChange={e => setForm({...form, thrustArea: e.target.value})} id="goal-thrust-area">
                  <option value="">Select thrust area</option>
                  {thrustAreas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Goal Title *</label>
                <input className="form-input w-full" placeholder="e.g. Achieve Sales Revenue Target" value={form.title} onChange={e => setForm({...form, title: e.target.value})} id="goal-title" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input w-full" rows={3} placeholder="Describe the goal..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} id="goal-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Unit of Measurement *</label>
                  <select className="form-input form-select w-full" value={form.uomType} onChange={e => setForm({...form, uomType: e.target.value})} id="goal-uom">
                    {Object.entries(UOM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weightage (%) *</label>
                  <input type="number" min="10" max="100" className="form-input w-full" placeholder="Min 10%" value={form.weightage} onChange={e => setForm({...form, weightage: e.target.value})} id="goal-weightage" />
                </div>
              </div>
              {form.uomType === "TIMELINE" ? (
                <div className="form-group">
                  <label className="form-label">Target Date *</label>
                  <input type="date" className="form-input w-full" value={form.targetDate} onChange={e => setForm({...form, targetDate: e.target.value})} id="goal-target-date" />
                </div>
              ) : form.uomType !== "ZERO" ? (
                <div className="form-group">
                  <label className="form-label">Target Value *</label>
                  <input type="number" className="form-input w-full" placeholder="e.g. 50000000" value={form.target} onChange={e => setForm({...form, target: e.target.value})} id="goal-target" />
                </div>
              ) : null}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} id="save-goal-btn">
                <Save className="w-4 h-4" /> {editingGoal ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-28 w-full" />)}</div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No goals yet</h3>
          <p className="text-sm text-gray-400 mt-1">Create your first goal to get started</p>
          <button className="btn btn-primary mt-6" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <div key={goal.id} className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <StatusBadge status={goal.status} />
                    {goal.isShared && <span className="badge bg-purple-100 text-purple-700">Shared</span>}
                    <span className="text-xs text-gray-400">{goal.thrustArea}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{goal.title}</h3>
                  {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
                  <div className="flex items-center gap-5 mt-3 text-sm text-gray-500">
                    <span><strong>UoM:</strong> {UOM_LABELS[goal.uomType]}</span>
                    {goal.uomType !== "ZERO" && <span><strong>Target:</strong> {goal.uomType === "TIMELINE" ? new Date(goal.targetDate).toLocaleDateString() : goal.target.toLocaleString()}</span>}
                    <span className="font-semibold text-brand-600">{goal.weightage}% weight</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreIndicator score={latestScore(goal)} />
                  {["DRAFT", "RETURNED"].includes(goal.status) && (
                    <>
                      <button className="btn btn-icon btn-secondary" onClick={() => startEdit(goal)} title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button className="btn btn-icon btn-secondary text-red-500 hover:bg-red-50" onClick={() => handleDelete(goal.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
              {/* Show approval comment if returned */}
              {goal.status === "RETURNED" && goal.approvals?.[0]?.comment && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <strong>Manager feedback:</strong> {goal.approvals[0].comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit Goals for Approval?"
        message={`You're about to submit ${goals.filter(g => ["DRAFT","RETURNED"].includes(g.status)).length} goals totaling ${totalWeightage}% weightage to your manager for approval. This action cannot be undone.`}
        confirmText="Submit Goals"
        variant="primary"
      />
    </div>
  );
}
