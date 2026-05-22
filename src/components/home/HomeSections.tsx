import type { ReactNode } from "react";
import { NeoCard } from "@/components/neo/NeoCard";

type HomeSectionProps = {
  title: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  action?: ReactNode;
};

export function HomeSection({ title, children, emptyMessage, isEmpty, action }: HomeSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {isEmpty && emptyMessage && (
        <NeoCard className="mb-4">
          <p className="font-medium">{emptyMessage}</p>
        </NeoCard>
      )}
      {children}
    </section>
  );
}

export function HomeSubgroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 mt-1 text-xs font-bold uppercase tracking-wide text-page-ink/60">{children}</p>
  );
}
