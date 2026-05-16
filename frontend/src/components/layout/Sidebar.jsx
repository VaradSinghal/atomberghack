import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import {
  Target, Users, CheckSquare, BarChart3, Settings, FileText,
  Shield, AlertTriangle, Share2, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";

const navItems = {
  EMPLOYEE: [
    { to: "/goals", icon: Target, label: "My Goals" },
    { to: "/achievements", icon: CheckSquare, label: "Achievements" },
  ],
  MANAGER: [
    { to: "/goals", icon: Target, label: "My Goals" },
    { to: "/team", icon: Users, label: "Team Dashboard" },
    { to: "/team/approvals", icon: CheckSquare, label: "Approvals" },
    { to: "/team/checkins", icon: FileText, label: "Check-ins" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
  ],
  ADMIN: [
    { to: "/admin/cycles", icon: Settings, label: "Cycle Manager" },
    { to: "/admin/shared-goals", icon: Share2, label: "Shared Goals" },
    { to: "/admin/completion", icon: CheckSquare, label: "Completion" },
    { to: "/admin/reports", icon: FileText, label: "Reports" },
    { to: "/admin/audit", icon: Shield, label: "Audit Log" },
    { to: "/admin/escalations", icon: AlertTriangle, label: "Escalations" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColors = {
    EMPLOYEE: "from-blue-500 to-blue-600",
    MANAGER: "from-purple-500 to-purple-600",
    ADMIN: "from-amber-500 to-amber-600",
  };

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-[var(--color-surface-1)] border-r border-gray-100 shadow-sm transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
          <Target className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">GoalTrack</h1>
            <p className="text-[11px] text-gray-400 font-medium -mt-0.5">Performance Portal</p>
          </div>
        )}
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-5 py-3">
          <div className={`bg-gradient-to-r ${roleColors[user?.role]} px-3 py-2 rounded-lg`}>
            <p className="text-white text-xs font-bold uppercase tracking-wider">{user?.role}</p>
            <p className="text-white/80 text-xs truncate">{user?.name}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 w-full transition-all"
        >
          {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 w-full transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
