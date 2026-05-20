"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface AdminActionToastProps {
  message: string;
  onClose?: () => void;
}

export const AdminActionToast = ({ message, onClose }: AdminActionToastProps) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 shadow-lg dark:text-emerald-300">
      <CheckCircle2 size={16} />
      <span>{message}</span>
      <button
        type="button"
        aria-label="토스트 닫기"
        onClick={() => {
          setOpen(false);
          onClose?.();
        }}
        className="inline-flex items-center justify-center rounded p-0.5 hover:bg-emerald-500/20"
      >
        <X size={14} />
      </button>
    </div>
  );
};
