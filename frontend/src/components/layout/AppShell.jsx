import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "sonner";

export default function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            padding: "14px 18px",
            fontSize: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      />
    </div>
  );
}
