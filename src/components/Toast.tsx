import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-200 transform translate-y-0 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/50'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-700/50'
              : 'bg-slate-900/90 text-slate-100 border-slate-700/50'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
            {toast.message && <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-slate-400 hover:text-slate-100 transition-colors p-1"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
