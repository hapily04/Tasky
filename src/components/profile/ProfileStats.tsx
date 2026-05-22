import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import { getUserStats } from "@/lib/stats/user";
import { NeoCard } from "@/components/neo/NeoCard";

export async function ProfileStats() {
  const user = await requireUser();
  const stats = await getUserStats(user.id);

  const maxChartValue = Math.max(
    1,
    ...stats.last7Days.map((d) => Math.max(d.subtasks, d.dailyTasks)),
  );

  return (
    <div className="mt-8 flex flex-col gap-8">
      <StatsSection title="Today">
        <StatCard
          label="Daily tasks done"
          value={`${stats.dailyTasksCompletedToday} / ${stats.dailyTasksToday}`}
          hint="Completed today vs on your list"
        />
      </StatsSection>

      <StatsSection title="Daily tasks">
        <StatCard label="Tasks created" value={stats.dailyTasksCreated} />
        <StatCard label="Tasks completed" value={stats.dailyTasksCompleted} />
        <StatCard
          label="Task completion %"
          value={
            stats.dailyTaskCompletionRate != null
              ? `${stats.dailyTaskCompletionRate}%`
              : "—"
          }
          hint="All daily tasks you've added"
        />
        <StatCard label="Tasks completed (7d)" value={stats.dailyTasks7d} />
        <StatCard label="Tasks completed (30d)" value={stats.dailyTasks30d} />
      </StatsSection>

      <StatsSection title="Goals">
        <StatCard label="Goals created" value={stats.goalsCreated} />
        <StatCard label="Goals completed" value={stats.goalsCompleted} />
        <StatCard label="Goals active" value={stats.goalsActive} />
        <StatCard label="Goals archived" value={stats.goalsArchived} />
        <StatCard
          label="Goal success %"
          value={stats.goalSuccessPct != null ? `${stats.goalSuccessPct}%` : "—"}
          hint="Dated goals finished on time"
        />
        {stats.openEndedRate != null && (
          <StatCard
            label="Open-ended completion"
            value={`${stats.openEndedRate}%`}
            hint="Goals with no deadline"
          />
        )}
      </StatsSection>

      <StatsSection title="Active goals (now)">
        <StatCard label="Overdue" value={stats.activeGoalsOverdue} />
        <StatCard label="Due today" value={stats.activeGoalsDueToday} />
        <StatCard label="No deadline" value={stats.activeGoalsOpenEnded} />
        <StatCard label="Long term" value={stats.activeGoalsLongTerm} />
      </StatsSection>

      <StatsSection title="Subtasks">
        <StatCard label="Subtasks completed (7d)" value={stats.subtasks7d} />
        <StatCard label="Subtasks completed (30d)" value={stats.subtasks30d} />
        <StatCard label="Subtasks completed (all time)" value={stats.subtasksAll} />
        <StatCard label="Subtasks archived" value={stats.subtasksArchived} />
      </StatsSection>

      <StatsSection title="Activity">
        <StatCard
          label="Current streak"
          value={`${stats.streak} days`}
          hint="Days with a subtask or daily task completed"
        />
        <StatCard
          label="Best week"
          value={stats.bestWeek}
          hint="Most subtasks + daily tasks in any 7-day window"
        />
      </StatsSection>

      <NeoCard>
        <h3 className="mb-1 font-bold">Last 7 days</h3>
        <p className="mb-3 text-xs font-medium text-ink/60">
          Subtasks and daily tasks completed per day
        </p>
        <div className="mb-3 flex gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <span className="neo-border inline-block h-3 w-3 bg-success" />
            Subtasks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="neo-border inline-block h-3 w-3 bg-accent" />
            Daily tasks
          </span>
        </div>
        <div className="flex items-end gap-2">
          {stats.last7Days.map((d) => {
            const barHeight = (count: number) =>
              count > 0 ? Math.max(4, (count / maxChartValue) * 96) : 0;
            const subH = barHeight(d.subtasks);
            const dailyH = barHeight(d.dailyTasks);
            return (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="flex w-full items-end justify-center gap-1"
                  style={{ height: "96px" }}
                >
                  <div className="flex h-full flex-1 flex-col items-center justify-end gap-0.5">
                    <div
                      className="neo-border w-full bg-success"
                      style={{ height: `${subH}px` }}
                      title={`${d.subtasks} subtasks`}
                    />
                    <span className="text-[10px] font-bold leading-none">{d.subtasks}</span>
                  </div>
                  <div className="flex h-full flex-1 flex-col items-center justify-end gap-0.5">
                    <div
                      className="neo-border w-full bg-accent"
                      style={{ height: `${dailyH}px` }}
                      title={`${d.dailyTasks} daily tasks`}
                    />
                    <span className="text-[10px] font-bold leading-none">{d.dailyTasks}</span>
                  </div>
                </div>
                <span className="text-xs font-bold">{d.label}</span>
              </div>
            );
          })}
        </div>
      </NeoCard>
    </div>
  );
}

function StatsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <NeoCard>
      <p className="text-sm font-bold uppercase tracking-wide text-ink/70">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium">{hint}</p>}
    </NeoCard>
  );
}
