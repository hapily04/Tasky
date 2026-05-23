"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { Reorder } from "framer-motion";
import { useRouter } from "next/navigation";
import { NeoCard } from "@/components/neo/NeoCard";
import { NeoButton } from "@/components/neo/NeoButton";
import { NeoInput } from "@/components/neo/NeoInput";
import { NeoIconButton } from "@/components/neo/NeoIconButton";
import { IconPlus } from "@/components/neo/icons";
import { GoalCardCelebration } from "@/components/celebrations/GoalCardCelebration";
import { SortableSubtaskRow } from "@/components/goals/SortableSubtaskRow";
import { SubtaskRow } from "@/components/goals/SubtaskRow";
import {
  activeSubtasks,
  canToggleGoalCompletion,
  subtaskProgress,
  isGoalMissed,
  isGoalFullyComplete,
} from "@/lib/goals";
import { GoalManualCompleteButton } from "@/components/goals/GoalManualCompleteButton";
import { NeoConfirmDialog } from "@/components/neo/NeoConfirmDialog";
import { playCompletionChime, playGoalCompletionFanfare } from "@/lib/sound";
import {
  addSubtask,
  archiveGoal,
  reorderSubtasks,
  updateGoal,
} from "@/lib/actions/goals";
import { formatDateOnlyInput, parseDateOnlyInput } from "@/lib/dates";
import { TASK_TEXT_MAX_LENGTH, clampTaskText } from "@/lib/task-text";
import { useDismissOnPointerDownOutside } from "@/lib/useDismissOnPointerDownOutside";
import type { GoalBadge, GoalWithSubtasks } from "@/lib/goals";
import type { GoalStatus, Subtask } from "@prisma/client";

const BADGE_LABELS: Record<GoalBadge, string> = {
  overdue: "Overdue",
  "due-today": "Due today",
};

type GoalCardProps = {
  goal: GoalWithSubtasks;
  soundEnabled?: boolean;
  badge?: GoalBadge;
  deadlineLabel?: string;
};

