"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { todayStartUTC } from "@/lib/dates";
import { ensureTodayDailyTasks, isTaskForToday } from "@/lib/daily-tasks";
import { TASK_TEXT_MAX_LENGTH } from "@/lib/task-text";

const titleSchema = z.string().min(1).max(TASK_TEXT_MAX_LENGTH);

function revalidateHome() {
  revalidatePath("/home");
}

export async function createDailyTask(title: string) {
  const user = await requireUser();
  const parsed = titleSchema.safeParse(title.trim());
  if (!parsed.success) return { error: "Invalid task title" };

  await ensureTodayDailyTasks(user.id);

  const forDay = todayStartUTC();
  const maxOrder = await prisma.dailyTask.aggregate({
    where: { userId: user.id, forDay },
    _max: { sortOrder: true },
  });

  const task = await prisma.dailyTask.create({
    data: {
      userId: user.id,
      title: parsed.data,
      forDay,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return { ok: true, task };
}

export async function toggleDailyTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.dailyTask.findFirst({
    where: { id: taskId, userId: user.id },
  });
  if (!task) return { error: "Not found" };
  if (!isTaskForToday(task)) return { error: "Only today's tasks can be updated" };

  const completed = !task.completed;
  await prisma.dailyTask.update({
    where: { id: taskId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidateHome();
  return { ok: true, completed };
}

const reorderSchema = z.array(z.string().min(1)).min(1).max(100);

export async function reorderDailyTasks(taskIds: string[]) {
  const user = await requireUser();
  const parsed = reorderSchema.safeParse(taskIds);
  if (!parsed.success) return { error: "Invalid order" };

  const forDay = todayStartUTC();
  const existing = await prisma.dailyTask.findMany({
    where: { userId: user.id, forDay, id: { in: parsed.data } },
    select: { id: true },
  });

  if (existing.length !== parsed.data.length) return { error: "Not found" };

  await prisma.$transaction(
    parsed.data.map((id, index) =>
      prisma.dailyTask.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  return { ok: true };
}

export async function updateDailyTaskTitle(taskId: string, title: string) {
  const user = await requireUser();
  const parsed = titleSchema.safeParse(title.trim());
  if (!parsed.success) return { error: "Invalid task title" };

  const task = await prisma.dailyTask.findFirst({
    where: { id: taskId, userId: user.id },
    select: { forDay: true },
  });
  if (!task) return { error: "Not found" };
  if (!isTaskForToday(task)) return { error: "Only today's tasks can be updated" };

  const updated = await prisma.dailyTask.update({
    where: { id: taskId },
    data: { title: parsed.data },
  });

  return { ok: true, task: updated };
}

export async function deleteDailyTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.dailyTask.findFirst({
    where: { id: taskId, userId: user.id },
    select: { forDay: true },
  });
  if (!task) return { error: "Not found" };
  if (!isTaskForToday(task)) return { error: "Only today's tasks can be removed" };

  await prisma.dailyTask.delete({ where: { id: taskId } });

  revalidateHome();
  return { ok: true };
}
