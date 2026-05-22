import type { Metadata } from "next";
import { getAdminStats } from "@/lib/stats/admin";
import { NeoCard } from "@/components/neo/NeoCard";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl">Admin</h1>
      <p className="mb-6 text-sm font-medium">Aggregate metrics only — no per-user goal content.</p>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Userbase</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Signups (7d)" value={stats.signups7d} />
        <StatCard label="Signups (30d)" value={stats.signups30d} />
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Activity</h2>
      <div className="mb-2 grid gap-3 sm:grid-cols-3">
        <StatCard label="DAU" value={stats.dau} />
        <StatCard label="WAU" value={stats.wau} />
        <StatCard label="MAU" value={stats.mau} />
      </div>
      <p className="mb-8 text-xs font-medium text-page-ink/70">{stats.activityNote}</p>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Goals</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Goal success %"
          value={stats.goalSuccessPct != null ? `${stats.goalSuccessPct}%` : "—"}
        />
        <StatCard label="Goals created" value={stats.goalsCreated} />
        <StatCard label="Goals completed" value={stats.goalsCompleted} />
        <StatCard label="Completion ratio" value={`${stats.completionRatio}%`} />
        <StatCard label="Avg subtasks / goal" value={stats.avgSubtasksPerGoal} />
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Funnel (% of users)</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Has ≥1 goal" value={`${stats.funnel.hasGoal}%`} />
        <StatCard label="Completed a subtask" value={`${stats.funnel.hasSubtaskDone}%`} />
        <StatCard label="Completed a goal" value={`${stats.funnel.hasGoalDone}%`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <NeoCard>
      <p className="text-sm font-bold uppercase tracking-wide text-ink/70">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-3xl">{value}</p>
    </NeoCard>
  );
}
