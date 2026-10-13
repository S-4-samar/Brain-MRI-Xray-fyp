import React from "react";

export interface ReasoningCard {
  id: string;
  title: string;
  subtitle?: string;
  value: string;
  signal: "normal" | "positive" | "caution" | "alert";
  status?: "completed" | "in-progress" | "pending";
  energy?: number;
  color?: string;
  interpretation: string;
  content?: string;
  detail: string;
  related_ids?: string[];
}

export interface TumorPrediction {
  status: "normal" | "tumor_detected";
  label: string;
  subtitle: string;
  grade: string | null;
  tumor_type: string;
  confidence: number;
  summary: string;
}

export interface PredictionResult {
  prediction: TumorPrediction;
  segmentation_stats: Record<string, number>;
  reasoning: ReasoningCard[];
  xai_summary: string;
}

const CARD_COLORS: Record<string, string> = {
  burden: "#8b5cf6",
  intensity: "#3b82f6",
  enhancing: "#eab308",
  geometry: "#06b6d4",
  edema: "#10b981",
  core: "#ef4444",
};

const RELATED_FALLBACK: Record<string, string[]> = {
  burden: ["enhancing", "geometry", "edema", "core"],
  intensity: ["burden", "enhancing"],
  enhancing: ["burden", "core", "intensity"],
  geometry: ["burden"],
  edema: ["burden", "core"],
  core: ["edema", "enhancing"],
};

function signalToStatus(signal: ReasoningCard["signal"]): ReasoningCard["status"] {
  if (signal === "positive" || signal === "normal") return "completed";
  return "in-progress";
}

function statusLabel(status: ReasoningCard["status"]): string {
  if (status === "completed") return "COMPLETE";
  if (status === "pending") return "PENDING";
  return "IN PROGRESS";
}

function statusBadgeStyle(status: ReasoningCard["status"]): React.CSSProperties {
  if (status === "completed") {
    return { color: "#fff", background: "#000", border: "1px solid #fff" };
  }
  if (status === "pending") {
    return { color: "#fff", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.5)" };
  }
  return { color: "#000", background: "#fff", border: "1px solid #000" };
}

function deriveEnergy(card: ReasoningCard): number {
  if (card.energy != null) return card.energy;
  const num = parseFloat(card.value);
  if (!Number.isNaN(num)) return Math.min(100, Math.max(12, Math.round(num * 8 + 20)));
  if (card.signal === "positive" || card.signal === "normal") return 88;
  if (card.signal === "caution") return 62;
  return 78;
}

interface ExplainabilityFactorCardProps {
  card: ReasoningCard;
  relatedTitles: string[];
}

function ExplainabilityFactorCard({ card, relatedTitles }: ExplainabilityFactorCardProps) {
  const accent = card.color || CARD_COLORS[card.id] || "#84cc16";
  const status = card.status || signalToStatus(card.signal);
  const energy = deriveEnergy(card);
  const body = card.content || card.detail;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.28)",
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        overflow: "hidden",
        boxShadow: `0 0 0 1px ${accent}30, 0 20px 48px rgba(0,0,0,0.55)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: accent,
          opacity: 0.15,
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "18px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span
            style={{
              display: "inline-block",
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontFamily: "'DM Mono', monospace",
              ...statusBadgeStyle(status),
            }}
          >
            {statusLabel(status)}
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {card.subtitle || card.value}
          </span>
        </div>

        <h4
          style={{
            margin: "12px 0 10px",
            fontSize: 15,
            fontWeight: 600,
            color: "#f1f0ff",
            letterSpacing: "-0.01em",
          }}
        >
          {card.title}
        </h4>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          {body}
        </p>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
              <span style={{ fontSize: 12 }}>⚡</span>
              Signal Strength
            </span>
            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 600, color: "#fff" }}>
              {energy}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 5,
              borderRadius: 99,
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${energy}%`,
                borderRadius: 99,
                background: "linear-gradient(90deg, #3b82f6, #a855f7)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>

        {relatedTitles.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>🔗</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Connected Factors
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {relatedTitles.map((title) => (
                <span
                  key={title}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    height: 24,
                    padding: "0 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  {title}
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>→</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TumorPredictionPanelProps {
  data: PredictionResult;
}

export function TumorPredictionPanel({ data }: TumorPredictionPanelProps) {
  const { prediction, reasoning, xai_summary } = data;
  const isNormal = prediction.status === "normal";

  const heroBorder = isNormal
    ? "rgba(74, 222, 128, 0.4)"
    : "rgba(248, 113, 113, 0.45)";
  const heroGlow = isNormal
    ? "rgba(74, 222, 128, 0.12)"
    : "rgba(248, 113, 113, 0.12)";
  const heroAccent = isNormal ? "#4ade80" : "#f87171";

  const titleById = Object.fromEntries(reasoning.map((card) => [card.id, card.title]));

  return (
    <div style={{ animation: "fadeSlideUp 0.45s ease both" }}>
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          border: `1px solid ${heroBorder}`,
          background: "linear-gradient(135deg, rgba(9,11,26,0.55) 0%, rgba(2,6,23,0.45) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "28px 32px",
          marginBottom: 20,
          boxShadow: `0 0 40px ${heroGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${heroAccent}, transparent)`,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: heroAccent,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {isNormal ? "✓ Normal Finding" : "⚠ Tumor Detected"}
            </p>
            <h3
              style={{
                fontSize: "clamp(22px, 3vw, 28px)",
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: "#f1f0ff",
                letterSpacing: "-0.02em",
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              {prediction.label}
            </h3>
            <p style={{ fontSize: 14, color: "#9892b8", marginBottom: 16, maxWidth: 560 }}>
              {prediction.subtitle}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                maxWidth: 640,
              }}
            >
              {prediction.summary}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "16px 22px",
              borderRadius: 12,
              border: `1px solid ${heroBorder}`,
              background: "rgba(0,0,0,0.25)",
              minWidth: 120,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#5e5880",
              }}
            >
              Confidence
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                color: heroAccent,
                letterSpacing: "-0.02em",
              }}
            >
              {prediction.confidence.toFixed(1)}%
            </span>
            {prediction.grade && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                  color: "#fde047",
                  marginTop: 4,
                }}
              >
                {prediction.grade}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(132, 204, 22, 0.22)",
          background: "rgba(132, 204, 22, 0.05)",
          backdropFilter: "blur(10px)",
          padding: "14px 20px",
          marginBottom: 22,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#84cc16",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          XAI Reasoning Summary
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
          {xai_summary.replace(/\*\*/g, "")}
        </p>
      </div>

      <p
        style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#5e5880",
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        Explainability Factors
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {reasoning.map((card) => {
          const relatedIds = card.related_ids?.length
            ? card.related_ids
            : (RELATED_FALLBACK[card.id] || []).filter((id) => titleById[id]);
          const relatedTitles = relatedIds
            .map((id) => titleById[id])
            .filter(Boolean);

          return (
            <ExplainabilityFactorCard
              key={card.id}
              card={card}
              relatedTitles={relatedTitles}
            />
          );
        })}
      </div>
    </div>
  );
}

export default TumorPredictionPanel;
