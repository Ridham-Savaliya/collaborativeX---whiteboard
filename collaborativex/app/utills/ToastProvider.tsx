"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { X } from "lucide-react";

type ToastType = "default" | "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);


  const showToast = useCallback((message: string, type: ToastType = "default") => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000); // auto-dismiss
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

    <div className="fixed top-5 right-5 left-5 sm:left-auto sm:right-5 z-[9999] flex flex-col space-y-3 w-auto sm:max-w-sm overflow-y-auto overflow-x-hidden">
  {toasts.map((toast) => (
    <div
      key={toast.id}
      className={`relative p-4 pl-5 pr-6 rounded-2xl bg-purple-950/60 border-l-4 backdrop-blur-xl text-white shadow-xl animate-slideIn fade-in overflow-hidden
        ${
          toast.type === "success"
            ? "border-green-400"
            : toast.type === "error"
            ? "border-red-500"
            : toast.type === "info"
            ? "border-blue-400"
            : toast.type === "warning"
            ? "border-yellow-400 text-yellow-100"
            : "border-purple-500"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 text-sm font-medium tracking-wide leading-snug">
          {toast.message}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="text-white/60 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  ))}
</div>

    </ToastContext.Provider>
  );
}

// Hook to use toast
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
};
