/** Fallback for (app) routes without their own loading.tsx */
export default function AppLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-9 w-40 rounded bg-ink/10" />
      <div className="neo-border neo-shadow h-32 bg-surface" />
    </div>
  );
}
