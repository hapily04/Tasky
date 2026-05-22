"use client";

import { useState, type ReactNode } from "react";
import { NeoCard } from "@/components/neo/NeoCard";
import { NeoButton } from "@/components/neo/NeoButton";
import { CreateGoalForm } from "@/components/goals/CreateGoalForm";
import { HomeSection } from "@/components/home/HomeSections";

type HomeGoalsSectionProps = {
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function HomeGoalsSection({ isEmpty, emptyMessage, children }: HomeGoalsSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <HomeSection
      title="Goals"
      isEmpty={isEmpty && !open}
      emptyMessage={emptyMessage}
      action={
        !open ? (
          <NeoButton type="button" onClick={() => setOpen(true)}>
            New goal
          </NeoButton>
        ) : undefined
      }
    >
      {open && (
        <NeoCard className="mb-4 animate-row-enter">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-[family-name:var(--font-display)] text-xl">New goal</h3>
            <NeoButton type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </NeoButton>
          </div>
          <CreateGoalForm onCreated={() => setOpen(false)} />
        </NeoCard>
      )}
      {children}
    </HomeSection>
  );
}
