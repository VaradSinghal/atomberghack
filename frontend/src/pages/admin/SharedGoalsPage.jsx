import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import { Share2, Send, Users } from "lucide-react";

export default function SharedGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ thrustArea: "", title: "", description: "", uomType: "NUMERIC_MIN", target: "", recipientUserIds: [] });

  const fetchData = async () => {
    try {
      const [g, ta] = await Promise.all([api.get("/shared-goals"), api.get("/thrust-areas")]);
      setGoals(g.data.goals);
      setThrustAreas(ta.data.thrustAreas);
      // Get all employees from goals data for selection
      const { data } = await api.get("/reports/completion");
      setEmployees(data.report.filter(u => u.role === "EMPLOYEE"));
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handlePush = async () => {
    if (form.recipientUserIds.length === 0) { toast.error("Select at least one employee"); return; }
    try {
      await api.post("/shared-goals", form);
      toast.success("Shared goal pushed!");
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const toggleRecipient = (id) => {
    setForm((f) => ({
      ...f,
      recipientUserIds: f.recipientUserIds.includes(id)
        ? f.recipientUserIds.filter((r) => r !== id)
        : [...f.recipientUserIds, id],
    }));
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Shared Goals</h1>
          <p className="page-subtitle">Push KPIs to multiple employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Share2 className="w-4 h-4" /> Push Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No shared goals yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="glass-card p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">{g.title}</h4>
                <p className="text-sm text-gray-500">{g.thrustArea} · {g.uomType.replace(/_/g, " ")} · Target: {g.target}</p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{g.user?.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Push Shared Goal</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Thrust Area</label>
                <select className="form-input form-select w-full" value={form.thrustArea} onChange={(e) => setForm({ ...form, thrustArea: e.target.value })}>
                  <option value="">Select</option>
                  {thrustAreas.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input w-full" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">UoM</label>
                  <select className="form-input form-select w-full" value={form.uomType} onChange={(e) => setForm({ ...form, uomType: e.target.value })}>
                    <option value="NUMERIC_MIN">Numeric (Higher=Better)</option>
                    <option value="NUMERIC_MAX">Numeric (Lower=Better)</option>
                    <option value="TIMELINE">Timeline</option>
                    <option value="ZERO">Zero-based</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target</label>
                  <input type="number" className="form-input w-full" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Recipients ({form.recipientUserIds.length} selected)</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={form.recipientUserIds.includes(emp.id)} onChange={() => toggleRecipient(emp.id)} className="rounded" />
                      <span className="text-sm">{emp.name} <span className="text-gray-400">({emp.email})</span></span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePush}><Send className="w-4 h-4" /> Push Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
