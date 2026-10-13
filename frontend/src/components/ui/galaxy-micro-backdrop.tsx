import React from "react";
import { cn } from "../../lib/utils";

/** Same scale as orbital: tiny circles (r ~0.7–1.5), soft pastel fills */
type Star = { cx: string; cy: string; r: number; fill: string; delay: number };

const STARS_A: Star[] = [
  { cx: "15%", cy: "20%", r: 1.5, fill: "#ffffff", delay: 0 },
  { cx: "85%", cy: "15%", r: 1, fill: "#e0e7ff", delay: 0.5 },
  { cx: "10%", cy: "70%", r: 1.2, fill: "#ffffff", delay: 1 },
  { cx: "90%", cy: "75%", r: 0.8, fill: "#c7d2fe", delay: 1.5 },
  { cx: "20%", cy: "90%", r: 1, fill: "#e0e7ff", delay: 2 },
  { cx: "80%", cy: "85%", r: 1.3, fill: "#ffffff", delay: 2.5 },
  { cx: "25%", cy: "35%", r: 0.9, fill: "#f3e8ff", delay: 1.2 },
  { cx: "75%", cy: "55%", r: 1.1, fill: "#ffffff", delay: 0.8 },
  { cx: "40%", cy: "15%", r: 0.8, fill: "#ddd6fe", delay: 1.8 },
  { cx: "92%", cy: "40%", r: 1, fill: "#ffffff", delay: 0.3 },
  { cx: "8%", cy: "45%", r: 0.9, fill: "#ede9fe", delay: 2.2 },
  { cx: "60%", cy: "92%", r: 1.2, fill: "#ffffff", delay: 1.6 },
  { cx: "35%", cy: "70%", r: 0.7, fill: "#dbeafe", delay: 0.6 },
  { cx: "70%", cy: "25%", r: 1.1, fill: "#ffffff", delay: 2.3 },
  { cx: "45%", cy: "88%", r: 0.8, fill: "#e0e7ff", delay: 0.9 },
  { cx: "55%", cy: "10%", r: 0.9, fill: "#dbeafe", delay: 1.4 },
  { cx: "12%", cy: "25%", r: 1.1, fill: "#ffffff", delay: 0.4 },
  { cx: "88%", cy: "88%", r: 0.9, fill: "#e0d9f0", delay: 1.9 },
  { cx: "5%", cy: "60%", r: 0.8, fill: "#c7d2fe", delay: 2.1 },
  { cx: "95%", cy: "50%", r: 1, fill: "#f3e8ff", delay: 0.7 },
];

/** Offset pattern so the two lamp blocks feel distinct */
const STARS_B: Star[] = [
  { cx: "18%", cy: "18%", r: 1.2, fill: "#ffffff", delay: 0.2 },
  { cx: "82%", cy: "18%", r: 0.9, fill: "#e0e7ff", delay: 0.7 },
  { cx: "12%", cy: "68%", r: 1.1, fill: "#ffffff", delay: 1.1 },
  { cx: "88%", cy: "72%", r: 0.75, fill: "#c7d2fe", delay: 1.6 },
  { cx: "22%", cy: "88%", r: 0.95, fill: "#e0e7ff", delay: 2.1 },
  { cx: "78%", cy: "82%", r: 1.2, fill: "#ffffff", delay: 2.4 },
  { cx: "28%", cy: "38%", r: 0.85, fill: "#f3e8ff", delay: 1.3 },
  { cx: "72%", cy: "52%", r: 1, fill: "#ffffff", delay: 0.9 },
  { cx: "42%", cy: "12%", r: 0.75, fill: "#ddd6fe", delay: 1.7 },
  { cx: "90%", cy: "44%", r: 0.95, fill: "#ffffff", delay: 0.4 },
  { cx: "6%", cy: "48%", r: 0.85, fill: "#ede9fe", delay: 2.3 },
  { cx: "58%", cy: "90%", r: 1.1, fill: "#ffffff", delay: 1.5 },
  { cx: "32%", cy: "74%", r: 0.65, fill: "#dbeafe", delay: 0.55 },
  { cx: "68%", cy: "22%", r: 1, fill: "#ffffff", delay: 2.35 },
  { cx: "48%", cy: "92%", r: 0.75, fill: "#e0e7ff", delay: 0.95 },
  { cx: "52%", cy: "8%", r: 0.85, fill: "#dbeafe", delay: 1.45 },
  { cx: "8%", cy: "22%", r: 1, fill: "#ffffff", delay: 0.35 },
  { cx: "92%", cy: "86%", r: 0.85, fill: "#e0d9f0", delay: 1.85 },
  { cx: "4%", cy: "58%", r: 0.75, fill: "#c7d2fe", delay: 2.05 },
  { cx: "96%", cy: "54%", r: 0.95, fill: "#f3e8ff", delay: 0.65 },
];

type Moon = { x: string; y: string; size: number };

const MOON_A: Moon = { x: "93%", y: "10%", size: 11 };
const MOON_B: Moon = { x: "9%", y: "14%", size: 10 };

const MOON_CHAR = String.fromCodePoint(0x1f319);

export function GalaxyMicroBackdrop({
  variant = "a",
  className,
}: {
  variant?: "a" | "b";
  className?: string;
}) {
  const stars = variant === "b" ? STARS_B : STARS_A;
  const moon = variant === "b" ? MOON_B : MOON_A;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-[1] overflow-hidden", className)}
      aria-hidden
    >
      <svg className="h-full w-full opacity-[0.5] md:opacity-[0.58]" width="100%" height="100%">
        {stars.map((s, i) => (
          <circle
            key={`${variant}-${i}`}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill={s.fill}
            className="lamp-galaxy-star"
            style={{ animationDelay: `${s.delay}s` }}
          />
        ))}
        <text
          x={moon.x}
          y={moon.y}
          fontSize={moon.size}
          fill="#f5f3ff"
          textAnchor="middle"
          dominantBaseline="middle"
          className="lamp-galaxy-moon"
          style={{ fontFamily: "system-ui, 'Segoe UI Emoji', sans-serif" }}
        >
          {MOON_CHAR}
        </text>
      </svg>
    </div>
  );
}