export function GoalCard({ goal: initial, soundEnabled, badge, deadlineLabel }: GoalCardProps) {
  const router = useRouter();
  const [goal, setGoal] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [deadline, setDeadline] = useState(
    initial.deadline ? formatDateOnlyInput(initial.deadline) : "",
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskEditing, setSubtaskEditing] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [completingGoal, setCompletingGoal] = useState(false);
  const [canReorder, setCanReorder] = useState(false);
  const markCompleteRef = useRef<HTMLButtonElement>(null);
  const subtaskListRef = useRef<HTMLDivElement>(null);
  const subtaskOrderRef = useRef<Subtask[]>([]);
  const editSurfaceRef = useRef<HTMLDivElement>(null);
  const subtaskEditingCountRef = useRef(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCanReorder(true);
  }, []);

  useEffect(() => {
    if (!completingGoal) {
      setGoal(initial);
      setTitle(initial.title);
      setDeadline(initial.deadline ? formatDateOnlyInput(initial.deadline) : "");
    }
  }, [initial, completingGoal]);

  const active = activeSubtasks(goal.subtasks);
  const orderedActive = [...active].sort((a, b) => a.sortOrder - b.sortOrder);
  const [orderedSubtasks, setOrderedSubtasks] = useState(orderedActive);
  const hasSubtasks = orderedActive.length > 0;
  const progress = subtaskProgress(goal.subtasks);
  const missed = isGoalMissed(goal);
  const allSubtasksDone = isGoalFullyComplete(goal.subtasks);
  const isComplete = goal.status === "COMPLETED";
  const showManualComplete = canToggleGoalCompletion(goal, goal.subtasks);

  const exitEditMode = useCallback(() => {
    setTitle(goal.title);
    setDeadline(goal.deadline ? formatDateOnlyInput(goal.deadline) : "");
    setNewSubtaskTitle("");
    setEditing(false);
  }, [goal.title, goal.deadline]);

  useDismissOnPointerDownOutside(editSurfaceRef, exitEditMode, {
    enabled: editing && !subtaskEditing,
  });

  const handleSubtaskEditingChange = useCallback((isEditing: boolean) => {
    subtaskEditingCountRef.current = Math.max(
      0,
      subtaskEditingCountRef.current + (isEditing ? 1 : -1),
    );
    setSubtaskEditing(subtaskEditingCountRef.current > 0);
  }, []);

  useEffect(() => {
    const next = activeSubtasks(goal.subtasks).sort((a, b) => a.sortOrder - b.sortOrder);
    setOrderedSubtasks((prev) => {
      if (
        prev.length === next.length &&
        prev.every((s, i) => s.id === next[i]?.id && s.completed === next[i]?.completed)
      ) {
        return prev.map((s) => next.find((n) => n.id === s.id) ?? s);
      }
      return next;
    });
  }, [goal.subtasks]);

  useEffect(() => {
    subtaskOrderRef.current = orderedSubtasks;
  }, [orderedSubtasks]);

  const finishGoalCompletion = useCallback(() => {
    setCompletingGoal(false);
    setGoal((g) => ({
      ...g,
      status: "COMPLETED" as GoalStatus,
      completedAt: new Date(),
    }));
    startTransition(() => router.refresh());
  }, [router]);

  const handleGoalComplete = () => {
    setCompletingGoal(true);
  };

  const applySubtaskToggle = (
    subtaskId: string,
    result: { goalCompleted?: boolean; subtaskCompleted?: boolean },
  ) => {
    setGoal((g) => {
      const subtasks = g.subtasks.map((s) =>
        s.id === subtaskId
          ? {
              ...s,
              completed: !!result.subtaskCompleted,
              completedAt: result.subtaskCompleted ? new Date() : null,
            }
          : s,
      );
      return {
        ...g,
        subtasks,
        status: g.status === "COMPLETED" && !isGoalFullyComplete(subtasks) ? "ACTIVE" : g.status,
        completedAt:
          g.status === "COMPLETED" && !isGoalFullyComplete(subtasks) ? null : g.completedAt,
      };
    });
  };

  const handleSubtaskToggle = (
    subtaskId: string,
    result: { goalCompleted?: boolean; subtaskCompleted?: boolean },
  ) => {
    applySubtaskToggle(subtaskId, result);
    if (result.subtaskCompleted && soundEnabled && !result.goalCompleted) {
      playCompletionChime();
    }
    if (result.goalCompleted) {
      handleGoalComplete();
    }
  };

  const handleSubtaskArchive = (subtaskId: string) => {
    setGoal((g) => ({
      ...g,
      subtasks: g.subtasks.map((s) =>
        s.id === subtaskId
          ? { ...s, archived: true, archivedAt: new Date(), completed: false, completedAt: null }
          : s,
      ),
    }));
    setOrderedSubtasks((list) => list.filter((s) => s.id !== subtaskId));
  };

  const handleTitleUpdate = (subtaskId: string, t: string) => {
    setGoal((g) => ({
      ...g,
      subtasks: g.subtasks.map((s) => (s.id === subtaskId ? { ...s, title: t } : s)),
    }));
  };

  const persistSubtaskOrder = () => {
    const ids = subtaskOrderRef.current.map((s) => s.id);
    startTransition(async () => {
      await reorderSubtasks(goal.id, ids);
    });
  };

  const submitNewSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addSubtask(goal.id, trimmed);
      if (result && !("error" in result) && result.subtask) {
        setGoal((g) => ({
          ...g,
          subtasks: [...g.subtasks, result.subtask],
          status: g.status === "COMPLETED" ? "ACTIVE" : g.status,
          completedAt: g.status === "COMPLETED" ? null : g.completedAt,
        }));
        setOrderedSubtasks((list) => [...list, result.subtask]);
        setNewSubtaskTitle("");
      }
    });
  };

  const subtaskRowProps = {
    onToggle: handleSubtaskToggle,
    onArchive: handleSubtaskArchive,
    onTitleUpdate: handleTitleUpdate,
    onEditingChange: handleSubtaskEditingChange,
  };

  const subtaskListBody =
    hasSubtasks &&
    (canReorder ? (
      <Reorder.Group
        axis="y"
        values={orderedSubtasks}
        onReorder={setOrderedSubtasks}
        className="m-0 list-none p-0"
      >
        {orderedSubtasks.map((s) => (
          <SortableSubtaskRow
            key={s.id}
            subtask={s}
            dragConstraintsRef={subtaskListRef}
            onDragEnd={persistSubtaskOrder}
            {...subtaskRowProps}
          />
        ))}
      </Reorder.Group>
    ) : (
      <ul className="m-0 list-none p-0">
        {orderedSubtasks.map((s) => (
          <li key={s.id} className="border-t-3 border-ink first:border-t-0">
            <SubtaskRow subtask={s} embedded {...subtaskRowProps} />
          </li>
        ))}
      </ul>
    ));

  const addSubtaskRow = editing && (
    <form
      className={`flex items-center gap-2 bg-chrome px-3 py-2 ${hasSubtasks ? "border-t-3 border-ink" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        submitNewSubtask();
      }}
    >
      <input
        type="text"
        value={newSubtaskTitle}
        maxLength={TASK_TEXT_MAX_LENGTH}
        onChange={(e) => setNewSubtaskTitle(clampTaskText(e.target.value))}
        placeholder="Add a subtask…"
        className="min-w-0 flex-1 bg-transparent py-1 font-medium outline-none placeholder:text-ink/40"
        aria-label="New subtask"
      />
      <NeoIconButton
        type="submit"
        label="Add subtask"
        disabled={!newSubtaskTitle.trim()}
        className={!newSubtaskTitle.trim() ? "opacity-40" : ""}
      >
        <IconPlus />
      </NeoIconButton>
    </form>
  );

  const subtaskSection = (hasSubtasks || editing) && (
    <div
      ref={subtaskListRef}
      className={`neo-border mb-3 overflow-hidden ${editing && !hasSubtasks ? "animate-row-enter" : ""}`}
    >
      {subtaskListBody}
      {addSubtaskRow}
    </div>
  );

  const readHeader = (
    <div className="mb-2 flex items-start justify-between gap-2">
      <p className="min-w-0 flex-1 font-bold leading-snug">{goal.title}</p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {badge && (
          <span className="neo-border bg-accent-hot px-2 py-0.5 text-xs font-bold text-white">
            {BADGE_LABELS[badge]}
          </span>
        )}
        {(completingGoal || isComplete) && (
          <span className="neo-border bg-accent px-2 py-0.5 text-xs font-bold">
            {completingGoal ? "…" : "Done!"}
          </span>
        )}
        {hasSubtasks && <span className="text-sm font-bold">{progress}%</span>}
      </div>
    </div>
  );

  const progressBar = hasSubtasks && (
    <div className="neo-border mb-3 h-3 w-full bg-chrome">
      <div
        className="h-full bg-success transition-[width] duration-200 ease-out"
        style={{ width: `${completingGoal || allSubtasksDone ? 100 : progress}%` }}
      />
    </div>
  );

  return (
    <GoalCardCelebration
      active={completingGoal}
      originRef={markCompleteRef}
      onErupt={() => {
        if (soundEnabled) playGoalCompletionFanfare();
      }}
      onDone={finishGoalCompletion}
    >
      <NeoCard
        className={`transition-colors duration-150 ${completingGoal ? "bg-success/30 ring-4 ring-accent" : ""} ${missed ? "border-accent-hot" : ""} ${isComplete && !completingGoal ? "bg-success/10" : ""}`}
      >
        {editing ? (
          <div ref={editSurfaceRef} className="mb-3 flex flex-col gap-3">
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const result = await updateGoal(goal.id, {
                    title,
                    deadline: deadline || null,
                  });
                  if (result && !("error" in result)) {
                    setGoal((g) => ({
                      ...g,
                      title: title.trim(),
                      deadline: deadline ? parseDateOnlyInput(deadline) : null,
                    }));
                    setEditing(false);
                  }
                });
              }}
            >
              <NeoInput
                label="Goal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <NeoInput
                label="Deadline (optional)"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <div className="flex gap-2">
                <NeoButton type="submit">Save</NeoButton>
                <NeoButton type="button" variant="secondary" onClick={exitEditMode}>
                  Cancel
                </NeoButton>
              </div>
            </form>
            {progressBar}
            {subtaskSection}
          </div>
        ) : (
          <>
            {readHeader}
            {deadlineLabel && (
              <p className="mb-2 text-sm font-bold text-ink/70">{deadlineLabel}</p>
            )}
            {progressBar}
            {hasSubtasks && subtaskSection}
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <GoalManualCompleteButton
            goalId={goal.id}
            status={goal.status}
            show={showManualComplete}
            disabled={completingGoal}
            buttonRef={markCompleteRef}
            onCompleted={handleGoalComplete}
            onFailed={() => setCompletingGoal(false)}
            onReopened={() => {
              setGoal((g) => ({
                ...g,
                status: "ACTIVE",
                completedAt: null,
              }));
              startTransition(() => router.refresh());
            }}
          />
          {!editing && (
            <NeoButton type="button" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </NeoButton>
          )}
          {goal.status !== "ARCHIVED" && (
            <NeoButton
              type="button"
              variant="ghost"
              onClick={() => setArchiveConfirmOpen(true)}
            >
              Archive
            </NeoButton>
          )}
        </div>
      </NeoCard>
      <NeoConfirmDialog
        open={archiveConfirmOpen}
        title="Archive this goal?"
        message="You can't undo this from the app."
        confirmLabel="Archive"
        confirmVariant="danger"
        pending={pending}
        onCancel={() => setArchiveConfirmOpen(false)}
        onConfirm={() => {
          startTransition(async () => {
            const result = await archiveGoal(goal.id);
            if (result && !("error" in result)) {
              setArchiveConfirmOpen(false);
              router.refresh();
            }
          });
        }}
      />
    </GoalCardCelebration>
  );
}
