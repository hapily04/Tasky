import { prisma } from "@/lib/prisma";
import { isGoalSuccessful } from "@/lib/goals";

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return startOfDayUTC(d);
}

const ACTIVE_EVENT_TYPES = ["SESSION_START", "SUBTASK_COMPLETED", "GOAL_COMPLETED"] as const;

async function distinctActiveUsers(since: Date) {
  const rows = await prisma.activityEvent.findMany({
    where: {
      type: { in: [...ACTIVE_EVENT_TYPES] },
      occurredAt: { gte: since },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.length;
}

export async function getAdminStats() {
  const now = new Date();
  const dayStart = startOfDayUTC(now);
  const weekStart = daysAgo(7);
  const monthStart = daysAgo(30);

  const [
    totalUsers,
    signups7d,
    signups30d,
    dau,
    wau,
    mau,
    allGoals,
    usersWithGoal,
    usersWithSubtask,
    usersWithCompletedGoal,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.user.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    distinctActiveUsers(dayStart),
    distinctActiveUsers(weekStart),
    distinctActiveUsers(monthStart),
    prisma.goal.findMany({ select: { status: true, deadline: true, completedAt: true } }),
    prisma.user.count({ where: { goals: { some: {} } } }),
    prisma.user.count({
      where: { goals: { some: { subtasks: { some: { completed: true } } } } },
    }),
    prisma.user.count({ where: { goals: { some: { status: "COMPLETED" } } } }),
  ]);

  const subtaskAgg = await prisma.subtask.groupBy({
    by: ["goalId"],
    _count: true,
  });
  const avgSubtasksPerGoal =
    subtaskAgg.length > 0
      ? Math.round(
          (subtaskAgg.reduce((s, g) => s + g._count, 0) / subtaskAgg.length) * 10,
        ) / 10
      : 0;

  const goalsWithDeadline = allGoals.filter((g) => g.deadline != null);
  const successful = allGoals.filter((g) => isGoalSuccessful(g)).length;
  const goalSuccessPct =
    goalsWithDeadline.length > 0
      ? Math.round((successful / goalsWithDeadline.length) * 100)
      : null;

  const goalsCreated = allGoals.length;
  const goalsCompleted = allGoals.filter((g) => g.status === "COMPLETED").length;
  const completionRatio =
    goalsCreated > 0 ? Math.round((goalsCompleted / goalsCreated) * 100) : 0;

  const funnel = {
    hasGoal: totalUsers > 0 ? Math.round((usersWithGoal / totalUsers) * 100) : 0,
    hasSubtaskDone:
      totalUsers > 0 ? Math.round((usersWithSubtask / totalUsers) * 100) : 0,
    hasGoalDone:
      totalUsers > 0 ? Math.round((usersWithCompletedGoal / totalUsers) * 100) : 0,
  };

  return {
    totalUsers,
    signups7d,
    signups30d,
    dau,
    wau,
    mau,
    goalSuccessPct,
    goalsCreated,
    goalsCompleted,
    completionRatio,
    avgSubtasksPerGoal,
    funnel,
    activityNote:
      "DAU/WAU/MAU count distinct users with SESSION_START, SUBTASK_COMPLETED, or GOAL_COMPLETED in the period (UTC).",
  };
}
