"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

const links = [
  { href: "/home", label: "Home" },
  { href: "/profile", label: "Profile" },
];

type AppNavProps = {
  role: Role;
};

function NavLinkLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={
        pending
          ? "opacity-60 underline decoration-2 underline-offset-4"
          : undefined
      }
    >
      {label}
    </span>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
        active ? "bg-ink text-surface" : "hover:bg-chrome"
      }`}
    >
      <NavLinkLabel label={label} />
    </Link>
  );
}

export function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();
  const navLinks = role === "ADMIN" ? [...links, { href: "/admin", label: "Admin" }] : links;

  return (
    <nav className="neo-border neo-shadow flex gap-1 bg-surface p-1 text-ink">
      {navLinks.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <NavLink key={link.href} href={link.href} label={link.label} active={active} />
        );
      })}
    </nav>
  );
}
