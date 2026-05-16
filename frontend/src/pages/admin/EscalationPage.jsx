import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import { AlertTriangle, Plus, CheckCircle } from "lucide-react";

export default function EscalationPage() {
  const [data, setData] = useState({ escalations: [], rules: [] });
  const [showRule, setShowRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({ ruleType: "GOAL_SUBMISSION", daysAfter: 14, notifyRole: "EMPLOYEE" });

  const fetchData = async () => {
    try {
      const { data } = await api.get("/escalations");
      setData(data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const createRule = async () => {
    try {
      await api.post("/escalations/rules", ruleForm);
      toast.success("Rule created");
      setShowRule(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const resolve = async (id) => {
    try {
      await api.post(`/escalations/${id}/resolve`);
      toast.success("Escalation resolved");
      fetchData();
    } catch {}
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Escalations</h1>
          <p className="page-subtitle">Configure rules and view escalation log</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRule(true)}>
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {/* Rules */}
      <h3 className="font-bold text-gray-700 mb-3">Active Rules</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {data.rules.map((r) => (
          <div key={r.id} className="glass-card p-4">
            <p className="font-semibold text-sm">{r.ruleType.replace(/_/g, " ")}</p>
            <p className="text-xs text-gray-500">After {r.daysAfter} days → Notify {r.notifyRole}</p>
          </div>
        ))}
        {data.rules.length === 0 && <p className="text-sm text-gray-400">No rules configured</p>}
      </div>

      {/* Escalation Log */}
      <h3 className="font-bold text-gray-700 mb-3">Escalation Log</h3>
      {data.escalations.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No escalations triggered</p>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Type</th><th>User</th><th>Triggered</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {data.escalations.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium">{e.ruleType.replace(/_/g, " ")}</td>
                  <td>{e.targetUser?.name} <span className="text-gray-400 text-xs">({e.targetUser?.email})</span></td>
                  <td className="text-xs">{new Date(e.triggeredAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${e.status === "OPEN" ? "badge-returned" : "badge-approved"}`}>{e.status}</span>
                  </td>
                  <td>
                    {e.status === "OPEN" && (
                      <button className="btn btn-sm btn-success" onClick={() => resolve(e.id)}>
                        <CheckCircle className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRule && (
        <div className="modal-overlay" onClick={() => setShowRule(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create Escalation Rule</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Rule Type</label>
                <select className="form-input form-select w-full" value={ruleForm.ruleType} onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}>
                  <option value="GOAL_SUBMISSION">Goal Submission</option>
                  <option value="MANAGER_APPROVAL">Manager Approval</option>
                  <option value="CHECKIN">Check-in</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Days After Phase Opens</label>
                <input type="number" className="form-input w-full" value={ruleForm.daysAfter} onChange={(e) => setRuleForm({ ...ruleForm, daysAfter: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notify Role</label>
                <select className="form-input form-select w-full" value={ruleForm.notifyRole} onChange={(e) => setRuleForm({ ...ruleForm, notifyRole: e.target.value })}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-secondary" onClick={() => setShowRule(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createRule}>Create Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
