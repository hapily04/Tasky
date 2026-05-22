"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GOAL_BUILDUP_MS,
  GOAL_BUILDUP_SHAKE_X,
  GOAL_ERUPT_PARTICLE_MS,
  GOAL_ERUPT_SHAKE_X,
  GOAL_ERUPT_STAGGER_MS,
  GOAL_ERUPT_TOTAL_MS,
  usePrefersReducedMotion,
} from "@/components/celebrations/motion";
import { getCelebrationColors } from "@/lib/theme-colors";

const PARTICLE_COUNT = 32;

type Phase = "idle" | "buildup" | "erupt";

type Particle = {
  id: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  rotate: number;
  delay: number;
};

type GoalCardCelebrationProps = {
  active: boolean;
  /** Confetti erupts from this element (e.g. Mark complete button). */
  originRef?: RefObject<HTMLElement | null>;
  onErupt?: () => void;
  onDone?: () => void;
  children: React.ReactNode;
};

function measureOrigin(
  container: HTMLElement,
  originEl: HTMLElement | null,
): { x: number; y: number } {
  const containerRect = container.getBoundingClientRect();
  if (originEl) {
    const originRect = originEl.getBoundingClientRect();
    return {
      x: originRect.left - containerRect.left + originRect.width / 2,
      y: originRect.top - containerRect.top + originRect.height / 2,
    };
  }
  return {
    x: containerRect.width / 2,
    y: containerRect.height / 2,
  };
}

function spawnEruptParticles(): Particle[] {
  const colors = getCelebrationColors();
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.6;
    const dist = 50 + Math.random() * 130;
    const staggerSlot = i / PARTICLE_COUNT;
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 35,
      color: colors[i % colors.length]!,
      size: 8 + Math.floor(Math.random() * 12),
      rotate: Math.random() * 360,
      delay: staggerSlot * (GOAL_ERUPT_STAGGER_MS / 1000) + Math.random() * 0.06,
    };
  });
}

export function GoalCardCelebration({
  active,
  originRef,
  onErupt,
  onDone,
  children,
}: GoalCardCelebrationProps) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const onEruptRef = useRef(onErupt);
  const onDoneRef = useRef(onDone);
  const eruptCalledRef = useRef(false);
  onEruptRef.current = onErupt;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      setParticles([]);
      eruptCalledRef.current = false;
      return;
    }

    if (reducedMotion) {
      onEruptRef.current?.();
      onDoneRef.current?.();
      return;
    }

    setPhase("buildup");

    const eruptTimer = setTimeout(() => {
      const container = containerRef.current;
      if (container) {
        setOrigin(measureOrigin(container, originRef?.current ?? null));
      }
      setPhase("erupt");
      setParticles(spawnEruptParticles());
      if (!eruptCalledRef.current) {
        eruptCalledRef.current = true;
        onEruptRef.current?.();
      }
    }, GOAL_BUILDUP_MS);

    const doneTimer = setTimeout(() => {
      setPhase("idle");
      setParticles([]);
      onDoneRef.current?.();
    }, GOAL_BUILDUP_MS + GOAL_ERUPT_TOTAL_MS);

    return () => {
      clearTimeout(eruptTimer);
      clearTimeout(doneTimer);
    };
  }, [active, reducedMotion, originRef]);

  const isBuildup = phase === "buildup";
  const isErupt = phase === "erupt";
  const particleDuration = GOAL_ERUPT_PARTICLE_MS / 1000;

  return (
    <motion.div
      ref={containerRef}
      className="relative overflow-visible"
      animate={
        isBuildup
          ? { x: GOAL_BUILDUP_SHAKE_X }
          : isErupt
            ? { x: GOAL_ERUPT_SHAKE_X, scale: [1, 1.02, 1] }
            : { x: 0, scale: 1 }
      }
      transition={
        isBuildup
          ? { duration: GOAL_BUILDUP_MS / 1000, ease: "linear" }
          : isErupt
            ? { duration: GOAL_ERUPT_TOTAL_MS / 1000, ease: "easeOut" }
            : { duration: 0.2 }
      }
    >
      <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: origin.x,
                top: origin.y,
                x: "-50%",
                y: "-50%",
                opacity: 0,
                scale: 0.3,
                rotate: 0,
              }}
              animate={{
                x: `calc(-50% + ${p.dx}px)`,
                y: `calc(-50% + ${p.dy}px)`,
                opacity: [0, 1, 1, 0],
                rotate: p.rotate,
                scale: [0.3, 1.1, 1, 0.4],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: particleDuration,
                delay: p.delay,
                ease: "easeOut",
                times: [0, 0.12, 0.7, 1],
              }}
              className="absolute neo-border"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
            />
          ))}
        </AnimatePresence>
      </div>
      {children}
    </motion.div>
  );
}
