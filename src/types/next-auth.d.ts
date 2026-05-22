import type { Role } from "@prisma/client";
import type { DefaultJWT } from "next-auth/jwt";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
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
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: Role;
    discordId?: string;
    username?: string;
    avatarLetter?: string;
    preferences?: Record<string, unknown>;
  }
}
