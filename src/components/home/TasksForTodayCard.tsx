"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Reorder } from "framer-motion";
import { NeoCard } from "@/components/neo/NeoCard";
import { NeoIconButton } from "@/components/neo/NeoIconButton";
import { IconPlus } from "@/components/neo/icons";
import { DailyTaskRow } from "@/components/home/DailyTaskRow";
import { SortableDailyTaskRow } from "@/components/home/SortableDailyTaskRow";
import { createDailyTask, reorderDailyTasks } from "@/lib/actions/daily-tasks";
import { TASK_TEXT_MAX_LENGTH, clampTaskText } from "@/lib/task-text";
import type { DailyTask } from "@prisma/client";

type TasksForTodayCardProps = {
  tasks: DailyTask[];
  onTasksChange?: (tasks: DailyTask[]) => void;
};

function mergeTasks(prev: DailyTask[], incoming: DailyTask[]) {
  if (prev.length !== incoming.length) return incoming;
  const sameOrder = prev.every((t, i) => t.id === incoming[i]?.id);
  if (!sameOrder) return incoming;
  return prev.map((t) => {
    const next = incoming.find((n) => n.id === t.id);
    return next ?? t;
  });
}

export function TasksForTodayCard({
  tasks: initialTasks,
  onTasksChange,
}: TasksForTodayCardProps) {
  const [orderedTasks, setOrderedTasks] = useState(initialTasks);

  const updateOrderedTasks = (updater: (list: DailyTask[]) => DailyTask[]) => {
    setOrderedTasks((prev) => {
      const next = updater(prev);
      onTasksChange?.(next);
      return next;
    });
  };
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [canReorder, setCanReorder] = useState(false);
  const orderRef = useRef(orderedTasks);
  const listBoundsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanReorder(true);
  }, []);

  useEffect(() => {
    setOrderedTasks((prev) => mergeTasks(prev, initialTasks));
  }, [initialTasks]);

  useEffect(() => {
    orderRef.current = orderedTasks;
  }, [orderedTasks]);

  const persistOrder = () => {
    const ids = orderRef.current.map((t) => t.id);
    startTransition(async () => {
      await reorderDailyTasks(ids);
    });
  };

  const submit = () => {
    setError(null);
    const trimmed = title.trim();
    if (!trimmed) return;
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: DailyTask = {
      id: optimisticId,
      userId: "",
      title: trimmed,
      completed: false,
      completedAt: null,
      forDay: new Date(),
      sortOrder: orderedTasks.length,
      createdAt: new Date(),
    };
    updateOrderedTasks((list) => [...list, optimistic]);
    setTitle("");
    startTransition(async () => {
      const result = await createDailyTask(trimmed);
      if (result && "error" in result) {
        updateOrderedTasks((list) => list.filter((t) => t.id !== optimisticId));
        setTitle(trimmed);
        setError(result.error ?? "Could not add task");
        return;
      }
      if (result?.task) {
        updateOrderedTasks((list) =>
          list.map((t) => (t.id === optimisticId ? result.task! : t)),
        );
      }
    });
  };

  const handleToggle = (id: string, completed: boolean) => {
    updateOrderedTasks((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, completed, completedAt: completed ? new Date() : null }
          : t,
      ),
    );
  };

  const handleDelete = (id: string) => {
    updateOrderedTasks((list) => list.filter((t) => t.id !== id));
  };

  const handleRestore = (task: DailyTask) => {
    updateOrderedTasks((list) => {
      const next = [...list, task];
      next.sort((a, b) => a.sortOrder - b.sortOrder);
      return next;
    });
  };

  const rowCallbacks = {
    onToggle: handleToggle,
    onDelete: handleDelete,
    onRestore: handleRestore,
  };

  return (
    <NeoCard className="overflow-hidden p-0">
      <div ref={listBoundsRef} className="relative overflow-hidden">
        {orderedTasks.length > 0 &&
          (canReorder ? (
            <Reorder.Group
              axis="y"
              values={orderedTasks}
              onReorder={setOrderedTasks}
              className="m-0 list-none divide-y-3 divide-ink p-0"
            >
              {orderedTasks.map((task) => (
                <SortableDailyTaskRow
                  key={task.id}
                  task={task}
                  dragConstraintsRef={listBoundsRef}
                  onDragEnd={persistOrder}
                  {...rowCallbacks}
                />
              ))}
            </Reorder.Group>
          ) : (
            <ul className="m-0 list-none divide-y-3 divide-ink p-0">
              {orderedTasks.map((task) => (
                <li key={task.id} className="relative w-full bg-surface">
                  <DailyTaskRow task={task} embedded {...rowCallbacks} />
                </li>
              ))}
            </ul>
          ))}

        <form
          className={`flex items-center gap-2 bg-chrome px-3 py-3 ${orderedTasks.length > 0 ? "border-t-3 border-ink" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="text"
            value={title}
            maxLength={TASK_TEXT_MAX_LENGTH}
            onChange={(e) => setTitle(clampTaskText(e.target.value))}
            placeholder="Add a task…"
            disabled={pending}
            className="min-w-0 flex-1 bg-transparent py-1 font-medium outline-none placeholder:text-ink/40 focus:placeholder:text-ink/25"
            aria-label="New task for today"
          />
          <NeoIconButton
            type="submit"
            label="Add task"
            disabled={pending || !title.trim()}
            className={!title.trim() ? "opacity-40" : ""}
          >
            <IconPlus />
          </NeoIconButton>
        </form>
        {error && (
          <p className="border-t-3 border-ink px-4 py-2 text-sm font-bold text-accent-hot">{error}</p>
        )}
      </div>
    </NeoCard>
  );
}
