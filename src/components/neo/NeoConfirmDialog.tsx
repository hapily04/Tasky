"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { NeoButton } from "@/components/neo/NeoButton";

type ConfirmVariant = "primary" | "danger";

type NeoConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmVariant;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function NeoConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  pending = false,
  onConfirm,
  onCancel,
}: NeoConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, pending]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={message ? descId : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Cancel"
        disabled={pending}
        onClick={onCancel}
      />
      <div className="neo-border neo-shadow-lg relative z-10 w-full max-w-md bg-surface p-5">
        <p id={titleId} className="text-sm font-bold uppercase tracking-wide">
          {title}
        </p>
        {message && (
          <p id={descId} className="mt-2 font-medium leading-relaxed text-ink/80">
            {message}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <NeoButton type="button" variant="secondary" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </NeoButton>
          <NeoButton
            type="button"
            variant={confirmVariant}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "…" : confirmLabel}
          </NeoButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
