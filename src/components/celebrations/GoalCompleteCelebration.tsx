"use client";

import { motion, AnimatePresence } from "framer-motion";
import { NeoButton } from "@/components/neo/NeoButton";

type GoalCompleteCelebrationProps = {
  show: boolean;
  title: string;
  onDismiss?: () => void;
};

export function GoalCompleteCelebration({ show, title, onDismiss }: GoalCompleteCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="neo-border neo-shadow-lg fixed inset-x-4 top-24 z-40 mx-auto max-w-lg bg-accent p-6 text-center md:inset-x-auto"
        >
          <p className="mb-1 text-sm font-bold uppercase tracking-wide">Goal complete</p>
          <p className="mb-4 font-[family-name:var(--font-display)] text-2xl">{title}</p>
          <p className="mb-4 text-sm font-medium">Nice work — you finished every subtask.</p>
          {onDismiss && (
            <NeoButton type="button" variant="secondary" onClick={onDismiss}>
              Continue
            </NeoButton>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
