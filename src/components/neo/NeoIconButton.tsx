"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "danger";

const variants: Record<Variant, string> = {
  default: "bg-surface text-ink hover:bg-chrome",
  danger: "bg-surface text-ink hover:bg-accent-hot hover:text-white",
};

const baseClass =
  "neo-border neo-shadow neo-shadow-hover inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

type NeoIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: Variant;
  children: ReactNode;
};

export function NeoIconButton({
  label,
  variant = "default",
  className = "",
  children,
  type = "button",
  ...props
}: NeoIconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`${baseClass} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type NeoIconLinkProps = {
  href: string;
  label: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function NeoIconLink({
  href,
  label,
  variant = "default",
  className = "",
  children,
}: NeoIconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`${baseClass} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
