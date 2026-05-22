"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { canToggleGoalCompletion, isGoalFullyComplete } from "@/lib/goals";
import { parseDateOnlyInput } from "@/lib/dates";
import { parsePreferences, serializePreferences } from "@/lib/preferences";
import { TASK_TEXT_MAX_LENGTH } from "@/lib/task-text";

const taskTitleSchema = z.string().min(1).max(TASK_TEXT_MAX_LENGTH);

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  deadline: z.string().optional(),
  subtasks: z.array(taskTitleSchema).max(20).default([]),
});

function revalidateHomeAndProfile() {
  revalidatePath("/home");
  revalidatePath("/profile");
}

function parseDeadlineInput(value: string | null | undefined) {
  if (!value) return null;
  return parseDateOnlyInput(value);
}

export async function createGoal(formData: FormData) {
  const user = await requireUser();
  const rawSubtasks = formData
    .getAll("subtasks")
    .map(String)
    .map((t) => t.trim())
    .filter(Boolean);
  const parsed = createGoalSchema.safeParse({
    title: formData.get("title"),
    deadline: formData.get("deadline") || undefined,
    subtasks: rawSubtasks,
  });

  if (!parsed.success) {
    return { error: "Invalid goal data" };
  }

  const { title, deadline, subtasks } = parsed.data;

  await prisma.goal.create({
    data: {
      userId: user.id,
      title,
      deadline: deadline ? parseDeadlineInput(deadline) : null,
      ...(subtasks.length > 0
        ? {
            subtasks: {
              create: subtasks.map((t, i) => ({ title: t, sortOrder: i })),
            },
          }
        : {}),
    },
  });

  revalidatePath("/home");
  return { ok: true };
}

export async function updateGoal(
  goalId: string,
  data: { title?: string; deadline?: string | null },
) {
  const user = await requireUser();
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) return { error: "Not found" };

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(data.title != null ? { title: data.title.trim() } : {}),
      ...(data.deadline !== undefined
        ? { deadline: data.deadline ? parseDeadlineInput(data.deadline) : null }
        : {}),
    },
  });

  revalidateHomeAndProfile();
  return { ok: true };
}

export async function toggleGoalComplete(goalId: string) {
  const user = await requireUser();
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: user.id },
    include: { subtasks: true },
  });
  if (!goal) return { error: "Not found" };
  if (!canToggleGoalCompletion(goal, goal.subtasks)) {
    return { error: "Complete or archive subtasks first" };
  }

  const completing = goal.status === "ACTIVE";
  await prisma.goal.update({
    where: { id: goalId },
    data: completing
      ? { status: "COMPLETED", completedAt: new Date() }
      : { status: "ACTIVE", completedAt: null },
  });

  if (completing) {
    await logActivity(user.id, "GOAL_COMPLETED");
    // Client plays completion animation then router.refresh(); skip early revalidate
    // so the goal card stays mounted in the active list.
    return { ok: true, completed: completing };
  }

  revalidateHomeAndProfile();
  return { ok: true, completed: completing };
}

