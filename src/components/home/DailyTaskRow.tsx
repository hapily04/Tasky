"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useDismissOnPointerDownOutside } from "@/lib/useDismissOnPointerDownOutside";
import { NeoCheckbox } from "@/components/neo/NeoCheckbox";
import { NeoInput } from "@/components/neo/NeoInput";
import { NeoButton } from "@/components/neo/NeoButton";
import { NeoIconButton } from "@/components/neo/NeoIconButton";
import { IconEdit, IconRemove } from "@/components/neo/icons";
import {
  deleteDailyTask,
  toggleDailyTask,
  updateDailyTaskTitle,
} from "@/lib/actions/daily-tasks";
import { TASK_TEXT_MAX_LENGTH, clampTaskText } from "@/lib/task-text";
import { TaskCardCelebration } from "@/components/celebrations/TaskCardCelebration";
import type { DailyTask } from "@prisma/client";

type DailyTaskRowProps = {
  task: DailyTask;
  embedded?: boolean;
  onToggle?: (id: string, completed: boolean) => void;
  onDelete?: (id: string) => void;
  onRestore?: (task: DailyTask) => void;
};

export function DailyTaskRow({
  task: initial,
  embedded = false,
  onToggle,
  onDelete,
  onRestore,
}: DailyTaskRowProps) {
  const [task, setTask] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [celebrating, setCelebrating] = useState(false);
  const [pending, startTransition] = useTransition();
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const cancelEdit = useCallback(() => {
    setTitle(task.title);
    setEditing(false);
  }, [task.title]);

  useDismissOnPointerDownOutside(editFormRef, cancelEdit, { enabled: editing });

  useEffect(() => {
    setTask(initial);
    setTitle(initial.title);
  }, [initial]);

  const rowClass = embedded ? "" : "neo-border";
  const bgClass = task.completed ? "bg-success/25" : "bg-surface";

  if (editing) {
    return (
      <TaskCardCelebration
        active={celebrating}
        checkboxRef={checkboxRef}
        onDone={() => setCelebrating(false)}
      >
      <form
        ref={editFormRef}
        className={`flex flex-col gap-2 px-3 py-3 ${rowClass} ${bgClass}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          startTransition(async () => {
            const result = await updateDailyTaskTitle(task.id, title);
            if (result && !("error" in result) && result.task) {
              setTask(result.task);
              setTitle(result.task.title);
              setEditing(false);
            }
          });
        }}
      >
        <NeoInput
          label="Task"
          value={title}
          maxLength={TASK_TEXT_MAX_LENGTH}
          onChange={(e) => setTitle(clampTaskText(e.target.value))}
          autoFocus
        />
        <div className="flex gap-2">
          <NeoButton type="submit" disabled={pending}>
            Save
          </NeoButton>
          <NeoButton type="button" variant="secondary" disabled={pending} onClick={cancelEdit}>
            Cancel
          </NeoButton>
        </div>
      </form>
      </TaskCardCelebration>
    );
  }

  return (
    <TaskCardCelebration
      active={celebrating}
      checkboxRef={checkboxRef}
      onDone={() => setCelebrating(false)}
    >
    <div
      className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-3 ${rowClass} ${bgClass}`}
    >
      <NeoCheckbox
        ref={checkboxRef}
        labelId={`daily-task-${task.id}`}
        checked={task.completed}
        label={task.title}
        expandDialogTitle="Task"
        fadeFromClass={task.completed ? "from-success/25" : "from-surface"}
        className="min-w-0"
        onChange={() => {
          const next = !task.completed;
          const prevCompleted = task.completed;
          const prevCompletedAt = task.completedAt;
          setTask((t) => ({
            ...t,
            completed: next,
            completedAt: next ? new Date() : null,
          }));
          onToggle?.(task.id, next);
          if (next) setCelebrating(true);
          startTransition(async () => {
            const result = await toggleDailyTask(task.id);
            if (!result || "error" in result) {
              setTask((t) => ({
                ...t,
                completed: prevCompleted,
                completedAt: prevCompletedAt,
              }));
              onToggle?.(task.id, prevCompleted);
              if (next) setCelebrating(false);
              return;
            }
            const serverCompleted = !!result.completed;
            setTask((t) => ({
              ...t,
              completed: serverCompleted,
              completedAt: serverCompleted ? new Date() : null,
            }));
            onToggle?.(task.id, serverCompleted);
            if (!serverCompleted) setCelebrating(false);
          });
        }}
      />

      <NeoIconButton
        label="Edit task"
        disabled={pending}
        className="relative z-10 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setTitle(task.title);
          setEditing(true);
        }}
      >
        <IconEdit />
      </NeoIconButton>

      <NeoIconButton
        label="Remove task"
        variant="danger"
        disabled={pending}
        className="relative z-10 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const removed = task;
          onDelete?.(task.id);
          if (task.id.startsWith("optimistic-")) return;
          startTransition(async () => {
            const result = await deleteDailyTask(task.id);
            if (!result || "error" in result) {
              onRestore?.(removed);
            }
          });
        }}
      >
        <IconRemove />
      </NeoIconButton>
    </div>
    </TaskCardCelebration>
  );
}
