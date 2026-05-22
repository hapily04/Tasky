"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NeoButton } from "@/components/neo/NeoButton";

type TaskTextDialogProps = {
  open: boolean;
  text: string;
  title?: string;
  onClose: () => void;
};

export function TaskTextDialog({
  open,
  text,
  title = "Full text",
  onClose,
}: TaskTextDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-text-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="neo-border neo-shadow-lg relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto bg-surface p-5">
        <p id="task-text-dialog-title" className="mb-3 text-sm font-bold uppercase tracking-wide">
          {title}
        </p>
        <p className="break-words font-medium leading-relaxed whitespace-pre-wrap">{text}</p>
        <NeoButton type="button" variant="secondary" className="mt-4" onClick={onClose}>
          Close
        </NeoButton>
      </div>
    </div>,
    document.body,
  );
}
