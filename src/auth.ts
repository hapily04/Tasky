import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { logActivity } from "@/lib/activity";
import { getAvatarLetter } from "@/lib/avatar";
import { parsePreferences } from "@/lib/preferences";
import { prisma } from "@/lib/prisma";
import { syncDiscordUser, type DiscordProfile } from "@/lib/sync-discord-user";

async function loadUserIntoToken(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      discordId: true,
      username: true,
      preferences: true,
    },
  });
  if (!dbUser) return null;
  return {
    role: dbUser.role,
    discordId: dbUser.discordId ?? "",
    username: dbUser.username,
    avatarLetter: getAvatarLetter(dbUser.username),
    preferences: parsePreferences(dbUser.preferences),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, profile, trigger }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      if (user?.id && profile) {
        const synced = await syncDiscordUser(
          user.id,
          profile as DiscordProfile,
          user.name,
        );
        if (synced) {
          await logActivity(synced.id, "SESSION_START");
        }
      }

      const loaded = await loadUserIntoToken(userId);
      if (loaded) {
        token.role = loaded.role;
        token.discordId = loaded.discordId;
        token.username = loaded.username;
        token.avatarLetter = loaded.avatarLetter;
        token.preferences = loaded.preferences;
      }

      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { preferences: true, username: true },
        });
        if (dbUser) {
          token.preferences = parsePreferences(dbUser.preferences);
          token.username = dbUser.username;
          token.avatarLetter = getAvatarLetter(dbUser.username);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) ?? "USER";
        session.user.discordId = (token.discordId as string) ?? "";
        session.user.username = (token.username as string) ?? session.user.name ?? "User";
        session.user.avatarLetter = (token.avatarLetter as string) ?? getAvatarLetter(session.user.username);
        session.user.preferences = (token.preferences ?? {}) as Record<string, unknown>;
      }
      return session;
    },
  },
});
