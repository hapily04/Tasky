import Link from "next/link";
import { signOut } from "@/auth";
import { AppNav } from "@/components/layout/AppNav";
import { ThemeToggleButton } from "@/components/layout/ThemeToggleButton";
import { AvatarInitial } from "@/components/user/AvatarInitial";
import type { Role } from "@prisma/client";

type AppHeaderProps = {
  username: string;
  role: Role;
};

export function AppHeader({ username, role }: AppHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/home"
          className="neo-border neo-shadow cursor-pointer bg-accent px-3 py-1 font-[family-name:var(--font-display)] text-xl tracking-tight text-ink"
        >
          TASKY
        </Link>
        <Link
          href="/profile"
          aria-label="View profile"
          className="neo-border neo-shadow neo-shadow-hover flex items-center gap-2 bg-surface px-2 py-1 text-ink transition-colors hover:bg-accent-subtle active:translate-x-0 active:translate-y-0"
        >
          <AvatarInitial username={username} size="sm" />
          <span className="text-sm font-bold">{username}</span>
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggleButton />
        <AppNav role={role} />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="cursor-pointer text-sm font-bold underline hover:no-underline">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
