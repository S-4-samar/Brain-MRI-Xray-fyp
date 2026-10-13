"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

export type CollectiveProfile = {
  name: string;
  title: string;
  bio: string;
  image: string;
  role: "supervisor" | "member";
};

type CollectiveCircleProps = {
  profiles: CollectiveProfile[];
  heading: string;
  subheading: string;
  className?: string;
};

const SUPERVISOR_INDEX = 0;
const STAGE_MAX_PX = 360;
const RING_WIDTH_PX = 2;

function orbitAngle(profileIndex: number, pivot: number, total: number) {
  const slot = (profileIndex - pivot + total) % total;
  return (2 * Math.PI * slot) / total - Math.PI / 2;
}

function computeOrbitRadius(stageSize: number) {
  return stageSize / 2 - RING_WIDTH_PX / 2;
}

function avatarSizeForStage(stageSize: number, expanded: boolean) {
  if (!expanded) return Math.min(84, Math.round(stageSize * 0.24));
  return Math.min(68, Math.round(stageSize * 0.19));
}

const ORBIT_DOTS = [0, 1, 2, 3].map((i) => {
  const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
  return { angle, label: ["N", "E", "S", "W"][i] };
});

export function ScrollingAnimation({
  profiles,
  heading,
  subheading,
  className,
}: CollectiveCircleProps) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(SUPERVISOR_INDEX);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState(STAGE_MAX_PX);
  const [orbitPx, setOrbitPx] = useState(148);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const measure = () => {
      const size = el.getBoundingClientRect().width;
      if (size > 0) {
        setStageSize(size);
        setOrbitPx(computeOrbitRadius(size));
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isOpen = expanded || Boolean(reduceMotion);
  const pivot = activeIndex;
  const active = profiles[pivot];
  const transitionMs = reduceMotion ? 0 : 500;
  const orbitAvatarPx = avatarSizeForStage(stageSize, true);
  const centerAvatarPx = avatarSizeForStage(stageSize, false);
  const radius = isOpen ? orbitPx : 0;

  const handleExpand = () => {
    if (!isOpen) setExpanded(true);
  };

  const handleProfileClick = (index: number) => {
    if (!isOpen) {
      setExpanded(true);
      setActiveIndex(index);
      return;
    }
    setActiveIndex(index);
  };

  return (
    <div
      className={cn(
        "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-transparent py-14 md:py-16",
        className
      )}
      aria-label={heading}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 md:px-6">
        <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-400/90 md:text-xs">
          {heading}
        </p>
        <h2 className="font-display text-center text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-tight text-white">
          Supervisor &amp; team
        </h2>
        <p className="mt-2 max-w-md text-center text-xs text-slate-500 md:text-sm">
          {subheading}
        </p>

        <div
          className="relative mt-12 flex w-full max-w-[min(360px,86vw)] translate-y-3 flex-col items-center overflow-visible px-5 md:mt-16 md:translate-y-4"
          role="group"
          aria-label="Team profiles"
        >
          {/* Ambient field glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14)_0%,rgba(34,211,238,0.06)_38%,transparent_68%)] blur-xl"
            aria-hidden
          />

          <div
            ref={stageRef}
            className={cn(
              "relative aspect-square w-full max-w-[min(360px,86vw)] overflow-visible",
              !isOpen && "cursor-pointer"
            )}
            onClick={handleExpand}
            onKeyDown={(e) => {
              if (!isOpen && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setExpanded(true);
              }
            }}
            role={!isOpen ? "button" : undefined}
            tabIndex={!isOpen ? 0 : undefined}
            aria-label={isOpen ? "Team circle" : "Expand team circle"}
          >
            {/* Collapsed invite pulse */}
            {!isOpen && !reduceMotion ? (
              <div
                className="collective-pulse-ring pointer-events-none absolute inset-[18%] rounded-full border border-cyan-400/25"
                aria-hidden
              />
            ) : null}

            {/* Rotating conic halo (outer) */}
            <div
              className={cn(
                "pointer-events-none absolute -inset-[3px] rounded-full opacity-70",
                !reduceMotion && "collective-ring-spin"
              )}
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, rgba(34,211,238,0.5) 12%, transparent 24%, rgba(167,139,250,0.55) 38%, transparent 52%, rgba(34,211,238,0.45) 68%, transparent 82%, rgba(124,58,237,0.5) 92%, transparent 100%)",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                WebkitMask:
                  "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
              }}
              aria-hidden
            />

            {/* Primary gradient ring */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-purple-600 p-[2px] shadow-[0_0_36px_-6px_rgba(124,58,237,0.55),inset_0_0_24px_rgba(34,211,238,0.08)] transition-all duration-700",
                isOpen ? "opacity-100" : "opacity-85"
              )}
              aria-hidden
            >
              <div className="relative h-full w-full rounded-full bg-[#020617]">
                {/* Inner scan grid */}
                <div
                  className="absolute inset-[8%] rounded-full opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(34,211,238,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.8) 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                  aria-hidden
                />
                {/* Crosshair guides */}
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
                  <div className="h-px w-[76%] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                  <div className="absolute h-[76%] w-px bg-gradient-to-b from-transparent via-violet-500/20 to-transparent" />
                </div>
              </div>
            </div>

            {/* Orbital node markers */}
            {isOpen
              ? ORBIT_DOTS.map(({ angle }, idx) => {
                  const x = orbitPx * Math.cos(angle);
                  const y = orbitPx * Math.sin(angle);
                  return (
                    <div
                      key={idx}
                      className="pointer-events-none absolute left-1/2 top-1/2 z-[15] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/70 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                      aria-hidden
                    />
                  );
                })
              : null}

            {/* Active beam to top profile */}
            {isOpen ? (
              <svg
                className="pointer-events-none absolute inset-0 z-[18] h-full w-full overflow-visible"
                aria-hidden
              >
                <defs>
                  <linearGradient id="collective-beam" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="rgba(34,211,238,0)" />
                    <stop offset="55%" stopColor="rgba(34,211,238,0.35)" />
                    <stop offset="100%" stopColor="rgba(167,139,250,0.5)" />
                  </linearGradient>
                </defs>
                <line
                  x1="50%"
                  y1="50%"
                  x2="50%"
                  y2={`${50 - (orbitPx / stageSize) * 100}%`}
                  stroke="url(#collective-beam)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
            ) : null}

            {/* Glass center hub — larger inset so full bio/title fits */}
            <motion.div
              className={cn(
                "pointer-events-none absolute inset-[20%] z-20 flex items-center justify-center rounded-full border border-cyan-500/15 bg-[#020617]/92 shadow-[inset_0_0_32px_rgba(124,58,237,0.12),0_0_24px_rgba(0,0,0,0.4)] backdrop-blur-sm",
                isOpen ? "opacity-100" : "opacity-0"
              )}
              initial={false}
              animate={{
                scale: isOpen ? 1 : 0.92,
                opacity: isOpen ? 1 : 0,
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_55%)]" />
              <motion.div
                key={active.name}
                className="relative flex h-full w-full flex-col items-center justify-center px-3 py-1 text-center md:px-3.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                {active.role === "supervisor" ? (
                  <span className="mb-1.5 rounded-full border border-violet-400/25 bg-violet-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-200">
                    Academic lead
                  </span>
                ) : (
                  <span className="mb-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300/90">
                    Core team
                  </span>
                )}
                <h3 className="collective-shimmer-text font-display bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-[clamp(0.95rem,2.8vw,1.15rem)] font-bold leading-tight text-transparent">
                  {active.name}
                </h3>
                <p className="mt-1.5 max-w-[18ch] bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-[10px] font-medium leading-snug text-transparent md:max-w-[20ch] md:text-[11px]">
                  {active.title}
                </p>
                <p className="mt-2 max-w-[22ch] text-[9px] leading-relaxed text-slate-400 md:max-w-[24ch] md:text-[10px] md:leading-relaxed">
                  {active.bio}
                </p>
              </motion.div>
            </motion.div>

            {profiles.map((profile, i) => {
              const angle = isOpen ? orbitAngle(i, pivot, profiles.length) : 0;
              const tx = radius * Math.cos(angle);
              const ty = radius * Math.sin(angle);
              const atTop =
                isOpen && (i - pivot + profiles.length) % profiles.length === 0;
              const isSupervisorCenter = !isOpen && i === SUPERVISOR_INDEX;
              const hiddenUntilOpen = !isOpen && i !== SUPERVISOR_INDEX;
              const sizePx = isOpen ? orbitAvatarPx : centerAvatarPx;

              return (
                <button
                  key={profile.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick(i);
                  }}
                  className={cn(
                    "absolute left-1/2 top-1/2 ease-out",
                    hiddenUntilOpen && "pointer-events-none opacity-0"
                  )}
                  style={{
                    transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${
                      isSupervisorCenter ? 1 : atTop ? 1.08 : isOpen ? 1 : 0.6
                    })`,
                    opacity: hiddenUntilOpen ? 0 : 1,
                    transition: `transform ${transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${transitionMs}ms ease`,
                    zIndex: isSupervisorCenter ? 50 : atTop ? 45 : 40,
                  }}
                  aria-label={`${profile.name}, ${profile.title}`}
                  aria-hidden={hiddenUntilOpen}
                  aria-pressed={activeIndex === i}
                >
                  {/* Gradient frame */}
                  <div
                    className={cn(
                      "rounded-2xl p-[2px] transition-shadow duration-300",
                      isSupervisorCenter &&
                        "bg-gradient-to-br from-cyan-300 via-violet-400 to-purple-500 shadow-[0_0_32px_rgba(124,58,237,0.45)]",
                      isOpen &&
                        atTop &&
                        "bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_28px_rgba(34,211,238,0.4)]",
                      isOpen &&
                        !atTop &&
                        !isSupervisorCenter &&
                        "bg-gradient-to-br from-slate-600/80 to-slate-800/80 shadow-lg hover:from-cyan-600/60 hover:to-violet-600/60",
                      !isOpen && !isSupervisorCenter && "bg-slate-700"
                    )}
                    style={{ width: sizePx, height: sizePx }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-[#020617]">
                      <img
                        src={profile.image}
                        alt=""
                        className={cn(
                          "h-full w-full",
                          profile.role === "supervisor"
                            ? "scale-[1.1] object-cover object-[center_22%]"
                            : "object-contain object-center p-0.5"
                        )}
                      />
                      {atTop || isSupervisorCenter ? (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-violet-500/10" />
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Collapsed hint */}
            {!isOpen ? (
              <p className="pointer-events-none absolute -bottom-7 left-0 right-0 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">
                Tap to reveal orbit
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
