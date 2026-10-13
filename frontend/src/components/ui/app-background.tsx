import { RadialGlowBackground } from "./radial-glow-background";

/** Full-viewport radial glow layer — mount once at the app root */
export default function AppBackground() {
  return <RadialGlowBackground fixed variant="lime" />;
}
