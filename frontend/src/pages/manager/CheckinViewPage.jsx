import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import ScoreIndicator from "../../components/shared/ScoreIndicator";
import StatusBadge from "../../components/shared/StatusBadge";
import { MessageSquare, Send } from "lucide-react";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function CheckinViewPage() {
  const [team, setTeam] = useState([]);
  const [quarter, setQuarter] = useState("Q1");
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [sending, setSending] = useState({});

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/checkins/team?quarter=${quarter}`);
      setTeam(data.team);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTeam(); }, [quarter]);

  const addComment = async (goalId) => {
    if (!comments[goalId]?.trim()) return;
    setSending((s) => ({ ...s, [goalId]: true }));
    try {
      await api.post(`/checkins/${goalId}/${quarter}`, { comment: comments[goalId] });
      toast.success("Check-in comment added");
      setComments((c) => ({ ...c, [goalId]: "" }));
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add comment");
    }
    setSending((s) => ({ ...s, [goalId]: false }));
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header">
        <h1 className="page-title">Quarterly Check-ins</h1>
        <p className="page-subtitle">Review planned vs. actual for your team</p>
      </div>

      <div className="flex gap-2 mb-6">
        {QUARTERS.map((q) => (
          <button key={q} onClick={() => setQuarter(q)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${quarter === q ? "bg-brand-500 text-white shadow-md" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"}`}
          >{q}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-40 w-full" />)}</div>
      ) : team.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No team data</h3>
        </div>
      ) : (
        team.map((member) => (
          <div key={member.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {member.name.charAt(0)}
              </div>
              <h3 className="font-bold text-gray-900">{member.name}</h3>
              <span className="text-xs text-gray-400">{member.email}</span>
            </div>

            {member.goals.length === 0 ? (
              <p className="text-sm text-gray-400 ml-11">No approved goals</p>
            ) : (
              <div className="space-y-3">
                {member.goals.map((goal) => {
                  const ach = goal.achievements?.[0];
                  return (
                    <div key={goal.id} className="glass-card p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{goal.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {goal.thrustArea} · {goal.weightage}% · {goal.uomType.replace(/_/g, " ")}
                          </p>
                        </div>
                        <ScoreIndicator score={ach?.score} />
                      </div>

                      {/* Planned vs Actual */}
                      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Planned Target</p>
                          <p className="text-sm font-bold text-gray-700">
                            {goal.uomType === "TIMELINE" ? new Date(goal.targetDate).toLocaleDateString() : goal.target.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Actual ({quarter})</p>
                          <p className="text-sm font-bold text-gray-700">
                            {ach?.actualValue !== null && ach?.actualValue !== undefined
                              ? ach.actualValue.toLocaleString()
                              : ach?.actualDate
                                ? new Date(ach.actualDate).toLocaleDateString()
                                : "Not entered"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Status</p>
                          {ach ? <StatusBadge status={ach.status} /> : <span className="text-sm text-gray-400">—</span>}
                        </div>
                      </div>

                      {/* Existing Comments */}
                      {goal.checkinComments?.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {goal.checkinComments.map((c) => (
                            <div key={c.id} className="flex gap-2 text-sm">
                              <MessageSquare className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-gray-700">{c.manager?.name}: </span>
                                <span className="text-gray-600">{c.comment}</span>
                                <span className="text-xs text-gray-400 ml-2">{new Date(c.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <input
                          className="form-input flex-1"
                          placeholder="Add check-in comment..."
                          value={comments[goal.id] || ""}
                          onChange={(e) => setComments((c) => ({ ...c, [goal.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && addComment(goal.id)}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => addComment(goal.id)} disabled={sending[goal.id]}>
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
