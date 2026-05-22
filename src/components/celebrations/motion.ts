"use client";

import { useEffect, useState } from "react";
import type { Transition } from "framer-motion";

export const CARD_CELEBRATION_MS = 380;
export const CARD_CONFETTI_BURST_MS = 450;
export const GOAL_CONFETTI_MS = 1600;
export const GOAL_BUILDUP_MS = 1500;
/** Per-particle flight time after its stagger delay. */
export const GOAL_ERUPT_PARTICLE_MS = 750;
/** Window over which particles are released from the card center. */
export const GOAL_ERUPT_STAGGER_MS = 500;
export const GOAL_ERUPT_TOTAL_MS = GOAL_ERUPT_STAGGER_MS + GOAL_ERUPT_PARTICLE_MS;

/** Escalating horizontal shake during goal completion buildup. */
export const GOAL_BUILDUP_SHAKE_X = [
  0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, -8, 8,
];

export const GOAL_ERUPT_SHAKE_X = [0, -10, 10, -8, 8, -12, 12, -6, 6, 0];

export const CARD_SHAKE_TRANSITION: Transition = {
  duration: 0.35,
  ease: "easeOut",
};

export const SCREEN_SHAKE_TRANSITION: Transition = {
  duration: 0.5,
  ease: "easeOut",
};

export const CARD_SHAKE_X = [0, -2, 2, -1, 1, 0];
export const SCREEN_SHAKE_X = [0, -6, 6, -5, 5, -3, 3, 0];

export function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}
