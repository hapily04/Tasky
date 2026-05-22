import { prisma } from "@/lib/prisma";
import { todayStartUTC } from "@/lib/dates";

function isSameUtcDay(a: Date, b: Date) {
  return a.getTime() === b.getTime();
}

/** Most recent calendar day (before `before`) that has at least one stored task. */
async function latestTaskDayBefore(userId: string, before: Date) {
  const row = await prisma.dailyTask.findFirst({
    where: { userId, forDay: { lt: before } },
    orderBy: { forDay: "desc" },
    select: { forDay: true },
  });
  return row?.forDay ?? null;
}

/**
 * Ensures today has a daily-task row for each item on the user's latest prior day.
 * Past days are left unchanged so completed / not-completed status is preserved.
 */
export async function ensureTodayDailyTasks(userId: string) {
  const forDay = todayStartUTC();

  const todayCount = await prisma.dailyTask.count({
    where: { userId, forDay },
  });
  if (todayCount > 0) return;

  const sourceDay = await latestTaskDayBefore(userId, forDay);
  if (!sourceDay) return;

  const sourceTasks = await prisma.dailyTask.findMany({
    where: { userId, forDay: sourceDay },
    orderBy: { sortOrder: "asc" },
  });
  if (sourceTasks.length === 0) return;

  await prisma.dailyTask.createMany({
    data: sourceTasks.map((t) => ({
      userId,
      title: t.title,
      forDay,
      sortOrder: t.sortOrder,
      completed: false,
      completedAt: null,
    })),
  });
}

export function isTaskForToday(task: { forDay: Date }) {
  return isSameUtcDay(task.forDay, todayStartUTC());
}
