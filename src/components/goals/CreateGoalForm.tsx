"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NeoButton } from "@/components/neo/NeoButton";
import { NeoInput } from "@/components/neo/NeoInput";
import { SubtaskFieldList, getFilledSubtasks } from "@/components/goals/SubtaskFieldList";
import { createGoal } from "@/lib/actions/goals";

type CreateGoalFormProps = {
  onCreated?: () => void;
};

export function CreateGoalForm({ onCreated }: CreateGoalFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subtaskFields, setSubtaskFields] = useState([""]);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4 animate-row-enter"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        getFilledSubtasks(subtaskFields).forEach((t) => fd.append("subtasks", t));
        startTransition(async () => {
          const result = await createGoal(fd);
          if (result && "error" in result) {
            setError(result.error ?? "Could not create goal");
            return;
          }
          form.reset();
          setSubtaskFields([""]);
          onCreated?.();
          router.refresh();
        });
      }}
    >
      <NeoInput name="title" label="Goal title" required placeholder="Ship the landing page" />
      <NeoInput name="deadline" label="Deadline (optional)" type="date" />
      <SubtaskFieldList fields={subtaskFields} onChange={setSubtaskFields} />
      {error && <p className="text-sm font-bold text-accent-hot">{error}</p>}
      <NeoButton type="submit" fullWidth disabled={pending}>
        {pending ? "Creating…" : "Create goal"}
      </NeoButton>
    </form>
  );
}
