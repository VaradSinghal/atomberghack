import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Shield } from "lucide-react";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/audit?page=${page}&limit=25`);
      setLogs(data.logs);
      setTotal(data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">All post-lock changes tracked with full traceability</p>
      </div>

      {loading ? (
        <div className="skeleton h-64 w-full" />
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No audit entries yet</h3>
          <p className="text-sm text-gray-400">Changes to locked goals will appear here</p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th><th>Changed By</th><th>Role</th><th>Goal</th>
                  <th>Employee</th><th>Field</th><th>Old Value</th><th>New Value</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="font-semibold">{log.changedBy?.name}</td>
                    <td><span className="badge badge-draft">{log.changedBy?.role}</span></td>
                    <td className="max-w-[180px] truncate">{log.goal?.title}</td>
                    <td>{log.goal?.user?.name}</td>
                    <td className="font-mono text-xs">{log.fieldChanged}</td>
                    <td className="text-red-500 text-sm">{log.oldValue || "—"}</td>
                    <td className="text-green-600 text-sm">{log.newValue || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">{total} total entries</span>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <span className="text-sm text-gray-500 px-3 py-1.5">Page {page} of {totalPages}</span>
                <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
