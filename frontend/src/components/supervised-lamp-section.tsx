import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LampContainer } from "./ui/lamp";
import { cn } from "../lib/utils";

const cardSpring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.7 };

const SUPERVISOR = {
  name: "Zaeem Nazir",
  title: "Associate Lecturer, University of Narowal",
  bio: "Academic supervisor for research direction and methodology on the Virtual Gadolinium project.",
  image: "/team/zaeem-nazir.png",
  tags: [
    { label: "Academic lead", accent: true },
    { label: "Research supervision", accent: false },
  ] as const,
};

export default function SupervisedLampSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-10 -mb-12 w-screen overflow-hidden border-t border-slate-800/80 md:-mb-16"
      aria-labelledby="supervised-lamp-heading"
    >
      <LampContainer
        beamFromTop
        lampTint="white"
        className="min-h-0 rounded-none pb-3 md:pb-4"
        contentClassName="w-full max-w-5xl -mt-16 -translate-y-[6rem] px-4 pb-5 pt-0 md:-mt-[4.75rem] md:-translate-y-[7.25rem] md:px-6 md:pb-6"
        lampTitle={
          <motion.h2
            id="supervised-lamp-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.08, duration: 0.65, ease: "easeOut" }}
            className="font-display pointer-events-auto text-center text-[clamp(2rem,5vw,3.35rem)] font-bold leading-[0.98] tracking-[-0.02em] antialiased drop-shadow-[0_0_32px_rgba(255,255,255,0.28)]"
          >
            <span className="bg-gradient-to-br from-slate-50 via-white to-slate-400 bg-clip-text text-transparent">
              𝑺𝒖𝒑𝒆𝒓𝒗𝒊𝒔𝒆𝒅 𝑩𝒚
            </span>
          </motion.h2>
        }
      >
        <motion.div
          className="relative z-40 mx-auto -mt-14 flex w-full max-w-[280px] justify-center md:-mt-16 md:max-w-[260px]"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.article
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -8,
                    scale: 1.02,
                    boxShadow:
                      "0 24px 52px -16px rgba(0,0,0,0.85), 0 0 0 1px rgba(34,211,238,0.22), 0 0 40px -12px rgba(34,211,238,0.3)",
                    transition: cardSpring,
                  }
            }
            whileTap={reduceMotion ? undefined : { scale: 0.988 }}
            className={cn(
              "group relative flex w-full max-w-[240px] flex-col items-center overflow-hidden rounded-2xl border border-cyan-500/35 bg-slate-900/95 px-4 pb-3 pt-4 text-center shadow-[0_18px_40px_-18px_rgba(0,0,0,0.72)] backdrop-blur-md transition-colors duration-500 md:max-w-[252px] md:px-5 md:pb-4 md:pt-5"
            )}
          >
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-400/30 via-cyan-500/12 to-violet-600/22 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden
            />
            {!reduceMotion ? (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(34,211,238,0.35)",
                    "0 0 0 12px rgba(34,211,238,0)",
                    "0 0 0 0 rgba(34,211,238,0)",
                  ],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
              <div className="absolute inset-y-0 left-0 w-1/2 -translate-x-full skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 transition duration-700 ease-out group-hover:translate-x-[220%] group-hover:opacity-100" />
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent opacity-0 transition duration-500 group-hover:opacity-100"
              aria-hidden
            />

            <div className="relative z-10 flex w-full flex-col items-center">
              <motion.div
                className="mb-3 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 p-[3px] shadow-[0_0_22px_rgba(34,211,238,0.45)] md:mb-3.5"
                whileHover={
                  reduceMotion
                    ? undefined
                    : { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 18 } }
                }
              >
                <div className="flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full bg-slate-950 p-0 ring-2 ring-slate-950 md:h-[68px] md:w-[68px]">
                  <motion.img
                    src={SUPERVISOR.image}
                    alt={SUPERVISOR.name}
                    className="h-full w-full origin-center scale-[1.18] object-cover object-[center_22%] md:scale-[1.14]"
                    whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                  />
                </div>
              </motion.div>

              <motion.h3
                className="text-[1rem] font-bold leading-snug tracking-tight text-white md:text-[1.05rem]"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              >
                {SUPERVISOR.name}
              </motion.h3>
              <p className="mt-1 max-w-[28ch] bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-[0.78rem] font-medium leading-snug text-transparent md:text-[0.8125rem]">
                {SUPERVISOR.title}
              </p>
              <p className="mt-2 max-w-[26ch] text-[11px] leading-snug text-slate-400 transition duration-300 group-hover:text-slate-300 md:text-[12px]">
                {SUPERVISOR.bio}
              </p>

              <div className="mt-3 flex w-full flex-wrap justify-center gap-1.5 md:mt-3.5 md:gap-2">
                {SUPERVISOR.tags.map((tag) => (
                  <motion.span
                    key={tag.label}
                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : { scale: 1.06, y: -1, transition: { type: "spring", stiffness: 500, damping: 22 } }
                    }
                    className={cn(
                      "whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide md:px-3 md:py-1 md:text-[11px]",
                      tag.accent
                        ? "bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_18px_rgba(6,182,212,0.5)]"
                        : "bg-slate-800/95 text-slate-100 ring-1 ring-slate-700/90 group-hover:ring-cyan-500/28"
                    )}
                  >
                    {tag.label}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.article>
        </motion.div>
      </LampContainer>
    </section>
  );
}
