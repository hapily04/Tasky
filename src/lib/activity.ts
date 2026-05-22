import type { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logActivity(userId: string, type: ActivityType) {
  await prisma.activityEvent.create({
    data: { userId, type },
  });
}
