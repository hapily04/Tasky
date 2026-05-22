"use client";

import { useTransition, type RefObject } from "react";
import { NeoButton } from "@/components/neo/NeoButton";
import { toggleGoalComplete } from "@/lib/actions/goals";
import type { GoalStatus } from "@prisma/client";

type GoalManualCompleteButtonProps = {
  goalId: string;
  status: GoalStatus;
  show: boolean;
  disabled?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onCompleted: () => void;
  onFailed?: () => void;
  onReopened: () => void;
};

export function GoalManualCompleteButton({
  goalId,
  status,
  show,
  disabled,
  buttonRef,
  onCompleted,
  onFailed,
  onReopened,
}: GoalManualCompleteButtonProps) {
  const [pending, startTransition] = useTransition();

  if (!show) return null;

  if (status === "ACTIVE") {
    return (
      <NeoButton
        ref={buttonRef}
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          onCompleted();
          startTransition(async () => {
            const result = await toggleGoalComplete(goalId);
            if (!result || "error" in result || !result.completed) {
              onFailed?.();
            }
          });
        }}
      >
        {pending ? "Saving…" : "Mark complete"}
      </NeoButton>
    );
  }

  if (status === "COMPLETED") {
    return (
      <NeoButton
        ref={buttonRef}
        type="button"
        variant="secondary"
        disabled={disabled || pending}
        onClick={() => {
          startTransition(async () => {
            const result = await toggleGoalComplete(goalId);
            if (result && !("error" in result) && !result.completed) {
              onReopened();
            }
          });
        }}
      >
        {pending ? "Saving…" : "Mark active again"}
      </NeoButton>
    );
  }

  return null;
}
