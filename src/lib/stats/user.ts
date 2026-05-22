import { prisma } from "@/lib/prisma";
import { isGoalSuccessful, partitionActiveGoals } from "@/lib/goals";
import { startOfDayUTC, todayStartUTC } from "@/lib/dates";

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return startOfDayUTC(d);
}

const completedDailyTask = {
  completed: true,
  completedAt: { not: null },
};

export async function getUserStats(userId: string) {
  const todayStart = todayStartUTC();

  const [
    goals,
    subtasks7d,
    subtasks30d,
    subtasksAll,
    subtaskCompletionDays,
    goalsArchived,
    subtasksArchived,
    dailyTasksAll,
    dailyTasks7d,
    dailyTasks30d,
    dailyTaskCompletionDays,
    dailyTasksToday,
    dailyTasksCompletedToday,
  ] = await Promise.all([
    prisma.goal.findMany({ where: { userId } }),
    prisma.subtask.count({
      where: {
        completed: true,
        archived: false,
        goal: { userId },
        completedAt: { gte: daysAgo(7) },
      },
    }),
    prisma.subtask.count({
      where: {
        completed: true,
        archived: false,
        goal: { userId },
        completedAt: { gte: daysAgo(30) },
      },
    }),
    prisma.subtask.count({
      where: { completed: true, archived: false, goal: { userId } },
    }),
    prisma.subtask.findMany({
      where: {
        completed: true,
        archived: false,
        goal: { userId },
        completedAt: { not: null },
      },
      select: { completedAt: true },
    }),
    prisma.goal.count({ where: { userId, status: "ARCHIVED" } }),
    prisma.subtask.count({ where: { archived: true, goal: { userId } } }),
    prisma.dailyTask.findMany({ where: { userId } }),
    prisma.dailyTask.count({
      where: { userId, ...completedDailyTask, completedAt: { gte: daysAgo(7) } },
    }),
    prisma.dailyTask.count({
      where: { userId, ...completedDailyTask, completedAt: { gte: daysAgo(30) } },
    }),
    prisma.dailyTask.findMany({
      where: { userId, ...completedDailyTask },
      select: { completedAt: true },
    }),
    prisma.dailyTask.count({ where: { userId, forDay: todayStart } }),
    prisma.dailyTask.count({
      where: {
        userId,
        forDay: todayStart,
        ...completedDailyTask,
      },
    }),
  ]);

  const goalsCreated = goals.length;
  const goalsCompleted = goals.filter((g) => g.status === "COMPLETED").length;
  const goalsActive = goals.filter((g) => g.status === "ACTIVE");
  const goalsWithDeadline = goals.filter((g) => g.deadline != null);
  const successfulGoals = goals.filter((g) => isGoalSuccessful(g)).length;
  const goalSuccessPct =
    goalsWithDeadline.length > 0
      ? Math.round((successfulGoals / goalsWithDeadline.length) * 100)
      : null;

  const openEndedGoals = goals.filter((g) => !g.deadline);
  const openEndedCompleted = openEndedGoals.filter((g) => g.status === "COMPLETED").length;
  const openEndedRate =
    openEndedGoals.length > 0
      ? Math.round((openEndedCompleted / openEndedGoals.length) * 100)
      : null;

  const partitioned = partitionActiveGoals(
    goalsActive.map((g) => ({ ...g, subtasks: [] })),
  );
  const activeGoalsOverdue = partitioned.goalsSection.overdue.length;
  const activeGoalsDueToday = partitioned.goalsSection.dueToday.length;
  const activeGoalsOpenEnded = partitioned.goalsSection.openEnded.length;
  const activeGoalsLongTerm = partitioned.longTerm.length;

  const dailyTasksCreated = dailyTasksAll.length;
  const dailyTasksCompleted = dailyTasksAll.filter((t) => t.completed).length;
  const dailyTaskCompletionRate =
    dailyTasksCreated > 0
      ? Math.round((dailyTasksCompleted / dailyTasksCreated) * 100)
      : null;

  const streak = computeStreakFromCompletions(subtaskCompletionDays, dailyTaskCompletionDays);
  const bestWeek = await computeBestWeek(userId);
  const last7Days = await getLast7DayCounts(userId);

  return {
    goalsCreated,
    goalsCompleted,
    goalsActive: goalsActive.length,
    goalSuccessPct,
    openEndedRate,
    activeGoalsOverdue,
    activeGoalsDueToday,
    activeGoalsOpenEnded,
    activeGoalsLongTerm,
    dailyTasksCreated,
    dailyTasksCompleted,
    dailyTaskCompletionRate,
    dailyTasks7d,
    dailyTasks30d,
    dailyTasksToday,
    dailyTasksCompletedToday,
    subtasks7d,
    subtasks30d,
    subtasksAll,
    goalsArchived,
    subtasksArchived,
    streak,
    bestWeek,
    last7Days,
  };
}

