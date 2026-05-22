import type { Role } from "@prisma/client";
import { getAdminDiscordIds } from "@/lib/admin-ids";
import { prisma } from "@/lib/prisma";

export type DiscordProfile = {
  id?: string;
  username?: string | null;
  global_name?: string | null;
};

export async function syncDiscordUser(
  userId: string,
  profile: DiscordProfile,
  fallbackName?: string | null,
) {
  const discordId = profile.id;
  if (!discordId) return null;

  const adminIds = getAdminDiscordIds();
  const username =
    profile.global_name ?? profile.username ?? fallbackName ?? "User";
  const data = {
    discordId,
    username,
    name: username,
    ...(adminIds.has(discordId) ? { role: "ADMIN" as Role } : {}),
  };

  const byId = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (byId) {
    return prisma.user.update({ where: { id: userId }, data });
  }

  const byDiscord = await prisma.user.findUnique({
    where: { discordId },
    select: { id: true },
  });
  if (byDiscord) {
    return prisma.user.update({ where: { discordId }, data });
  }

  // OAuth Account row exists but User was deleted (e.g. DB reset on deploy).
  // Remove the orphan so the next sign-in can recreate the user via the adapter.
  await prisma.account.deleteMany({
    where: { provider: "discord", providerAccountId: discordId },
  });

  return null;
}
