import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X, Info } from "lucide-react";

const icons = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
};

const styles = {
  success: "border-emerald-500/20 bg-emerald-500/5",
  error: "border-red-500/20 bg-red-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  info: "border-blue-500/20 bg-blue-500/5",
};

// Global toast state — simple pub/sub without extra deps
let listeners = [];
export const toast = {
  show: (message, type = "info", duration = 4000) => {
    const id = Date.now();
    listeners.forEach((fn) => fn({ id, message, type, duration }));
    return id;
  },
  success: (msg, dur) => toast.show(msg, "success", dur),
  error: (msg, dur) => toast.show(msg, "error", dur),
  warning: (msg, dur) => toast.show(msg, "warning", dur),
  info: (msg, dur) => toast.show(msg, "info", dur),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter((l) => l !== handler); };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border card shadow-xl min-w-[280px] max-w-sm pointer-events-auto animate-slide-up ${styles[t.type]}`}
        >
          <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
          <p className="text-sm text-slate-200 flex-1">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-500 hover:text-slate-300 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
