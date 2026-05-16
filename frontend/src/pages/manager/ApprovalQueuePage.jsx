import { useEffect, useState } from "react";
import { toast } from "sonner";
import useGoalStore from "../../store/goalStore";
import StatusBadge from "../../components/shared/StatusBadge";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { Check, RotateCcw, Edit3 } from "lucide-react";

export default function ApprovalQueuePage() {
  const { goals, fetchGoals, approveGoal, returnGoal, loading } = useGoalStore();
  const pendingGoals = goals.filter((g) => g.status === "SUBMITTED");
  const [returnModal, setReturnModal] = useState(null);
  const [returnComment, setReturnComment] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [editValues, setEditValues] = useState({ target: "", weightage: "" });
  const [approveConfirm, setApproveConfirm] = useState(null);

  useEffect(() => { fetchGoals(); }, []);

  const grouped = {};
  pendingGoals.forEach((g) => {
    if (!g.user) return;
    if (!grouped[g.user.id]) grouped[g.user.id] = { user: g.user, goals: [] };
    grouped[g.user.id].goals.push(g);
  });

  const handleApprove = async (goalId) => {
    setApproveConfirm(null);
    try {
      await approveGoal(goalId, editModal?.id === goalId ? {
        editedTarget: editValues.target ? parseFloat(editValues.target) : undefined,
        editedWeightage: editValues.weightage ? parseFloat(editValues.weightage) : undefined,
      } : {});
      toast.success("Goal approved and locked");
      setEditModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve");
    }
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) { toast.error("Comment is required"); return; }
    try {
      await returnGoal(returnModal.id, returnComment);
      toast.success("Goal returned for rework");
      setReturnModal(null);
      setReturnComment("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to return");
    }
  };

  const startEdit = (goal) => {
    setEditModal(goal);
    setEditValues({ target: goal.target, weightage: goal.weightage });
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header">
        <h1 className="page-title">Approval Queue</h1>
        <p className="page-subtitle">{pendingGoals.length} goal{pendingGoals.length !== 1 ? "s" : ""} awaiting your review</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-40 w-full" />)}</div>
      ) : pendingGoals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Check className="w-12 h-12 text-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">All caught up!</h3>
          <p className="text-sm text-gray-400">No pending approvals</p>
        </div>
      ) : (
        Object.values(grouped).map(({ user, goals: userGoals }) => (
          <div key={user.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{user.name}</h3>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <span className="text-xs text-gray-400 ml-auto">
                Total: {userGoals.reduce((s, g) => s + g.weightage, 0)}%
              </span>
            </div>

            <div className="space-y-3">
              {userGoals.map((goal) => (
                <div key={goal.id} className="glass-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">{goal.thrustArea}</span>
                        <StatusBadge status={goal.status} />
                      </div>
                      <h4 className="font-bold text-gray-900">{goal.title}</h4>
                      {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>UoM: {goal.uomType.replace(/_/g, " ")}</span>
                        <span>Target: {goal.uomType === "TIMELINE" ? new Date(goal.targetDate).toLocaleDateString() : goal.target.toLocaleString()}</span>
                        <span className="font-semibold text-brand-600">{goal.weightage}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={() => startEdit(goal)} title="Edit before approving">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button className="btn btn-sm btn-success" onClick={() => setApproveConfirm(goal)} title="Approve">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button className="btn btn-sm btn-warning" onClick={() => setReturnModal(goal)} title="Return for rework">
                        <RotateCcw className="w-3.5 h-3.5" /> Return
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Inline Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Goal Before Approving</h3>
            <p className="text-sm text-gray-500 mb-4">"{editModal.title}"</p>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Target Value</label>
                <input type="number" className="form-input w-full" value={editValues.target} onChange={(e) => setEditValues({ ...editValues, target: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Weightage (%)</label>
                <input type="number" className="form-input w-full" value={editValues.weightage} onChange={(e) => setEditValues({ ...editValues, weightage: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleApprove(editModal.id)}>
                <Check className="w-4 h-4" /> Approve with Edits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Comment Modal */}
      {returnModal && (
        <div className="modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Return for Rework</h3>
            <p className="text-sm text-gray-500 mb-4">"{returnModal.title}" — please provide feedback</p>
            <div className="form-group">
              <label className="form-label">Comment (required)</label>
              <textarea className="form-input w-full" rows={4} placeholder="What needs to change..." value={returnComment} onChange={(e) => setReturnComment(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-secondary" onClick={() => { setReturnModal(null); setReturnComment(""); }}>Cancel</button>
              <button className="btn btn-warning" onClick={handleReturn}>
                <RotateCcw className="w-4 h-4" /> Return for Rework
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!approveConfirm}
        onClose={() => setApproveConfirm(null)}
        onConfirm={() => handleApprove(approveConfirm?.id)}
        title="Approve Goal?"
        message={`This will approve and lock "${approveConfirm?.title}". The employee won't be able to edit it.`}
        confirmText="Approve & Lock"
        variant="success"
      />
    </div>
  );
}
