"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface LineChartProps {
  className?: string;
  color?: string;
  secondaryColor?: string;
}

export function LineChart({
  className,
  color = "var(--accent)",
  secondaryColor = "var(--btn-primary)",
}: LineChartProps) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [inView, setInView] = useState(false);

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

  const line1 = "M 0 60 Q 30 45, 60 50 T 120 35 T 180 20 T 240 28 T 300 10";
  const line2 = "M 0 70 Q 30 65, 60 68 T 120 55 T 180 45 T 240 50 T 300 30";

  return (
    <svg
      ref={ref}
      viewBox="0 0 300 80"
      fill="none"
      className={cn("w-full", className)}
      aria-hidden="true"
    >
      {/* Grid lines */}
      {[20, 40, 60].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="300"
          y2={y}
          stroke="var(--border-color)"
          strokeWidth="1"
        />
      ))}

      {/* Primary line */}
      <motion.path
        d={line1}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Secondary line */}
      <motion.path
        d={line2}
        stroke={secondaryColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 4"
        fill="none"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
      />
    </svg>
  );
}
