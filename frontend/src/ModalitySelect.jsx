import { useEffect, useState } from "react";

const mriCardImg = "/assets/mri-modality-card.png";
const xrayCardImg = "/assets/xray-modality-card.png";

const pickerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');
  .vg-ms-root *, .vg-ms-root *::before, .vg-ms-root *::after { box-sizing: border-box; }
  .vg-ms-root {
    --bg-primary: transparent;
    --purple: #7c3aed;
    --purple-light: #9d5cf4;
    --accent: #a78bfa;
    --text-primary: #f1f0ff;
    --text-secondary: #9892b8;
    --border: rgba(255,255,255,0.06);
    --border-purple: rgba(124,58,237,0.25);
    --radius: 16px;
  }
  @keyframes vg-ms-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function NavLogo({ onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        margin: 0,
        padding: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        font: "inherit",
        textAlign: "left",
      }}
    >
      <img
        src="/assets/vg-logo-transparent.png"
        alt="Virtual Gadolinium logo"
        width="76"
        height="76"
        style={{ width: 76, height: 76, objectFit: "contain", filter: "brightness(0) invert(1)" }}
      />
      <span
        style={{
          fontFamily: "'Bricolage Grotesque',sans-serif",
          fontSize: "1rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        VIRTUAL <span style={{ color: "var(--accent)" }}>GADOLINIUM</span>
      </span>
    </button>
  );
}

function ModalityCard({ title, subtitle, imageSrc, imageAlt, accent, onChoose, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onChoose}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${hov ? "var(--border-purple)" : "var(--border)"}`,
        borderRadius: 20,
        overflow: "hidden",
        background: hov ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.03)",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        transition: "border 0.25s, background 0.25s, box-shadow 0.25s, transform 0.25s",
        boxShadow: hov ? `0 0 60px rgba(124,58,237,0.22), 0 24px 56px rgba(0,0,0,0.45)` : "0 16px 48px rgba(0,0,0,0.35)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        animation: `vg-ms-in 0.55s ease ${delay}ms both`,
        color: "inherit",
        font: "inherit",
        maxWidth: 420,
        width: "100%",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#090b1a" }}>
        <img
          src={imageSrc}
          alt={imageAlt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: title === "MRI Scan" || title === "X-Ray" ? "contain" : "cover",
            objectPosition: "center",
            display: "block",
            opacity: hov ? 1 : 0.92,
            transition: "opacity 0.25s",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, rgba(2,6,23,0.92) 0%, transparent 55%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: accent,
            background: "rgba(2,6,23,0.75)",
            border: `1px solid ${accent}44`,
            padding: "6px 12px",
            borderRadius: 99,
          }}
        >
          {title === "MRI Scan" ? "MRI modality" : "X-Ray modality"}
        </div>
      </div>
      <div style={{ padding: "22px 24px 26px" }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          {title}
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 16 }}>{subtitle}</p>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#fff",
            background: hov ? "var(--purple-light)" : "var(--purple)",
            padding: "10px 18px",
            borderRadius: 99,
            boxShadow: hov ? "0 0 28px rgba(124,58,237,0.55)" : "0 0 18px rgba(124,58,237,0.35)",
          }}
        >
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
}

/**
 * @param {{ variant: 'overlay' | 'page', onClose: () => void, onSelect: (modality: 'mri' | 'xray') => void }} props
 */
export default function ModalitySelect({ variant = "page", onClose, onSelect }) {
  useEffect(() => {
    const id = "vg-modality-select-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = pickerStyles;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) document.head.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (variant !== "overlay") return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [variant]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shellStyle =
    variant === "overlay"
      ? {
          position: "fixed",
          inset: 0,
          zIndex: 500,
          background: "rgba(2,6,23,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          overflowY: "auto",
        }
      : {
          minHeight: "100vh",
          background: "var(--bg-primary)",
        };

  return (
    <div className="vg-ms-root" style={{ ...shellStyle, fontFamily: "'Inter',sans-serif" }}>
      <div
        style={{
          position: variant === "overlay" ? "sticky" : "relative",
          top: 0,
          zIndex: 2,
          height: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px,5%,48px)",
          borderBottom: "1px solid var(--border)",
          background: variant === "overlay" ? "rgba(2,6,23,0.92)" : "rgba(2,6,23,0.95)",
          backdropFilter: "blur(18px)",
        }}
      >
        <NavLogo onClick={onClose} />
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            padding: "10px 18px",
            borderRadius: 99,
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "border 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-purple)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          {variant === "overlay" ? "Cancel" : "← Back to home"}
        </button>
      </div>

      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: variant === "overlay" ? "48px 24px 64px" : "56px 24px 80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 44, animation: "vg-ms-in 0.5s ease both" }}>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 14,
            }}
          >
            Choose imaging modality
          </p>
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque',sans-serif",
              fontSize: "clamp(1.75rem,4vw,2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Select your <span style={{ color: "var(--accent)" }}>scan type</span>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Our models are trained separately for MRI and X-Ray pathways. Pick the modality that matches your upload so the workspace loads the correct pipeline.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          <ModalityCard
            title="MRI Scan"
            subtitle="Virtual contrast enhancement and brain tumor segmentation from pre-contrast MRI volume or slices — matches our primary BraTS-style workflow."
            imageSrc={mriCardImg}
            imageAlt="Axial brain MRI with tumor segmentation overlay: tumor core, enhancing tumor, and peritumoral edema"
            accent="var(--accent)"
            delay={0}
            onChoose={() => onSelect("mri")}
          />
          <ModalityCard
            title="X-Ray"
            subtitle="Chest and planar X-Ray analysis pathway — tuned for high-contrast 2D radiographs and rapid screening workflows."
            imageSrc={xrayCardImg}
            imageAlt="Lateral skull X-ray with tumor segmentation overlay: tumor core, enhancing tumor, and peritumoral edema"
            accent="#c4b5fd"
            delay={80}
            onChoose={() => onSelect("xray")}
          />
        </div>
      </div>
    </div>
  );
}
