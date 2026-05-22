import { StatsSkeleton } from "@/components/profile/StatsSkeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 w-32 rounded bg-ink/10" />

      <div className="neo-border neo-shadow mb-6 flex items-center gap-4 bg-surface p-4">
        <div className="neo-border h-14 w-14 shrink-0 bg-chrome" />
        <div className="flex flex-col gap-2">
          <div className="h-6 w-36 rounded bg-ink/10" />
          <div className="h-4 w-44 rounded bg-ink/10" />
        </div>
      </div>

      <div className="neo-border neo-shadow mb-6 h-14 bg-surface" />

      <StatsSkeleton />
    </div>
  );
}
