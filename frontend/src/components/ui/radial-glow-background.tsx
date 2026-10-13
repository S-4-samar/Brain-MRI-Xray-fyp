import { cn } from "../../lib/utils";
import type { CSSProperties, ReactNode } from "react";

export type RadialGlowVariant = "dark" | "lime";

export interface RadialGlowBackgroundProps {
  children?: ReactNode;
  className?: string;
  /** `lime` — green radial glow (default, from design spec); `dark` — neutral gray glow */
  variant?: RadialGlowVariant;
  /** Pin behind all routes (use once in App root) */
  fixed?: boolean;
}

const GLOW_STYLES: Record<RadialGlowVariant, CSSProperties> = {
  dark: {
    backgroundImage: "radial-gradient(circle 500px at 50% 200px, #3e3e3e, transparent)",
  },
  lime: {
    backgroundImage:
      "radial-gradient(circle 500px at 50% 100px, rgba(132,204,22,0.4), transparent)",
  },
};

export function RadialGlowBackground({
  children,
  className,
  variant = "lime",
  fixed = false,
}: RadialGlowBackgroundProps) {
  return (
    <div
      className={cn(
        "w-full bg-[#020617] relative",
        fixed ? "fixed inset-0 z-0 min-h-screen" : "min-h-screen",
        className
      )}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={GLOW_STYLES[variant]}
        aria-hidden
      />
      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}

export default RadialGlowBackground;
