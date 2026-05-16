import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import useCycleStore from "../../store/cycleStore";
import { Settings, Plus, Calendar } from "lucide-react";

const PHASE_LABELS = {
  GOAL_SETTING: "Goal Setting", Q1_CHECKIN: "Q1 Check-in", Q2_CHECKIN: "Q2 Check-in",
  Q3_CHECKIN: "Q3 Check-in", Q4_ANNUAL: "Q4 / Annual",
};
const PHASES = Object.keys(PHASE_LABELS);

export default function CycleManagerPage() {
  const { cycle, fetchActiveCycle } = useCycleStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [phaseDates, setPhaseDates] = useState(
    PHASES.map((p) => ({ phase: p, openDate: "", closeDate: "" }))
  );

  useEffect(() => { fetchActiveCycle(); }, []);

  const handleCreate = async () => {
    if (!name) { toast.error("Cycle name is required"); return; }
    const invalid = phaseDates.find((p) => !p.openDate || !p.closeDate);
    if (invalid) { toast.error(`Please set dates for ${PHASE_LABELS[invalid.phase]}`); return; }
    try {
      await api.post("/cycles", { name, phases: phaseDates });
      toast.success("Cycle created");
      fetchActiveCycle();
      setShowCreate(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create");
    }
  };

  const advancePhase = async (nextPhase) => {
    try {
      await api.put(`/cycles/${cycle.id}/phase`, { phase: nextPhase });
      toast.success(`Phase advanced to ${PHASE_LABELS[nextPhase]}`);
      fetchActiveCycle();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to advance");
    }
  };

  const currentIdx = cycle ? PHASES.indexOf(cycle.phase) : -1;

  return (
    <div className="page-container max-w-4xl">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Cycle Manager</h1>
          <p className="page-subtitle">Manage goal cycles and phase schedules</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>

      {/* Active Cycle */}
      {cycle ? (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{cycle.name}</h3>
              <p className="text-sm text-gray-500">Current Phase: <span className="font-semibold text-brand-600">{PHASE_LABELS[cycle.phase]}</span></p>
            </div>
            <span className="badge badge-approved">Active</span>
          </div>

          {/* Phase Timeline */}
          <div className="space-y-3">
            {PHASES.map((p, i) => {
              const phaseDate = cycle.phases?.find((d) => d.phase === p);
              const isCurrent = cycle.phase === p;
              const isPast = i < currentIdx;
              return (
                <div key={p} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isCurrent ? "bg-brand-50 border border-brand-200" : isPast ? "bg-green-50" : "bg-gray-50"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? "bg-brand-500 text-white" : isPast ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{PHASE_LABELS[p]}</p>
                    {phaseDate && (
                      <p className="text-xs text-gray-400">
                        {new Date(phaseDate.openDate).toLocaleDateString()} — {new Date(phaseDate.closeDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {isCurrent && i < PHASES.length - 1 && (
                    <button className="btn btn-sm btn-primary" onClick={() => advancePhase(PHASES[i + 1])}>
                      Advance →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No active cycle</h3>
          <button className="btn btn-primary mt-4" onClick={() => setShowCreate(true)}>Create First Cycle</button>
        </div>
      )}

      {/* Create Cycle Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create New Cycle</h3>
            <div className="form-group mb-4">
              <label className="form-label">Cycle Name</label>
              <input className="form-input w-full" placeholder="e.g. FY 2026-27" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-3">
              {phaseDates.map((p, i) => (
                <div key={p.phase} className="grid grid-cols-3 gap-3 items-end">
                  <div className="form-group">
                    <label className="form-label text-xs">{PHASE_LABELS[p.phase]}</label>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Opens</label>
                    <input type="date" className="form-input w-full text-sm" value={p.openDate} onChange={(e) => {
                      const updated = [...phaseDates]; updated[i] = { ...p, openDate: e.target.value }; setPhaseDates(updated);
                    }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Closes</label>
                    <input type="date" className="form-input w-full text-sm" value={p.closeDate} onChange={(e) => {
                      const updated = [...phaseDates]; updated[i] = { ...p, closeDate: e.target.value }; setPhaseDates(updated);
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Cycle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
