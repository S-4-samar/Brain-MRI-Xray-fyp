import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LampContainer } from "./ui/lamp";
import { cn } from "../lib/utils";

const cardSpring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.7 };
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};
const tagRowVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
};
const tagItem = {
  hidden: { opacity: 0, scale: 0.82, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 520, damping: 26 },
  },
};

type Tag = { label: string; accent: boolean };

const AUTHORS: Array<{
  name: string;
  title: string;
  bio: string;
  image: string;
  tags: Tag[];
}> = [
  {
    name: "Samar Abbas",
    title: "ML & segmentation lead",
    bio: "Architects the BraTS-grade model stack and trains the tumor subregion heads for robust clinical deployment.",
    image: "/team/samar-abbas.png",
    tags: [
      { label: "Deep learning", accent: true },
      { label: "PyTorch", accent: false },
      { label: "BraTS", accent: false },
    ],
  },
  {
    name: "Awais Ali",
    title: "Clinical imaging scientist",
    bio: "Bridges radiology workflows with quantitative MRI QA, study design, and reader protocols.",
    image: "/team/awais-ali.png",
    tags: [
      { label: "MRI QA", accent: true },
      { label: "Radiology", accent: false },
      { label: "Studies", accent: false },
    ],
  },
  {
    name: "Ume Habiba",
    title: "Platform & inference engineer",
    bio: "Owns the FastAPI and PyTorch serving path, latency budgets, and production deployment for the suite.",
    image: "/team/ume-habiba.png",
    tags: [
      { label: "FastAPI", accent: true },
      { label: "Inference", accent: false },
      { label: "DevOps", accent: false },
    ],
  },
];

export default function TeamLampFooter() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-0 -mb-16 w-screen overflow-hidden border-t-0 md:-mb-24"
      aria-labelledby="team-lamp-heading"
    >
      <LampContainer
        beamFromTop
        lampTint="white"
        galaxyVariant="b"
        className="min-h-0 rounded-none pb-0"
        contentClassName="w-full max-w-5xl -mt-12 -translate-y-[5.75rem] px-4 pb-0 pt-0 md:-mt-14 md:-translate-y-[7.5rem] md:px-6"
        lampTitle={
          <motion.h2
            id="team-lamp-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.08, duration: 0.65, ease: "easeOut" }}
            className="font-display pointer-events-auto text-center text-[clamp(2rem,5vw,3.35rem)] font-bold leading-[0.98] tracking-[-0.02em] antialiased drop-shadow-[0_0_32px_rgba(255,255,255,0.28)]"
          >
            <span className="bg-gradient-to-br from-slate-50 via-white to-slate-400 bg-clip-text text-transparent">
              𝑻𝒆𝒂𝒎 𝑴𝒆𝒎𝒃𝒆𝒓𝒔
            </span>
          </motion.h2>
        }
      >
        <motion.div
          className="relative z-40 mx-auto -mt-12 grid w-full max-w-xs grid-cols-1 justify-items-center gap-4 md:-mt-16 md:max-w-4xl md:grid-cols-3 md:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {AUTHORS.map((author, i) => (
            <motion.article
              key={author.name}
              variants={{
                hidden: { opacity: 0, y: 36, scale: 0.94, filter: "blur(10px)" },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: {
                    duration: 0.62,
                    ease: [0.22, 1, 0.36, 1],
                  },
                },
              }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -10,
                      scale: 1.025,
                      boxShadow:
                        "0 28px 60px -18px rgba(0,0,0,0.85), 0 0 0 1px rgba(34,211,238,0.25), 0 0 48px -12px rgba(34,211,238,0.35)",
                      transition: cardSpring,
                    }
              }
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className={cn(
                "group relative flex w-full max-w-[248px] flex-col items-center overflow-hidden rounded-2xl border px-5 pb-5 pt-6 text-center shadow-[0_20px_48px_-20px_rgba(0,0,0,0.75)] backdrop-blur-md transition-colors duration-500 md:max-w-[260px] md:px-6 md:pb-6 md:pt-7",
                i === 0
                  ? "border-cyan-500/40 bg-slate-900/95"
                  : "border-slate-800/90 bg-slate-900/95"
              )}
            >
              {/* Ambient hover glow */}
              <div
                className={cn(
                  "pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                  i === 0
                    ? "bg-gradient-to-br from-cyan-400/35 via-cyan-500/15 to-violet-600/25"
                    : "bg-gradient-to-br from-slate-400/20 via-cyan-500/10 to-violet-500/15"
                )}
                aria-hidden
              />
              {/* Slow pulse ring (first card) */}
              {i === 0 && !reduceMotion ? (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(34,211,238,0.4)",
                      "0 0 0 14px rgba(34,211,238,0)",
                      "0 0 0 0 rgba(34,211,238,0)",
                    ],
                  }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />
              ) : null}
              {/* Shine sweep */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
                aria-hidden
              >
                <div className="absolute inset-y-0 left-0 w-1/2 -translate-x-full skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition duration-700 ease-out group-hover:translate-x-[220%] group-hover:opacity-100" />
              </div>
              {/* Top edge highlight */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 transition duration-500 group-hover:opacity-100"
                aria-hidden
              />

              <div className="relative z-10 flex w-full flex-col items-center">
                <motion.div
                  className={cn(
                    "mb-5 rounded-full p-[3px]",
                    i === 0
                      ? "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_26px_rgba(34,211,238,0.5)]"
                      : "bg-slate-600/50 ring-1 ring-slate-600/60"
                  )}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { scale: 1.06, transition: { type: "spring", stiffness: 400, damping: 18 } }
                  }
                >
                  <div className="flex items-center justify-center overflow-hidden rounded-full bg-slate-950 p-1 ring-2 ring-slate-950">
                    <motion.img
                      src={author.image}
                      alt={author.name}
                      className="h-[68px] w-[68px] object-contain object-center md:h-[74px] md:w-[74px]"
                      whileHover={reduceMotion ? undefined : { scale: 1.09 }}
                      transition={{ type: "spring", stiffness: 380, damping: 20 }}
                    />
                  </div>
                </motion.div>

                <motion.h3
                  className="text-[1.05rem] font-bold leading-snug tracking-tight text-white md:text-lg"
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                >
                  {author.name}
                </motion.h3>
                <p className="mt-1.5 bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-[0.8125rem] font-medium leading-snug text-transparent md:text-sm">
                  {author.title}
                </p>
                <p className="mt-4 max-w-[22ch] flex-1 text-xs leading-relaxed text-slate-400 transition duration-300 group-hover:text-slate-300 md:mt-5 md:max-w-[24ch] md:text-[13px]">
                  {author.bio}
                </p>

                <motion.div
                  className="mt-5 flex w-full flex-wrap justify-center gap-2 md:mt-6"
                  variants={tagRowVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  {author.tags.map((tag) => (
                    <motion.span
                      key={tag.label}
                      variants={tagItem}
                      whileHover={
                        reduceMotion
                          ? undefined
                          : { scale: 1.08, y: -2, transition: { type: "spring", stiffness: 500, damping: 22 } }
                      }
                      className={cn(
                        "whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium tracking-wide transition-shadow duration-300",
                        tag.accent
                          ? "bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.35)] group-hover:shadow-[0_0_22px_rgba(6,182,212,0.55)]"
                          : "bg-slate-800/95 text-slate-100 ring-1 ring-slate-700/90 group-hover:ring-cyan-500/30"
                      )}
                    >
                      {tag.label}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </LampContainer>
    </section>
  );
}
