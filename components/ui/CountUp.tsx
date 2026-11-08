"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: string;
  className?: string;
}

export function CountUp({ value, className }: CountUpProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(value);

  const numericMatch = value.match(/^([\d,.]+)(.*)$/);
  const targetNum = numericMatch ? parseFloat(numericMatch[1].replace(/,/g, "")) : null;
  const suffix = numericMatch ? numericMatch[2] : "";

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reduce || targetNum === null) {
      setDisplay(value);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * targetNum!);

      if (targetNum! >= 1000) {
        setDisplay(current.toLocaleString("en-IN") + suffix);
      } else {
        setDisplay(current + suffix);
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    }

    requestAnimationFrame(tick);
  }, [inView, reduce, targetNum, suffix, value]);

  return (
    <motion.span
      ref={ref}
      className={cn("font-mono tabular-nums", className)}
    >
      {display}
    </motion.span>
  );
}
