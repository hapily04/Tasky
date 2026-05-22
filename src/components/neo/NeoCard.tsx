import { type ReactNode } from "react";

type NeoCardProps = {
  children: ReactNode;
  className?: string;
  accent?: boolean;
};

export function NeoCard({ children, className = "", accent }: NeoCardProps) {
  return (
    <div
      className={`neo-border neo-shadow rounded-none bg-surface p-4 text-ink ${accent ? "!bg-accent" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
