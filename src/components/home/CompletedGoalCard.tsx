import { NeoCard } from "@/components/neo/NeoCard";
import { activeSubtasks } from "@/lib/goals";
import type { GoalWithSubtasks } from "@/lib/goals";

type CompletedGoalCardProps = {
  goal: GoalWithSubtasks;
};

export function CompletedGoalCard({ goal }: CompletedGoalCardProps) {
  const active = activeSubtasks(goal.subtasks);
  const hasSubtasks = active.length > 0;
  const completedLabel = goal.completedAt
    ? new Date(goal.completedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <NeoCard className="bg-success/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-snug">{goal.title}</p>
          {completedLabel && (
            <p className="mt-1 text-sm font-medium text-ink/60">Completed {completedLabel}</p>
          )}
        </div>
        <span className="neo-border shrink-0 bg-accent px-2 py-0.5 text-xs font-bold">Done!</span>
      </div>
      {hasSubtasks && (
        <ul className="mt-3 flex flex-col gap-1 border-t-3 border-ink pt-3">
          {active.map((s) => (
            <li
              key={s.id}
              className={`text-sm font-medium ${s.completed ? "text-ink/80" : "text-ink/50 line-through"}`}
            >
              {s.completed ? "✓ " : ""}
              {s.title}
            </li>
          ))}
        </ul>
      )}
    </NeoCard>
  );
}
