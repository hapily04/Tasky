"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CARD_CELEBRATION_MS,
  CARD_CONFETTI_BURST_MS,
  CARD_SHAKE_TRANSITION,
  CARD_SHAKE_X,
  usePrefersReducedMotion,
} from "@/components/celebrations/motion";
import { getCelebrationColors } from "@/lib/theme-colors";

type Particle = {
  id: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  rotate: number;
};

type TaskCardCelebrationProps = {
  active: boolean;
  checkboxRef: RefObject<HTMLButtonElement | null>;
  onDone?: () => void;
  children: React.ReactNode;
};

function spawnParticles(): Particle[] {
  const colors = getCelebrationColors();
  return Array.from({ length: 14 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const dist = 40 + Math.random() * 50;
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 30,
      color: colors[i % colors.length]!,
      size: 6 + Math.floor(Math.random() * 8),
      rotate: Math.random() * 360,
    };
  });
}

export function TaskCardCelebration({
  active,
  checkboxRef,
  onDone,
  children,
}: TaskCardCelebrationProps) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setShake(false);
      setParticles([]);
      return;
    }

    if (reducedMotion) {
      onDoneRef.current?.();
      return;
    }

    const container = containerRef.current;
    const checkbox = checkboxRef.current;
    if (container && checkbox) {
      const containerRect = container.getBoundingClientRect();
      const checkRect = checkbox.getBoundingClientRect();
      setOrigin({
        x: checkRect.left - containerRect.left + checkRect.width / 2,
        y: checkRect.top - containerRect.top + checkRect.height / 2,
      });
    }

    setShake(true);
    setParticles(spawnParticles());

    const particleTimer = setTimeout(() => setParticles([]), CARD_CONFETTI_BURST_MS);
    const doneTimer = setTimeout(() => {
      setShake(false);
      onDoneRef.current?.();
    }, CARD_CELEBRATION_MS);

    return () => {
      clearTimeout(particleTimer);
      clearTimeout(doneTimer);
    };
  }, [active, reducedMotion, checkboxRef]);

  return (
    <motion.div
      ref={containerRef}
      className="relative isolate"
      animate={shake ? { x: CARD_SHAKE_X } : { x: 0 }}
      transition={CARD_SHAKE_TRANSITION}
      style={{ contain: "layout style" }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                left: origin.x,
                top: origin.y,
                x: "-50%",
                y: "-50%",
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: `calc(-50% + ${p.dx}px)`,
                y: `calc(-50% + ${p.dy}px)`,
                opacity: 0,
                rotate: p.rotate,
                scale: 0.6,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: CARD_CONFETTI_BURST_MS / 1000, ease: "easeOut" }}
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
