"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { NeoCheckbox } from "@/components/neo/NeoCheckbox";
import { NeoInput } from "@/components/neo/NeoInput";
import { NeoButton } from "@/components/neo/NeoButton";
import { NeoIconButton } from "@/components/neo/NeoIconButton";
import { IconArchive, IconEdit } from "@/components/neo/icons";
import { archiveSubtask, toggleSubtask, updateSubtaskTitle } from "@/lib/actions/goals";
import { TASK_TEXT_MAX_LENGTH, clampTaskText } from "@/lib/task-text";
import { TaskCardCelebration } from "@/components/celebrations/TaskCardCelebration";
import type { Subtask } from "@prisma/client";

type SubtaskRowProps = {
  subtask: Subtask;
  embedded?: boolean;
  onToggle?: (
    subtaskId: string,
    result: { goalCompleted?: boolean; subtaskCompleted?: boolean },
  ) => void;
  onArchive?: (subtaskId: string) => void;
  onTitleUpdate?: (subtaskId: string, title: string) => void;
};

export function SubtaskRow({
  subtask,
  embedded = false,
  onToggle,
  onArchive,
  onTitleUpdate,
}: SubtaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const [completed, setCompleted] = useState(subtask.completed);
  const [celebrating, setCelebrating] = useState(false);
  const [pending, startTransition] = useTransition();
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCompleted(subtask.completed);
    setTitle(subtask.title);
  }, [subtask.id, subtask.completed, subtask.title]);

  if (subtask.archived) return null;

  const rowClass = embedded ? "" : "neo-border";
  const bgClass = completed ? "bg-success/25" : "bg-surface";
  const fadeFrom = completed ? "from-success/25" : "from-surface";

  if (editing) {
    return (
      <form
        className={`flex flex-col gap-2 px-3 py-3 ${rowClass} ${bgClass}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          startTransition(async () => {
            const result = await updateSubtaskTitle(subtask.id, title);
            if (result && !("error" in result)) {
              onTitleUpdate?.(subtask.id, title.trim());
              setEditing(false);
            }
          });
        }}
      >
        <NeoInput
          label="Subtask"
          value={title}
          maxLength={TASK_TEXT_MAX_LENGTH}
          onChange={(e) => setTitle(clampTaskText(e.target.value))}
          autoFocus
        />
        <div className="flex gap-2">
          <NeoButton type="submit" disabled={pending}>
            Save
          </NeoButton>
          <NeoButton
            type="button"
            variant="secondary"
            onClick={() => {
              setTitle(subtask.title);
              setEditing(false);
            }}
          >
            Cancel
          </NeoButton>
        </div>
      </form>
    );
  }

  return (
    <TaskCardCelebration
      active={celebrating}
      checkboxRef={checkboxRef}
      onDone={() => setCelebrating(false)}
    >
      <div
        className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2.5 ${rowClass} ${bgClass}`}
      >
        <NeoCheckbox
          ref={checkboxRef}
          checked={completed}
          label={subtask.title}
          expandDialogTitle="Subtask"
          fadeFromClass={fadeFrom}
          className="min-w-0"
          onChange={() => {
            const next = !completed;
            setCompleted(next);
            if (next) setCelebrating(true);
            startTransition(async () => {
              const result = await toggleSubtask(subtask.id);
              if (!result || "error" in result) {
                setCompleted(!next);
                if (next) setCelebrating(false);
                return;
              }
              onToggle?.(subtask.id, result);
            });
          }}
        />
        <NeoIconButton
          label="Edit subtask"
          disabled={pending}
          className="relative z-10 shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          <IconEdit />
        </NeoIconButton>
        <NeoIconButton
          label="Archive subtask"
          variant="danger"
          disabled={pending}
          className="relative z-10 shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!confirm("Archive this subtask?")) return;
            startTransition(async () => {
              const result = await archiveSubtask(subtask.id);
              if (result && !("error" in result)) onArchive?.(subtask.id);
            });
          }}
        >
          <IconArchive />
        </NeoIconButton>
      </div>
    </TaskCardCelebration>
  );
}
