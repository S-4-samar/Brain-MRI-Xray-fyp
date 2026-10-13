import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { GalaxyMicroBackdrop } from "./galaxy-micro-backdrop";

export const LampContainer = ({
  children,
  className,
  contentClassName = "-translate-y-80",
  /** When set, lamp graphics anchor toward the top so the beam reads above footer content */
  beamFromTop = false,
  /** Shorter beam stack for single-card sections (reduces dead space below) */
  compactBeam = false,
  /** Beam color: cyan (default) or soft white */
  lampTint = "cyan",
  /** Tiny stars + moon backdrop (orbital-style); default on for beamFromTop */
  galaxyMicro,
  /** Star layout preset when galaxyMicro is on */
  galaxyVariant = "a",
  /** Renders centered above the cyan beam (e.g. section title) */
  lampTitle,
}: {
  children: React.ReactNode;
  className?: string;
  /** Adjust vertical offset of slotted content (title, cards) relative to the lamp beam */
  contentClassName?: string;
  beamFromTop?: boolean;
  compactBeam?: boolean;
  lampTint?: "cyan" | "white";
  galaxyMicro?: boolean;
  galaxyVariant?: "a" | "b";
  lampTitle?: React.ReactNode;
}) => {
  const white = lampTint === "white";
  const showGalaxy = beamFromTop && (galaxyMicro ?? true);

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden rounded-md bg-slate-950 z-0",
        beamFromTop && "justify-start pt-6 md:pt-10",
        className
      )}
    >
      {showGalaxy ? <GalaxyMicroBackdrop variant={galaxyVariant} /> : null}
      {beamFromTop ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-[25]",
            white
              ? "bg-[radial-gradient(ellipse_72%_52%_at_50%_0%,rgba(255,255,255,0.22),rgba(255,255,255,0.07)_42%,transparent_70%)]"
              : "bg-[radial-gradient(ellipse_72%_52%_at_50%_0%,rgba(34,211,238,0.26),rgba(34,211,238,0.08)_42%,transparent_70%)]",
            compactBeam ? "h-[220px] md:h-[240px]" : "h-[420px]"
          )}
          aria-hidden
        />
      ) : null}
      {beamFromTop && lampTitle ? (
        <div className="pointer-events-none absolute left-1/2 top-6 z-[80] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 md:top-8">
          {lampTitle}
        </div>
      ) : null}
      <div
        className={cn(
          "relative z-10 flex w-full items-center justify-center isolate",
          beamFromTop
            ? cn(
                "flex-none scale-y-110",
                compactBeam
                  ? "min-h-[180px] max-h-[240px] md:min-h-[190px] md:max-h-[250px]"
                  : "min-h-[300px] max-h-[380px] md:min-h-[340px] md:max-h-[420px]"
              )
            : "flex-1 scale-y-125"
        )}
      >
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={cn(
            "absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible bg-gradient-conic via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]",
            white ? "from-white/55" : "from-cyan-500"
          )}
        >
          <div className="absolute bottom-0 left-0 z-20 h-40 w-[100%] bg-slate-950 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute bottom-0 left-0 z-20 h-[100%] w-40 bg-slate-950 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className={cn(
            "absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent text-white [--conic-position:from_290deg_at_center_top]",
            white ? "to-white/55" : "to-cyan-500"
          )}
        >
          <div className="absolute bottom-0 right-0 z-20 h-[100%] w-40 bg-slate-950 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute bottom-0 right-0 z-20 h-40 w-[100%] bg-slate-950 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-slate-950 blur-2xl" />
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />
        <div
          className={cn(
            "absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full blur-3xl",
            white ? "bg-white opacity-[0.38]" : "bg-cyan-500 opacity-50"
          )}
        />
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full blur-2xl",
            white ? "bg-white/65" : "bg-cyan-400"
          )}
        />
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem]",
            white ? "bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.45)]" : "bg-cyan-400"
          )}
        />

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950" />
      </div>

      <div
        className={cn(
          "relative z-40 flex flex-col items-center px-5",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};
