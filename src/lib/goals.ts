import type { Goal, GoalStatus, Subtask } from "@prisma/client";
import { startOfDayUTC } from "@/lib/dates";

export type GoalWithSubtasks = Goal & { subtasks: Subtask[] };

export type GoalBadge = "due-today" | "overdue";

export type PartitionedGoals = {
  goalsSection: {
    overdue: GoalWithSubtasks[];
    dueToday: GoalWithSubtasks[];
    openEnded: GoalWithSubtasks[];
  };
  longTerm: GoalWithSubtasks[];
};

export function activeSubtasks(subtasks: Subtask[]) {
  return subtasks.filter((s) => !s.archived);
}

export function subtaskProgress(subtasks: Subtask[]) {
  const active = activeSubtasks(subtasks);
  if (active.length === 0) return 0;
  const done = active.filter((s) => s.completed).length;
  return Math.round((done / active.length) * 100);
}

export function isGoalFullyComplete(subtasks: Subtask[]) {
  const active = activeSubtasks(subtasks);
  return active.length > 0 && active.every((s) => s.completed);
}

export function canToggleGoalCompletion(
  goal: Pick<Goal, "status">,
  subtasks: Subtask[],
) {
  return goal.status !== "ARCHIVED" && activeSubtasks(subtasks).length === 0;
}

export function isGoalMissed(goal: Goal) {
  if (goal.status !== "ACTIVE" || !goal.deadline) return false;
  return new Date() > goal.deadline;
}

export function isGoalSuccessful(
  goal: Pick<Goal, "status" | "completedAt" | "deadline">,
) {
  if (goal.status !== "COMPLETED" || !goal.completedAt) return false;
  if (!goal.deadline) return true;
  return goal.completedAt <= goal.deadline;
}

export const ACTIVE: GoalStatus = "ACTIVE";

export const RECENTLY_COMPLETED_MS = 5 * 60 * 1000;

export function recentlyCompletedCutoff() {
  return new Date(Date.now() - RECENTLY_COMPLETED_MS);
}

export function deadlineDay(deadline: Date) {
  return startOfDayUTC(deadline);
}

export function isDeadlineOverdue(deadline: Date, now = new Date()) {
  return deadlineDay(deadline).getTime() < startOfDayUTC(now).getTime();
}

export function isDeadlineToday(deadline: Date, now = new Date()) {
  return deadlineDay(deadline).getTime() === startOfDayUTC(now).getTime();
}

export function isDeadlineFuture(deadline: Date, now = new Date()) {
  return deadlineDay(deadline).getTime() > startOfDayUTC(now).getTime();
}

export function formatGoalDeadline(deadline: Date, now = new Date()) {
  const d = deadlineDay(deadline);
  const opts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };
  const base = d.toLocaleDateString("en-US", opts);
  if (d.getUTCFullYear() !== now.getUTCFullYear()) {
    return `${base}, ${d.getUTCFullYear()}`;
  }
  return base;
}

function sortByDeadlineAsc(goals: GoalWithSubtasks[]) {
  return [...goals].sort(
    (a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0),
  );
}

function sortByCreatedDesc(goals: GoalWithSubtasks[]) {
  return [...goals].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function partitionActiveGoals(
  goals: GoalWithSubtasks[],
  now = new Date(),
): PartitionedGoals {
  const overdue: GoalWithSubtasks[] = [];
  const dueToday: GoalWithSubtasks[] = [];
  const openEnded: GoalWithSubtasks[] = [];
  const longTerm: GoalWithSubtasks[] = [];

  for (const goal of goals) {
    if (!goal.deadline) {
      openEnded.push(goal);
      continue;
    }
    if (isDeadlineFuture(goal.deadline, now)) {
      longTerm.push(goal);
    } else if (isDeadlineToday(goal.deadline, now)) {
      dueToday.push(goal);
    } else {
      overdue.push(goal);
    }
  }

  return {
    goalsSection: {
      overdue: sortByDeadlineAsc(overdue),
      dueToday: sortByDeadlineAsc(dueToday),
      openEnded: sortByCreatedDesc(openEnded),
    },
    longTerm: sortByDeadlineAsc(longTerm),
  };
}

export function goalBadge(
  goal: GoalWithSubtasks,
  now = new Date(),
): GoalBadge | undefined {
  if (!goal.deadline) return undefined;
  if (isDeadlineOverdue(goal.deadline, now)) return "overdue";
  if (isDeadlineToday(goal.deadline, now)) return "due-today";
  return undefined;
}
