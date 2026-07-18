"use client";

import { Check } from "lucide-react";

export interface UndoToastProps {
  message: string;
  onUndo: () => void;
}

export function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-8">
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-[440px] items-center gap-3 rounded-xl bg-text py-3 pl-4 pr-2.5 text-white shadow-lg"
        style={{ animation: "vibe-slide-up 200ms var(--ease-standard)" }}
      >
        <Check size={18} strokeWidth={1.5} className="shrink-0 text-primary" aria-hidden />
        <span className="flex-1 text-sm">{message}</span>
        <button
          type="button"
          onClick={onUndo}
          className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Deshacer
        </button>
      </div>
    </div>
  );
}
