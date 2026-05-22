function SkeletonSection({
  titleWidth,
  columns,
  count,
}: {
  titleWidth: string;
  columns: 2 | 3;
  count: number;
}) {
  const gridClass = columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <section className="mb-8">
      <div className={`mb-3 h-5 rounded bg-ink/10 ${titleWidth}`} />
      <div className={`grid gap-3 ${gridClass}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="neo-border neo-shadow h-24 bg-surface"
          />
        ))}
      </div>
    </section>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-9 w-28 rounded bg-ink/10" />
      <div className="mb-6 h-4 w-72 max-w-full rounded bg-ink/10" />

      <SkeletonSection titleWidth="w-24" columns={3} count={3} />
      <SkeletonSection titleWidth="w-20" columns={3} count={3} />
      <div className="mb-8 h-4 w-56 rounded bg-ink/10" />
      <SkeletonSection titleWidth="w-16" columns={2} count={5} />
      <SkeletonSection titleWidth="w-40" columns={3} count={3} />
    </div>
  );
}
