export default function StatusBadge({ status }) {
  const map = {
    DRAFT: "badge-draft",
    SUBMITTED: "badge-submitted",
    APPROVED: "badge-approved",
    RETURNED: "badge-returned",
    NOT_STARTED: "badge-not-started",
    ON_TRACK: "badge-on-track",
    COMPLETED: "badge-completed",
  };
  const label = status?.replace(/_/g, " ") || "Unknown";
  return <span className={`badge ${map[status] || "badge-draft"}`}>{label}</span>;
}