export async function archiveGoal(goalId: string) {
  const user = await requireUser();
  const result = await prisma.goal.updateMany({
    where: { id: goalId, userId: user.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  if (result.count === 0) return { error: "Not found" };
  revalidateHomeAndProfile();
  return { ok: true };
}

export async function toggleSubtask(subtaskId: string) {
  const user = await requireUser();
  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, archived: false, goal: { userId: user.id } },
    include: { goal: { include: { subtasks: true } } },
  });

  if (!subtask) return { error: "Not found" };

  const nowCompleted = !subtask.completed;
  await prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date() : null,
    },
  });

  if (nowCompleted) {
    await logActivity(user.id, "SUBTASK_COMPLETED");
  }

  const updatedSubtasks = await prisma.subtask.findMany({
    where: { goalId: subtask.goalId },
    orderBy: { sortOrder: "asc" },
  });

  const allDone = isGoalFullyComplete(updatedSubtasks);
  let goalCompleted = false;

  if (allDone && subtask.goal.status === "ACTIVE") {
    await prisma.goal.update({
      where: { id: subtask.goalId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await logActivity(user.id, "GOAL_COMPLETED");
    goalCompleted = true;
  } else if (!allDone && subtask.goal.status === "COMPLETED") {
    await prisma.goal.update({
      where: { id: subtask.goalId },
      data: { status: "ACTIVE", completedAt: null },
    });
  }

  if (goalCompleted) {
    revalidatePath("/profile");
  }

  return { ok: true, goalCompleted, subtaskCompleted: nowCompleted };
}

export async function addSubtask(goalId: string, title: string) {
  const user = await requireUser();
  const parsed = taskTitleSchema.safeParse(title.trim());
  if (!parsed.success) return { error: "Invalid subtask title" };

  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) return { error: "Not found" };

  const maxOrder = await prisma.subtask.aggregate({
    where: { goalId, archived: false },
    _max: { sortOrder: true },
  });

  const subtask = await prisma.subtask.create({
    data: {
      goalId,
      title: parsed.data,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  if (goal.status === "COMPLETED") {
    await prisma.goal.update({
      where: { id: goalId },
      data: { status: "ACTIVE", completedAt: null },
    });
  }

  return { ok: true, subtask };
}

export async function updateSubtaskTitle(subtaskId: string, title: string) {
  const user = await requireUser();
  const parsed = taskTitleSchema.safeParse(title.trim());
  if (!parsed.success) return { error: "Invalid subtask title" };

  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, archived: false, goal: { userId: user.id } },
  });
  if (!subtask) return { error: "Not found" };

  const updated = await prisma.subtask.update({
    where: { id: subtaskId },
    data: { title: parsed.data },
  });

  return { ok: true, subtask: updated };
}

const reorderSubtasksSchema = z.array(z.string().min(1)).min(1).max(50);

export async function reorderSubtasks(goalId: string, subtaskIds: string[]) {
  const user = await requireUser();
  const parsed = reorderSubtasksSchema.safeParse(subtaskIds);
  if (!parsed.success) return { error: "Invalid order" };

  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) return { error: "Not found" };

  const existing = await prisma.subtask.findMany({
    where: { goalId, archived: false, id: { in: parsed.data } },
    select: { id: true },
  });

  if (existing.length !== parsed.data.length) return { error: "Not found" };

  await prisma.$transaction(
    parsed.data.map((id, index) =>
      prisma.subtask.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  return { ok: true };
}

export async function archiveSubtask(subtaskId: string) {
  const user = await requireUser();
  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, archived: false, goal: { userId: user.id } },
    include: { goal: true },
  });
  if (!subtask) return { error: "Not found" };

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      archived: true,
      archivedAt: new Date(),
      completed: false,
      completedAt: null,
    },
  });

  const remaining = await prisma.subtask.findMany({
    where: { goalId: subtask.goalId },
    orderBy: { sortOrder: "asc" },
  });

  if (subtask.goal.status === "COMPLETED" && !isGoalFullyComplete(remaining)) {
    await prisma.goal.update({
      where: { id: subtask.goalId },
      data: { status: "ACTIVE", completedAt: null },
    });
  }

  revalidatePath("/profile");
  return { ok: true };
}

export async function updateSoundPreference(enabled: boolean) {
  const user = await requireUser();
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { preferences: true },
  });
  const prefs = parsePreferences(existing?.preferences);
  await prisma.user.update({
    where: { id: user.id },
    data: { preferences: serializePreferences({ ...prefs, soundEnabled: enabled }) },
  });
  revalidatePath("/profile");
}

export async function updateThemePreference(theme: "light" | "dark") {
  const user = await requireUser();
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { preferences: true },
  });
  const prefs = parsePreferences(existing?.preferences);
  await prisma.user.update({
    where: { id: user.id },
    data: { preferences: serializePreferences({ ...prefs, theme }) },
  });
  revalidatePath("/profile");
  return { ok: true };
}
