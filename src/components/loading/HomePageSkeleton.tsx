export function HomePageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 h-9 w-32 rounded bg-ink/10" />
          <div className="h-5 w-48 rounded bg-ink/10" />
        </div>
        <div className="neo-border h-10 w-28 bg-surface" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <div className="neo-border h-8 w-28 bg-surface" />
        <div className="neo-border h-8 w-44 bg-surface" />
      </div>

      <div className="mb-8">
        <div className="mb-3 h-6 w-36 rounded bg-ink/10" />
        <div className="neo-border neo-shadow h-40 bg-surface" />
      </div>

      <div className="mb-8">
        <div className="mb-3 h-6 w-20 rounded bg-ink/10" />
        <div className="flex flex-col gap-3">
          <div className="neo-border neo-shadow h-28 bg-surface" />
          <div className="neo-border neo-shadow h-28 bg-surface" />
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 h-6 w-40 rounded bg-ink/10" />
        <div className="neo-border neo-shadow h-28 bg-surface" />
      </div>
    </div>
  );
}
