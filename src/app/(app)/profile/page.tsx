import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { NeoCard } from "@/components/neo/NeoCard";
import { SoundToggle } from "@/components/profile/SoundToggle";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { StatsSkeleton } from "@/components/profile/StatsSkeleton";
import { AvatarInitial } from "@/components/user/AvatarInitial";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const soundEnabled = user.preferences?.soundEnabled !== false;

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl">Profile</h1>

      <NeoCard className="mb-6 flex items-center gap-4">
        <AvatarInitial username={user.username} size="lg" />
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl">{user.username}</p>
          <p className="text-sm font-medium text-ink/70">Connected via Discord</p>
        </div>
      </NeoCard>

      <SoundToggle initialEnabled={soundEnabled} />

      <Suspense fallback={<StatsSkeleton />}>
        <ProfileStats />
      </Suspense>
    </div>
  );
}
