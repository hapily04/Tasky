"use client";

import { useState } from "react";
import { TasksForTodayCard } from "@/components/home/TasksForTodayCard";
import { HomeSection } from "@/components/home/HomeSections";
import type { DailyTask } from "@prisma/client";

type HomeDailyTasksBlockProps = {
  streak: number;
  tasks: DailyTask[];
  subtasksDoneToday: number;
};

export function HomeDailyTasksBlock({
  streak,
  tasks: initialTasks,
  subtasksDoneToday,
}: HomeDailyTasksBlockProps) {
  const [dailyDone, setDailyDone] = useState(
    () => initialTasks.filter((t) => t.completed).length,
  );
  const [dailyTotal, setDailyTotal] = useState(() => initialTasks.length);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {streak > 0 && (
          <span className="neo-border bg-accent px-3 py-1 text-sm font-bold text-ink">
            {streak}-day streak
          </span>
        )}
        <span className="neo-border bg-surface px-3 py-1 text-sm font-bold text-ink">
          {dailyDone}/{dailyTotal} tasks
          {dailyTotal > 0 ? "" : " today"}
          {" · "}
          {subtasksDoneToday} subtask{subtasksDoneToday === 1 ? "" : "s"} done today
        </span>
      </div>

      <HomeSection title="Tasks for today">
        <TasksForTodayCard
          tasks={initialTasks}
          onTasksChange={(next) => {
            setDailyDone(next.filter((t) => t.completed).length);
            setDailyTotal(next.length);
          }}
        />
      </HomeSection>
    </>
  );
}
