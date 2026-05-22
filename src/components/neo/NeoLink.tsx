import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-ink hover:bg-accent/90",
  secondary: "bg-surface hover:bg-chrome",
  ghost: "bg-transparent shadow-none border-transparent hover:border-ink",
};

type NeoLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  variant?: Variant;
};

export function NeoLink({
  children,
  variant = "primary",
  className = "",
  ...props
}: NeoLinkProps) {
  return (
    <Link
      className={`neo-border neo-shadow neo-shadow-hover inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 font-bold transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