function computeStreakFromCompletions(
  subtaskCompletionDays: { completedAt: Date | null }[],
  dailyTaskCompletionDays: { completedAt: Date | null }[],
) {
  const activityDates = [
    ...subtaskCompletionDays.map((s) => s.completedAt!),
    ...dailyTaskCompletionDays.map((t) => t.completedAt!),
  ];
  return computeStreak(activityDates);
}

export async function getUserStreak(userId: string) {
  const [subtaskCompletionDays, dailyTaskCompletionDays] = await Promise.all([
    prisma.subtask.findMany({
      where: {
        completed: true,
        archived: false,
        goal: { userId },
        completedAt: { not: null },
      },
      select: { completedAt: true },
    }),
    prisma.dailyTask.findMany({
      where: { userId, ...completedDailyTask },
      select: { completedAt: true },
    }),
  ]);

  return computeStreakFromCompletions(subtaskCompletionDays, dailyTaskCompletionDays);
}

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const daySet = new Set(dates.map((d) => startOfDayUTC(d).toISOString()));

  let streak = 0;
  const today = startOfDayUTC(new Date());
  let cursor = today;

  const todayKey = today.toISOString();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  if (!daySet.has(todayKey) && !daySet.has(yesterday.toISOString())) {
    return 0;
  }

  if (!daySet.has(todayKey)) {
    cursor = yesterday;
  }

  while (daySet.has(cursor.toISOString())) {
    streak += 1;
    const prev = new Date(cursor);
    prev.setUTCDate(prev.getUTCDate() - 1);
    cursor = startOfDayUTC(prev);
  }

  return streak;
}

async function computeBestWeek(userId: string) {
  const [subtaskCompletions, dailyCompletions] = await Promise.all([
    prisma.subtask.findMany({
      where: { completed: true, goal: { userId }, completedAt: { not: null } },
      select: { completedAt: true },
    }),
    prisma.dailyTask.findMany({
      where: { userId, ...completedDailyTask },
      select: { completedAt: true },
    }),
  ]);

  const completions = [...subtaskCompletions, ...dailyCompletions];
  if (completions.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const { completedAt } of completions) {
    const key = startOfDayUTC(completedAt!).toISOString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sortedDays = [...counts.keys()].sort();
  let best = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    let total = 0;
    const start = new Date(sortedDays[i]);
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + d);
      total += counts.get(startOfDayUTC(day).toISOString()) ?? 0;
    }
    best = Math.max(best, total);
  }
  return best;
}

async function getLast7DayCounts(userId: string) {
  const rangeStart = daysAgo(6);
  const rangeEnd = daysAgo(-1);

  const [subtaskCompletions, dailyCompletions] = await Promise.all([
    prisma.subtask.findMany({
      where: {
        completed: true,
        archived: false,
        goal: { userId },
        completedAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: { completedAt: true },
    }),
    prisma.dailyTask.findMany({
      where: {
        userId,
        forDay: { gte: rangeStart, lt: rangeEnd },
        ...completedDailyTask,
      },
      select: { forDay: true },
    }),
  ]);

  const subtasksByDay = new Map<string, number>();
  for (const { completedAt } of subtaskCompletions) {
    const key = startOfDayUTC(completedAt!).toISOString();
    subtasksByDay.set(key, (subtasksByDay.get(key) ?? 0) + 1);
  }

  const dailyByDay = new Map<string, number>();
  for (const { forDay } of dailyCompletions) {
    const key = startOfDayUTC(forDay).toISOString();
    dailyByDay.set(key, (dailyByDay.get(key) ?? 0) + 1);
  }

  const result: {
    label: string;
    subtasks: number;
    dailyTasks: number;
    total: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const start = daysAgo(i);
    const key = start.toISOString();
    const subtasks = subtasksByDay.get(key) ?? 0;
    const dailyTasks = dailyByDay.get(key) ?? 0;
    result.push({
      label: start.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      subtasks,
      dailyTasks,
      total: subtasks + dailyTasks,
    });
  }
  return result;
}

export type UserStats = Awaited<ReturnType<typeof getUserStats>>;
