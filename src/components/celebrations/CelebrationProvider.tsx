"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  SCREEN_SHAKE_TRANSITION,
  SCREEN_SHAKE_X,
  usePrefersReducedMotion,
} from "@/components/celebrations/motion";

type CelebrationContextValue = {
  triggerScreenShake: () => void;
};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const controls = useAnimation();
  const reducedMotion = usePrefersReducedMotion();
  const shakingRef = useRef(false);

  const triggerScreenShake = useCallback(() => {
    if (reducedMotion || shakingRef.current) return;
    shakingRef.current = true;
    void controls.start({ x: SCREEN_SHAKE_X, transition: SCREEN_SHAKE_TRANSITION }).then(() => {
      shakingRef.current = false;
    });
  }, [controls, reducedMotion]);

  return (
    <CelebrationContext.Provider value={{ triggerScreenShake }}>
      <motion.div animate={controls} className="w-full">
        {children}
      </motion.div>
    </CelebrationContext.Provider>
  );
}

export function useScreenShake() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    throw new Error("useScreenShake must be used within CelebrationProvider");
  }
  return ctx;
}
