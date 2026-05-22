"use client";

import { motion, AnimatePresence } from "framer-motion";

type GoalCompleteBannerProps = {
  show: boolean;
  title: string;
};

export function GoalCompleteBanner({ show, title }: GoalCompleteBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="neo-border neo-shadow mb-4 bg-accent px-4 py-3 text-center font-[family-name:var(--font-display)] text-lg"
        >
          Goal complete: {title}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
