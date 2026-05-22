export function StatsSkeleton() {
  return (
    <div className="mt-8 flex animate-pulse flex-col gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i}>
          <div className="mb-4 h-5 w-24 rounded bg-ink/10" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="neo-border neo-shadow h-24 bg-surface" />
            <div className="neo-border neo-shadow h-24 bg-surface" />
          </div>
        </section>
      ))}
      <div className="neo-border neo-shadow h-48 bg-surface" />
    </div>
  );
}
