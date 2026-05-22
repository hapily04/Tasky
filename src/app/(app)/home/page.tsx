import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatGoalDeadline, partitionActiveGoals } from "@/lib/goals";
import { soundEnabledFromPreferences } from "@/lib/preferences";
import { todayStartUTC, endOfDayUTC } from "@/lib/dates";
import { ensureTodayDailyTasks } from "@/lib/daily-tasks";
import { getUserStreak } from "@/lib/stats/user";
import { HomeDailyTasksBlock } from "@/components/home/HomeDailyTasksBlock";
import { GoalCard } from "@/components/goals/GoalCard";
import { CompletedGoalCard } from "@/components/home/CompletedGoalCard";
import { HomeGoalsSection } from "@/components/home/HomeGoalsSection";
import { HomeSection, HomeSubgroupLabel } from "@/components/home/HomeSections";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  const soundEnabled = soundEnabledFromPreferences(user.preferences ?? {});
  const todayStart = todayStartUTC();
  const todayEnd = endOfDayUTC(new Date());

  await ensureTodayDailyTasks(user.id);

  const subtaskInclude = {
    subtasks: {
      where: { archived: false },
      orderBy: { sortOrder: "asc" as const },
    },
  };

  const [
    dailyTasks,
    activeGoals,
    completedGoals,
    archivedGoals,
    streak,
    subtasksDoneToday,
  ] = await Promise.all([
    prisma.dailyTask.findMany({
      where: { userId: user.id, forDay: todayStart },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.goal.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: subtaskInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.goal.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      include: subtaskInclude,
      orderBy: { completedAt: "desc" },
    }),
    prisma.goal.count({ where: { userId: user.id, status: "ARCHIVED" } }),
    getUserStreak(user.id),
    prisma.subtask.count({
      where: {
        completed: true,
        archived: false,
        goal: { userId: user.id },
        completedAt: { gte: todayStart, lt: todayEnd },
      },
    }),
  ]);

  const { goalsSection, longTerm } = partitionActiveGoals(activeGoals);

  const goalsSectionCount =
    goalsSection.overdue.length +
    goalsSection.dueToday.length +
    goalsSection.openEnded.length;

  const dateGreeting = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="mb-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Home</h1>
        <p className="font-medium text-page-ink/70">{dateGreeting}</p>
      </div>

      <HomeDailyTasksBlock
        streak={streak}
        tasks={dailyTasks}
        subtasksDoneToday={subtasksDoneToday}
      />

      <HomeGoalsSection
        isEmpty={goalsSectionCount === 0}
        emptyMessage="No active goals — create one to get started."
      >
        <div className="flex flex-col gap-3">
          {goalsSection.overdue.length > 0 && (
            <>
              <HomeSubgroupLabel>Overdue</HomeSubgroupLabel>
              {goalsSection.overdue.map((goal) => (
                <GoalCard key={goal.id} goal={goal} soundEnabled={soundEnabled} badge="overdue" />
              ))}
            </>
          )}
          {goalsSection.dueToday.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              soundEnabled={soundEnabled}
              badge="due-today"
            />
          ))}
          {goalsSection.openEnded.map((goal) => (
            <GoalCard key={goal.id} goal={goal} soundEnabled={soundEnabled} />
          ))}
        </div>
      </HomeGoalsSection>

      <HomeSection
        title="Long term goals"
        isEmpty={longTerm.length === 0}
        emptyMessage="No long term goals yet — set a deadline when you create a goal."
      >
        <div className="flex flex-col gap-3">
          {longTerm.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              soundEnabled={soundEnabled}
              deadlineLabel={
                goal.deadline ? formatGoalDeadline(goal.deadline) : undefined
              }
            />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        title="Completed goals"
        isEmpty={completedGoals.length === 0}
        emptyMessage="No completed goals yet."
      >
        <div className="flex flex-col gap-3">
          {completedGoals.map((goal) => (
            <CompletedGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </HomeSection>

      {archivedGoals > 0 && (
        <p className="text-sm font-bold">{archivedGoals} archived goal(s)</p>
      )}
    </div>
  );
}
