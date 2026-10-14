import { useEffect } from "react";

/**
 * Simple Hero section. No external imports besides React.
 * Usage: <Hero heroImg={mriHeroImg} onRequestAccess={handleRequestAccess} />
 */

const ICON_PATHS = {
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  star: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="M7 4v16l14-8z" fill="currentColor" stroke="none" />,
};

function Icon({ name, size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

const btn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 24px",
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: "inherit",
};

export default function Hero({ onRequestAccess, heroImg }) {
  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll("#hero .vg-fade-in").forEach((el) => el.classList.add("visible"));
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const pills = [
    { icon: "shield", label: "No Contrast Agent" },
    { icon: "clock", label: "No Extra Scan" },
    { icon: "star", label: "AI-Powered" },
  ];

  return (
    <section id="hero" className="vg-hero">
      <style>{`
        .vg-hero{position:relative;min-height:100vh;display:flex;align-items:center;padding:100px 5% 72px;overflow:hidden}
        .vg-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;max-width:1280px;margin:0 auto;width:100%}
        .vg-h1{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(2.5rem,5.2vw,4.1rem);font-weight:700;line-height:1.04;letter-spacing:-.035em;margin:0;max-width:13ch}
        @media (max-width:900px){
          .vg-hero{padding:84px 20px 56px;min-height:auto}
          .vg-hero-grid{grid-template-columns:1fr;gap:44px}
        }
      `}</style>

      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)", top: -220, right: -160, pointerEvents: "none" }} />

      <div className="vg-hero-grid">
        <div>
          <h1 className="vg-h1 vg-fade-in vg-delay-1">Contrast-enhanced MRI, without the contrast agent.</h1>

          <p className="vg-fade-in vg-delay-2" style={{ margin: "22px 0 0", fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "46ch", lineHeight: 1.7 }}>
            Virtual Gadolinium uses deep learning to turn a routine pre-contrast scan into a contrast-enhanced image and an automated segmentation. No injection, no second acquisition.
          </p>

          <div className="vg-fade-in vg-delay-3" style={{ marginTop: 34, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={onRequestAccess} style={{ ...btn, background: "#7c3aed", color: "#fff", border: "1px solid transparent", boxShadow: "0 8px 28px -8px rgba(124,58,237,.6)" }}>
              Request Access <Icon name="arrow" />
            </button>
            <a href="#how-it-works" style={{ ...btn, background: "transparent", color: "inherit", border: "1px solid rgba(255,255,255,.14)" }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="play" size={12} />
              </span>
              See How It Works
            </a>
          </div>

          <div className="vg-fade-in vg-delay-4" style={{ marginTop: 38, display: "flex", gap: 24, flexWrap: "wrap" }}>
            {pills.map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                <Icon name={p.icon} size={17} color="#a78bfa" />
                {p.label}
              </div>
            ))}
          </div>
        </div>

        <div className="vg-fade-in vg-delay-2">
          <div style={{ borderRadius: 50, overflow: "hidden", aspectRatio: heroImg ? undefined : "video" }}>
            {heroImg && <img src={heroImg} alt="MRI scan comparison: pre-contrast, virtual contrast, and segmentation" style={{ width: "100%", marginTop: "-100px", display: "block", aspectRatio: "video" }} />}
          </div>
        </div>
      </div>
    </section>
  );
}