import React from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
          ) : (
            <Info size={16} className="text-blue-500 shrink-0" />
          );

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-neutral-900 text-white shadow-lg border border-neutral-800 transition-all text-xs"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-100">{toast.title}</p>
              {toast.message && (
                <p className="text-neutral-400 mt-0.5 text-[11px] truncate">
                  {toast.message}
                </p>
              )}
            </div>

            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs transition-colors shrink-0"
              >
                {toast.actionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-neutral-500 hover:text-neutral-300 p-1"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
