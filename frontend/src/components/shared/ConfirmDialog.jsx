import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Confirm", variant = "danger" }) {
  if (!open) return null;

  const btnClass = variant === "danger" ? "btn-danger" : variant === "success" ? "btn-success" : "btn-primary";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            variant === "danger" ? "bg-red-100" : variant === "success" ? "bg-green-100" : "bg-blue-100"
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              variant === "danger" ? "text-red-600" : variant === "success" ? "text-green-600" : "text-blue-600"
            }`} />
          </div>
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${btnClass}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
