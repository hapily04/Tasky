"use client";

import { useState, useTransition } from "react";
import { NeoCard } from "@/components/neo/NeoCard";
import { NeoCheckbox } from "@/components/neo/NeoCheckbox";
import { updateSoundPreference } from "@/lib/actions/goals";

type SoundToggleProps = {
  initialEnabled: boolean;
};

export function SoundToggle({ initialEnabled }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  return (
    <NeoCard>
      <NeoCheckbox
        checked={enabled}
        disabled={pending}
        label="Completion sounds"
        onChange={(checked) => {
          setEnabled(checked);
          startTransition(() => updateSoundPreference(checked));
        }}
      />
    </NeoCard>
  );
}
