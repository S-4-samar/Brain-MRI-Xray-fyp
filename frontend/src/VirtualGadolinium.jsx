import { useState, useEffect, useRef } from "react";

// ── Replace these with your actual image imports ──
// import mriHeroImg from "./assets/mri_hero.png";        // Image 2 — MRI comparison (pre/virtual/seg)
// import brainNetworkImg from "./assets/brain_network.png"; // Image 1 — glowing purple brain
//
// For quick testing you can also use public folder paths:
// const mriHeroImg = "/images/mri_hero.png";
// const brainNetworkImg = "/images/brain_network.png";
//
const mriHeroImg = "/assets/2.png";       // MRI comparison (pre/virtual/seg) — Hero section
const brainNetworkImg = "/assets/1.png";  // Glowing purple brain — CTA section

// ─── CSS-in-JS styles injected once ───
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-primary: transparent;
    --bg-secondary: #090b1a;
    --bg-card: rgba(255,255,255,0.03);
    --bg-card-hover: rgba(255,255,255,0.055);
    --purple: #7c3aed;
    --purple-light: #9d5cf4;
    --purple-glow: rgba(124,58,237,0.35);
    --accent: #a78bfa;
    --accent-dim: rgba(167,139,250,0.15);
    --text-primary: #f1f0ff;
    --text-secondary: #9892b8;
    --text-muted: #5e5880;
    --border: rgba(255,255,255,0.06);
    --border-purple: rgba(124,58,237,0.25);
    --radius: 16px;
    --radius-sm: 8px;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Inter', sans-serif;
    background-color: transparent;
    color: var(--text-primary);
    overflow-x: hidden;
    line-height: 1.6;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-primary); }
  ::-webkit-scrollbar-thumb { background: var(--purple); border-radius: 99px; }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  @keyframes arrow-flow {
    0%   { opacity: 0.3; transform: translate(-50%,-50%) scale(0.85); }
    50%  { opacity: 1;   transform: translate(-50%,-50%) scale(1.08); }
    100% { opacity: 0.3; transform: translate(-50%,-50%) scale(0.85); }
  }

  @keyframes scan-line {
    0%   { top: 0%; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }

  @keyframes pipeline-glow {
    0%, 100% { box-shadow: 0 0 30px rgba(124,58,237,0.2), 0 0 0 1px rgba(124,58,237,0.2); }
    50%       { box-shadow: 0 0 60px rgba(124,58,237,0.4), 0 0 0 1px rgba(167,139,250,0.4); }
  }

  @keyframes dot-pulse {
    0%, 100% { transform: scale(1);   opacity: 1; }
    50%       { transform: scale(1.5); opacity: 0.5; }
  }

  @keyframes badge-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .vg-fade-in {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .vg-fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .vg-delay-1 { transition-delay: 0.1s; }
  .vg-delay-2 { transition-delay: 0.2s; }
  .vg-delay-3 { transition-delay: 0.3s; }
  .vg-delay-4 { transition-delay: 0.4s; }

  .vg-noise::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.6;
  }
`;

// ─── Hooks ───
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("visible"); },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useCounter(target, suffix = "", prefix = "") {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        if (target === 0) { setValue(0); return; }
        const duration = 1400;
        const startTime = performance.now();
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          setValue(Math.round(easeOut(progress) * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return { ref, display: `${prefix}${value}${suffix}` };
}

// ─── Sub-components ───
function FadeEl({ children, className = "", delay = 0, style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("visible"); },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const delayClass = delay ? `vg-delay-${delay}` : "";
  return (
    <div ref={ref} className={`vg-fade-in ${delayClass} ${className}`} style={style}>
      {children}
    </div>
  );
}

function NavLogo() {
  return (
    <a href="#hero" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
      <img
        src="/assets/vg-logo-transparent.png"
        alt="Virtual Gadolinium logo"
        width="76"
        height="76"
        style={{ width: 76, height: 76, objectFit: "contain", filter: "brightness(0) invert(1)" }}
      />
      <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        VIRTUAL <span style={{ color: "var(--accent)" }}>GADOLINIUM</span>
      </span>
    </a>
  );
}

function Navbar({ onRequestAccess }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#hero", label: "Home" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#features", label: "Features" },
    { href: "#use-cases", label: "Use Cases" },
    { href: "#cta", label: "About" },
    { href: "#footer", label: "Contact" },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 5%", height: 96,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      borderBottom: "1px solid var(--border)",
      background: scrolled ? "rgba(2,6,23,0.95)" : "rgba(2,6,23,0.82)",
      transition: "background 0.3s"
    }}>
      <NavLogo />

      {/* Desktop links */}
      <ul style={{ display: "flex", alignItems: "center", gap: 2, listStyle: "none" }}>
        {links.map(l => (
          <li key={l.href}>
            <a href={l.href} style={{
              textDecoration: "none", color: "var(--text-secondary)",
              fontSize: "0.875rem", fontWeight: 500,
              padding: "6px 14px", borderRadius: "var(--radius-sm)",
              display: "block", transition: "color 0.2s, background 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
            >{l.label}</a>
          </li>
        ))}
        <li>
          <a
            href="/app"
            onClick={(e) => {
              if (!onRequestAccess) return;
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              onRequestAccess();
            }}
            style={{
              background: "var(--purple)", color: "#fff",
              padding: "8px 20px", borderRadius: 99,
              fontWeight: 600, fontSize: "0.875rem",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)",
              textDecoration: "none", display: "block",
              transition: "box-shadow 0.2s, transform 0.2s, background 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--purple-light)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(124,58,237,0.6)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--purple)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.4)"; e.currentTarget.style.transform = "none"; }}
          >Request Access</a>
        </li>
      </ul>
    </nav>
  );
}

function Hero({ onRequestAccess }) {
  useEffect(() => {
    setTimeout(() => { document.querySelectorAll("#hero .vg-fade-in").forEach(el => el.classList.add("visible")); }, 100);
  }, []);

  return (
    <section id="hero" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px 5% 60px", overflow: "hidden" }}>
      {/* Glows */}
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)", top: -200, left: -200, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.12) 0%,transparent 70%)", bottom: 0, right: "10%", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <div>

          <h1 className="vg-fade-in vg-delay-1" style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(2.8rem,5vw,4.2rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: 8 }}>
            Virtual Contrast.<br />
            <span style={{ background: "linear-gradient(90deg,#a78bfa,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Real Clarity.</span>
          </h1>

          <p className="vg-fade-in vg-delay-2" style={{ marginTop: 20, fontSize: "1rem", color: "var(--text-secondary)", maxWidth: 440, lineHeight: 1.75 }}>
            Virtual Gadolinium uses deep learning to synthesize contrast-enhanced MRI scans and automated segmentations from routine pre-contrast input — no contrast agent, no extra scan, just intelligence.
          </p>

          <div className="vg-fade-in vg-delay-3" style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <BtnPrimary onRequestAccess={onRequestAccess}>
              Request Access
              <ArrowIcon />
            </BtnPrimary>
            <BtnSecondary href="#how-it-works">
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </span>
              See How It Works
            </BtnSecondary>
          </div>

          <div className="vg-fade-in vg-delay-4" style={{ marginTop: 40, display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { icon: "shield", label: "No Contrast Agent" },
              { icon: "clock", label: "No Extra Scan" },
              { icon: "star", label: "AI-Powered" },
            ].map(p => <HeroPill key={p.label} icon={p.icon} label={p.label} />)}
          </div>
        </div>

        {/* Hero visual — MRI comparison image */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 560, borderRadius: 20, overflow: "hidden", border: "1px solid var(--border-purple)", boxShadow: "0 0 60px rgba(124,58,237,0.25),0 30px 80px rgba(0,0,0,0.5)", position: "relative" }}>
            <img
              src={mriHeroImg}
              alt="MRI scan comparison: pre-contrast, virtual contrast, and segmentation"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(2,6,23,0.6))", pointerEvents: "none" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPill({ icon, label }) {
  const icons = {
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[icon]}</svg>
      {label}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function BtnPrimary({ href = "/app", onRequestAccess, children, style = {} }) {
  const [hov, setHov] = useState(false);
  const shared = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: hov ? "var(--purple-light)" : "var(--purple)",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 600,
    padding: "13px 26px",
    borderRadius: 99,
    boxShadow: hov ? "0 0 40px rgba(124,58,237,0.65)" : "0 0 28px rgba(124,58,237,0.45)",
    transform: hov ? "translateY(-2px)" : "none",
    transition: "all 0.25s",
    ...style,
  };
  if (onRequestAccess) {
    return (
      <button
        type="button"
        onClick={onRequestAccess}
        style={{ ...shared, border: "none", cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {children}
      </button>
    );
  }
  return (
    <a href={href} style={{ ...shared, textDecoration: "none" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

function BtnSecondary({ href, children }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: hov ? "var(--accent-dim)" : "transparent",
      color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 500,
      padding: "13px 24px", borderRadius: 99, textDecoration: "none",
      border: `1px solid ${hov ? "var(--border-purple)" : "var(--border)"}`,
      transition: "all 0.2s"
    }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

function WaveDivider({ flip = false, fill = "#090b1a" }) {
  const d = flip
    ? `M0 30 Q360 60 720 30 Q1080 0 1440 30 L1440 0 L0 0Z`
    : `M0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 L0 60Z`;
  return (
    <div style={{ width: "100%", overflow: "hidden", lineHeight: 0, pointerEvents: "none" }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
        <path d={d} fill={fill} />
      </svg>
    </div>
  );
}

function SectionHead({ label, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 70 }}>
      <FadeEl><p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>{label}</p></FadeEl>
      <FadeEl delay={1}><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }} dangerouslySetInnerHTML={{ __html: title }} /></FadeEl>
      {subtitle && <FadeEl delay={2}><p style={{ marginTop: 14, fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 520, lineHeight: 1.75, margin: "14px auto 0" }}>{subtitle}</p></FadeEl>}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", title: "Upload Pre-Contrast MRI", desc: "Upload your routine pre-contrast MRI scans in standard DICOM or NIfTI format directly through our secure portal." },
    { n: "2", title: "AI Enhancement", desc: "Our deep learning model synthesizes contrast-enhanced post-contrast images with clinically realistic enhancement patterns." },
    { n: "3", title: "Automated Segmentation", desc: "The model automatically delineates key anatomical regions, tumors, edema, and lesions for precise diagnostic insights." },
    { n: "4", title: "Results & Export", desc: "Download enhanced images and segmentation masks in formats ready for your PACS and clinical workflows." },
  ];

  return (
    <>
      <WaveDivider fill="#090b1a" />
      <section id="how-it-works" style={{ padding: "100px 5%", background: "var(--bg-secondary)", position: "relative", zIndex: 1 }}>
        <SectionHead
          label="How It Works"
          title="From Pre-Contrast to Insight<br/>in Seconds"
          subtitle="Our AI pipeline transforms standard pre-contrast MRI scans into diagnostic-quality post-contrast images and actionable segmentations."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {/* connector */}
          <div style={{ position: "absolute", top: 36, left: "calc(12.5% + 18px)", right: "calc(12.5% + 18px)", height: 1, background: "linear-gradient(90deg,transparent,var(--border-purple),var(--purple),var(--border-purple),transparent)", zIndex: 0 }} />
          {steps.map((s, i) => (
            <FadeEl key={i} delay={i} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 16px" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-primary)", border: "2px solid var(--border-purple)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)", marginBottom: 20, boxShadow: "0 0 20px rgba(124,58,237,0.2)", flexShrink: 0 }}>{s.n}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.desc}</p>
            </FadeEl>
          ))}
        </div>

        {/* Decorative wave */}
        <div style={{ display: "flex", justifyContent: "center", padding: "30px 0 10px", overflow: "hidden" }}>
          <svg viewBox="0 0 900 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 900 }}>
            <path d="M0 30 Q100 10 200 30 Q300 50 400 30 Q500 10 600 30 Q700 50 800 30 Q850 18 900 30" stroke="url(#grad1)" strokeWidth="1.5" fill="none" />
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
                <stop offset="25%" stopColor="#a78bfa" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#7c3aed" stopOpacity="1" />
                <stop offset="75%" stopColor="#a78bfa" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="30" r="3" fill="#a78bfa" opacity="0.6"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" /></circle>
            <circle cx="450" cy="30" r="4" fill="#7c3aed" opacity="0.8"><animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" /></circle>
            <circle cx="700" cy="30" r="3" fill="#a78bfa" opacity="0.6"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" begin="1s" /></circle>
          </svg>
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, desc, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <FadeEl delay={delay} style={{
      background: hov ? "var(--bg-card-hover)" : "var(--bg-card)",
      padding: "36px 30px",
      transition: "background 0.3s",
      cursor: "default",
      position: "relative",
      overflow: "hidden",
    }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: hov ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.12)",
          border: "1px solid var(--border-purple)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
          boxShadow: hov ? "0 0 16px rgba(124,58,237,0.3)" : "none",
          transition: "all 0.3s"
        }}>
          {icon}
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{title}</div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{desc}</p>
      </div>
    </FadeEl>
  );
}

function Features() {
  const features = [
    { title: "Virtual Post-Contrast", desc: "Synthesizes diagnostically accurate contrast-enhanced MRI images purely from pre-contrast input using advanced generative AI models.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
    { title: "Accurate Segmentations", desc: "Automatically segments tumors, edema, necrosis, and enhancing regions with pixel-level precision validated against clinical ground truth.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><circle cx="12" cy="12" r="3" /><path d="M6.3 6.3a8 8 0 000 11.31m11.4 0a8 8 0 000-11.31M3.5 3.5a12 12 0 000 16.97m16.97 0a12 12 0 000-16.97" /></svg> },
    { title: "High Accuracy", desc: "Trained on large-scale multi-site datasets to deliver clinically reliable results with robust performance across different scanner types.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
    { title: "Safe & Accessible", desc: "Eliminates the need for gadolinium-based contrast agents — reducing patient risk, scan preparation time, and overall procedure cost.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
    { title: "Cost & Time Efficient", desc: "Reduces contrast procurement costs, repeat scan rates, and administrative overhead — enabling higher patient throughput for SME clinics.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg> },
    { title: "Seamless Integration", desc: "Integrates directly with existing PACS and RIS infrastructure via HL7/DICOM standards — no workflow disruption required.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /><path d="M9 7h6M9 11h4" /></svg> },
  ];

  return (
    <>
      <WaveDivider flip fill="#020617" />
      <section id="features" style={{ padding: "100px 5%", background: "var(--bg-primary)", position: "relative", zIndex: 1 }}>
        <SectionHead label="Key Features" title="Built for Radiologists.<br/>Powered by AI." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, maxWidth: 1100, margin: "50px auto 0", background: "var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i % 3} />)}
        </div>
      </section>
    </>
  );
}

function UseCases({ onRequestAccess }) {
  const cases = [
    { title: "Neuro-Oncology", desc: "Tumor detection, delineation & longitudinal monitoring" },
    { title: "Metastasis Evaluation", desc: "Identification and staging of brain metastases" },
    { title: "Multiple Sclerosis", desc: "Lesion enhancement and white matter assessment" },
    { title: "Treatment Response", desc: "Quantitative assessment of therapy effectiveness over time" },
    { title: "Emergency Radiology", desc: "Rapid triage without injection delays for time-critical cases" },
  ];

  return (
    <>
      <WaveDivider fill="#090b1a" />
      <section id="use-cases" style={{ padding: "100px 5%", background: "var(--bg-secondary)", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <FadeEl><p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>Use Cases</p></FadeEl>
            <FadeEl delay={1}><h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Designed for Multiple<br />Clinical Applications</h2></FadeEl>
            <FadeEl delay={2}><p style={{ marginTop: 14, fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 520, lineHeight: 1.75 }}>Virtual Gadolinium's AI pipeline addresses the full spectrum of MRI-based diagnostic needs for small and medium radiology practices.</p></FadeEl>
            <ul style={{ listStyle: "none", marginTop: 30, display: "flex", flexDirection: "column", gap: 14 }}>
              {cases.map((c, i) => <UseCaseItem key={i} title={c.title} desc={c.desc} delay={i} />)}
            </ul>
          </div>
          <FadeEl delay={2}>
            <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(79,70,229,0.06) 100%)", border: "1px solid var(--border-purple)", borderRadius: 24, padding: "50px 40px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />
              <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>For SMEs</p>
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 16 }}>Ready to Transform Your MRI Workflow?</h3>
              <p style={{ fontSize: "0.93rem", color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 460 }}>Join hospitals and radiology clinics already using Virtual Gadolinium to unlock faster, safer, more cost-effective MRI imaging — without capital investment in new equipment.</p>
              <div style={{ marginTop: 30 }}>
                <BtnPrimary onRequestAccess={onRequestAccess}>
                  Request Access <ArrowIcon />
                </BtnPrimary>
              </div>
            </div>
          </FadeEl>
        </div>
      </section>
    </>
  );
}

function UseCaseItem({ title, desc, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <FadeEl delay={delay}>
      <li style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "16px 18px", borderRadius: "var(--radius-sm)",
        background: hov ? "var(--accent-dim)" : "var(--bg-card)",
        border: `1px solid ${hov ? "var(--border-purple)" : "var(--border)"}`,
        transition: "all 0.25s", cursor: "default"
      }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(124,58,237,0.2)", border: "1px solid var(--border-purple)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{title}</strong> — {desc}
        </span>
      </li>
    </FadeEl>
  );
}

function StatItem({ count, suffix, prefix = "", label }) {
  const { ref, display } = useCounter(count, suffix, prefix);
  return (
    <div ref={ref} style={{ background: "var(--bg-card)", padding: "28px 32px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
        {prefix}{count === 0 ? "0" : display.replace(prefix, "")}<span style={{ color: "var(--accent)" }}>{count === 0 ? suffix : ""}</span>
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function CtaSection({ onRequestAccess }) {
  return (
    <section id="cta" style={{ padding: "80px 5%", background: "var(--bg-primary)", position: "relative", zIndex: 1 }}>
      {/* Stats */}
      <div style={{ maxWidth: 1100, margin: "0 auto 30px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <StatItem count={98} suffix="%" label="Structural similarity to real contrast scans" />
        <StatItem count={90} prefix="<" suffix="s" label="Average processing time per scan" />
        <StatItem count={0} suffix=" injections" label="Gadolinium contrast agent required" />
      </div>

      {/* Big CTA */}
      <div style={{ maxWidth: 1100, margin: "0 auto", borderRadius: 24, background: "linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(79,70,229,0.06) 100%)", border: "1px solid var(--border-purple)", padding: "70px 60px", display: "grid", gridTemplateColumns: "1fr auto", gap: 50, alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>Get Started Today</p>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 16 }}>Ready to Bring Virtual Contrast to Your Practice?</h2>
          <p style={{ fontSize: "0.93rem", color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 460 }}>Join clinics and research hospitals using Virtual Gadolinium to deliver safer, faster, and more affordable MRI diagnostics. No new equipment. No disruption. Just results.</p>
          <div style={{ marginTop: 30, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <BtnPrimary onRequestAccess={onRequestAccess}>Request Access <ArrowIcon /></BtnPrimary>
            <BtnSecondary href="#how-it-works">Learn More</BtnSecondary>
          </div>
        </div>
        {/* CTA visual — glowing brain image */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <img
            src={brainNetworkImg}
            alt="AI brain network visualization"
            style={{ width: "100%", borderRadius: 16, opacity: 0.85, display: "block" }}
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const productLinks = ["How It Works", "Features", "Use Cases", "Pricing"].map((l, i) => ({ label: l, href: ["#how-it-works", "#features", "#use-cases", "#cta"][i] }));
  const companyLinks = ["About Us", "Contact", "Privacy Policy", "Terms of Use"].map(l => ({ label: l, href: "#footer" }));
  const resourceLinks = ["Documentation", "FAQ", "Research", "Clinical Data"].map(l => ({ label: l, href: "#footer" }));

  return (
    <footer id="footer" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)", padding: "60px 5% 30px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr", gap: 40, paddingBottom: 50, borderBottom: "1px solid var(--border)" }}>
          <div>
            <NavLogo />
            <p style={{ marginTop: 14, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 220 }}>AI-powered MRI enhancement — delivering virtual contrast and segmentation from pre-contrast scans.</p>
          </div>
          <FooterCol title="Product" links={productLinks} />
          <FooterCol title="Company" links={companyLinks} />
          <FooterCol title="Resources" links={resourceLinks} />
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 16 }}>Have questions?</div>
            <a href="mailto:info@virtualgadolinium.com" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.85rem" }}>info@virtualgadolinium.com</a>
            <p style={{ marginTop: 16, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>For research inquiries or<br />partnership opportunities,<br />reach out directly.</p>
          </div>
        </div>
        <div style={{ paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          <span>&copy; 2024 Virtual Gadolinium. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy", "Terms", "Sitemap"].map(l => <a key={l} href="#footer" style={{ color: "var(--text-muted)", textDecoration: "none" }}>{l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 16 }}>{title}</div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map(l => (
          <li key={l.label}>
            <a href={l.href} style={{ textDecoration: "none", fontSize: "0.85rem", color: "var(--text-muted)", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Root App ───
export default function VirtualGadolinium({ onRequestAccess }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = globalStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="vg-noise" style={{ fontFamily: "'Inter',sans-serif", background: "var(--bg-primary)", color: "var(--text-primary)", overflowX: "hidden", lineHeight: 1.6 }}>
      <Navbar onRequestAccess={onRequestAccess} />
      <Hero onRequestAccess={onRequestAccess} />
      <HowItWorks />
      <Features />
      <UseCases onRequestAccess={onRequestAccess} />
      <CtaSection onRequestAccess={onRequestAccess} />
      <Footer />
    </div>
  );
}