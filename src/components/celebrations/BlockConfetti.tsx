"use client";



import { useEffect, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { GOAL_CONFETTI_MS, usePrefersReducedMotion } from "@/components/celebrations/motion";
import { getCelebrationColors } from "@/lib/theme-colors";



type Particle = {

  id: number;

  x: number;

  drift: number;

  color: string;

  size: number;

  delay: number;

};



const PARTICLE_COUNT = 36;



type BlockConfettiProps = {

  active: boolean;

  onDone?: () => void;

};



export function BlockConfetti({ active, onDone }: BlockConfettiProps) {

  const [particles, setParticles] = useState<Particle[]>([]);

  const reducedMotion = usePrefersReducedMotion();



  useEffect(() => {

    if (!active || reducedMotion) {

      if (active && reducedMotion) onDone?.();

      return;

    }



    const colors = getCelebrationColors();

    const next: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({

      id: i,

      x: 2 + (i / PARTICLE_COUNT) * 96 + (Math.random() - 0.5) * 4,

      drift: (Math.random() - 0.5) * 40,

      color: colors[i % colors.length]!,

      size: 8 + Math.floor(Math.random() * 10),

      delay: Math.random() * 0.15,

    }));

    setParticles(next);

    const t = setTimeout(() => {

      setParticles([]);

      onDone?.();

    }, GOAL_CONFETTI_MS);

    return () => clearTimeout(t);

  }, [active, reducedMotion, onDone]);



  if (reducedMotion) return null;



  return (

    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">

      <AnimatePresence>

        {particles.map((p) => (

          <motion.div

            key={p.id}

            initial={{ top: "-5%", left: `${p.x}%`, opacity: 1, rotate: 0, x: 0 }}

            animate={{

              top: "105%",

              rotate: 180 + Math.random() * 180,

              x: p.drift,

            }}

            exit={{ opacity: 0 }}

            transition={{

              duration: 1.4,

              delay: p.delay,

              ease: "easeIn",

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

  );

}

