import { useEffect, useState } from "react";
import api from "../../lib/api";
import { BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";

const COLORS = ["#4263eb", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AnalyticsPage() {
  const [goals, setGoals] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, cRes] = await Promise.all([
          api.get("/reports/achievement"),
          api.get("/reports/completion"),
        ]);
        setGoals(gRes.data.goals);
        setCompletion(cRes.data.report);
      } catch {}
      setLoading(false);
    })();
  }, []);

  // QoQ trend data
  const trendData = ["Q1", "Q2", "Q3", "Q4"].map((q) => {
    const scores = goals
      .flatMap((g) => g.achievements?.filter((a) => a.quarter === q && a.score !== null) || [])
      .map((a) => a.score);
    return {
      quarter: q,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
      count: scores.length,
    };
  });

  // Goal distribution by thrust area
  const thrustDist = {};
  goals.forEach((g) => { thrustDist[g.thrustArea] = (thrustDist[g.thrustArea] || 0) + 1; });
  const pieData = Object.entries(thrustDist).map(([name, value]) => ({ name, value }));

  // UoM distribution
  const uomDist = {};
  goals.forEach((g) => { uomDist[g.uomType] = (uomDist[g.uomType] || 0) + 1; });
  const uomData = Object.entries(uomDist).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // Status distribution
  const statusDist = {};
  goals.forEach((g) => { statusDist[g.status] = (statusDist[g.status] || 0) + 1; });
  const statusData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

  // Completion by department
  const deptData = {};
  completion.forEach((u) => {
    const dept = u.department || "Other";
    if (!deptData[dept]) deptData[dept] = { total: 0, submitted: 0 };
    deptData[dept].total++;
    if (u.goalSubmissionComplete) deptData[dept].submitted++;
  });
  const heatmapData = Object.entries(deptData).map(([dept, v]) => ({
    department: dept, rate: v.total > 0 ? Math.round((v.submitted / v.total) * 100) : 0,
    submitted: v.submitted, total: v.total,
  }));

  if (loading) return <div className="page-container"><div className="skeleton h-96 w-full" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Performance insights and trends across the organization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QoQ Trend */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Quarter-on-Quarter Score Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="avgScore" stroke="#4263eb" strokeWidth={3} dot={{ fill: "#4263eb", r: 5 }} name="Avg Score %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Distribution by Thrust Area */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Goals by Thrust Area</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* UoM Distribution */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Goals by Unit of Measurement</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={uomData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="value" fill="#4263eb" radius={[8, 8, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Heatmap */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Completion Rate by Department</h3>
          <div className="space-y-3">
            {heatmapData.map((d) => (
              <div key={d.department}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">{d.department}</span>
                  <span className={`font-bold ${d.rate >= 80 ? "text-green-600" : d.rate >= 50 ? "text-amber-600" : "text-red-600"}`}>{d.rate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${d.rate >= 80 ? "bg-green-500" : d.rate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${d.rate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{d.submitted}/{d.total} completed</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
