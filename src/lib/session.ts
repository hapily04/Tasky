import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getAvatarLetter } from "@/lib/avatar";
import { parsePreferences } from "@/lib/preferences";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
  discordId: string;
  username: string;
  avatarLetter: string;
  preferences: Record<string, unknown>;
};

/** Session backed by a real User row (JWT alone is not enough after a DB reset). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      discordId: true,
      username: true,
      preferences: true,
      name: true,
      email: true,
      image: true,
    },
  });
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    name: dbUser.name ?? session.user.name,
    email: dbUser.email ?? session.user.email,
    image: dbUser.image ?? session.user.image,
    role: dbUser.role,
    discordId: dbUser.discordId ?? "",
    username: dbUser.username,
    avatarLetter: getAvatarLetter(dbUser.username),
    preferences: parsePreferences(dbUser.preferences),
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/?error=session_expired");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/home");
  }
  return user;
}
