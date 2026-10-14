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

/* ---------- Design tokens (match the Virtual Gadolinium hero) ---------- */
const T = {
  text: "#f3f2fb",
  muted: "#a19fbd",
  body: "rgba(243,242,251,0.74)",
  surface: "rgba(255,255,255,0.03)",
  line: "rgba(255,255,255,0.09)",
  violet: "#a78bfa",
  display: "'Bricolage Grotesque', 'Inter', sans-serif",
  sans: "'Inter', sans-serif",
};

function signalToStatus(
  signal: ReasoningCard["signal"],
): ReasoningCard["status"] {
  if (signal === "positive" || signal === "normal") return "completed";
  return "in-progress";
}

function statusLabel(status: ReasoningCard["status"]): string {
  if (status === "completed") return "COMPLETE";
  if (status === "pending") return "PENDING";
  return "IN PROGRESS";
}

function statusBadgeStyle(
  status: ReasoningCard["status"],
): React.CSSProperties {
  if (status === "completed") {
    return {
      color: "#86efac",
      background: "rgba(74,222,128,0.1)",
      border: "1px solid rgba(74,222,128,0.25)",
    };
  }
  if (status === "pending") {
    return {
      color: T.muted,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.12)",
    };
  }
  return {
    color: "#fcd34d",
    background: "rgba(250,204,21,0.1)",
    border: "1px solid rgba(250,204,21,0.25)",
  };
}

function deriveEnergy(card: ReasoningCard): number {
  if (card.energy != null) return card.energy;
  const num = parseFloat(card.value);
  if (!Number.isNaN(num))
    return Math.min(100, Math.max(12, Math.round(num * 8 + 20)));
  if (card.signal === "positive" || card.signal === "normal") return 88;
  if (card.signal === "caution") return 62;
  return 78;
}

interface ExplainabilityFactorCardProps {
  card: ReasoningCard;
  relatedTitles: string[];
}

function ExplainabilityFactorCard({
  card,
  relatedTitles,
}: ExplainabilityFactorCardProps) {
  const accent = card.color || CARD_COLORS[card.id] || "#84cc16";
  const status = card.status || signalToStatus(card.signal);
  const energy = deriveEnergy(card);
  const body = card.content || card.detail;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "20px 22px",
        borderRadius: 14,
        border: `1px solid ${T.line}`,
        background: T.surface,
      }}
    >
      {/* Title + status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accent,
              flexShrink: 0,
            }}
          />
          <h4
            style={{
              margin: 0,
              fontFamily: T.display,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: T.text,
            }}
          >
            {card.title}
          </h4>
        </div>
        <span
          style={{
            flexShrink: 0,
            padding: "4px 10px",
            borderRadius: 999,
            fontFamily: T.sans,
            fontSize: 12,
            fontWeight: 500,
            textTransform: "capitalize",
            ...statusBadgeStyle(status),
          }}
        >
          {statusLabel(status).toLowerCase()}
        </span>
      </div>

      <p
        style={{
          margin: "-6px 0 0 20px",
          fontFamily: T.sans,
          fontSize: 13,
          color: T.muted,
        }}
      >
        {card.subtitle || card.value}
      </p>

      <p
        style={{
          margin: 0,
          fontFamily: T.sans,
          fontSize: 14,
          lineHeight: 1.65,
          color: T.body,
        }}
      >
        {body}
      </p>

      {/* Signal strength */}
      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            fontFamily: T.sans,
            fontSize: 13,
          }}
        >
          <span style={{ color: T.muted }}>Signal strength</span>
          <span
            style={{
              color: T.text,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {energy}%
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: 4,
            borderRadius: 99,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${energy}%`,
              borderRadius: 99,
              background: accent,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Related factors */}
      {relatedTitles.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            paddingTop: 14,
            borderTop: `1px solid ${T.line}`,
          }}
        >
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.muted }}>
            Related
          </span>
          {relatedTitles.map((title) => (
            <span
              key={title}
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                border: `1px solid ${T.line}`,
                fontFamily: T.sans,
                fontSize: 12.5,
                color: T.body,
              }}
            >
              {title}
            </span>
          ))}
        </div>
      )}
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
  const heroAccent = isNormal ? "#4ade80" : "#f87171";

  const titleById = Object.fromEntries(
    reasoning.map((card) => [card.id, card.title]),
  );

  return (
    <div style={{ animation: "fadeSlideUp 0.45s ease both" }}>
      {/* Result */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: 28,
          flexWrap: "wrap",
          padding: "30px 32px",
          marginBottom: 20,
          borderRadius: 18,
          border: `1px solid ${T.line}`,
          background: T.surface,
        }}
      >
        <div style={{ flex: "1 1 360px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${heroBorder}`,
              fontFamily: T.sans,
              fontSize: 13,
              fontWeight: 600,
              color: heroAccent,
              marginBottom: 18,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: heroAccent,
              }}
            />
            {isNormal ? "Normal finding" : "Tumor detected"}
          </span>
          <h3
            style={{
              margin: "0 0 8px",
              fontFamily: T.display,
              fontSize: "clamp(24px, 3.2vw, 32px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: T.text,
            }}
          >
            {prediction.label}
          </h3>
          <p
            style={{
              margin: "0 0 14px",
              fontFamily: T.sans,
              fontSize: 15,
              color: T.muted,
              maxWidth: "52ch",
            }}
          >
            {prediction.subtitle}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: T.sans,
              fontSize: 14,
              lineHeight: 1.7,
              color: T.body,
              maxWidth: "62ch",
            }}
          >
            {prediction.summary}
          </p>
        </div>

        <div
          style={{
            flex: "0 0 auto",
            minWidth: 170,
            alignSelf: "flex-start",
            padding: "18px 22px",
            borderRadius: 14,
            border: `1px solid ${T.line}`,
            background: "rgba(0,0,0,0.22)",
          }}
        >
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.muted }}>
            Confidence
          </div>
          <div
            style={{
              margin: "4px 0 12px",
              fontFamily: T.display,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              color: heroAccent,
            }}
          >
            {prediction.confidence.toFixed(1)}%
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 99,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, prediction.confidence))}%`,
                background: heroAccent,
                borderRadius: 99,
              }}
            />
          </div>
          {prediction.grade && (
            <div
              style={{
                display: "inline-block",
                marginTop: 14,
                padding: "3px 10px",
                borderRadius: 999,
                background: "rgba(250,204,21,0.1)",
                border: "1px solid rgba(250,204,21,0.25)",
                fontFamily: T.sans,
                fontSize: 12.5,
                fontWeight: 500,
                color: "#fde047",
              }}
            >
              {prediction.grade}
            </div>
          )}
        </div>
      </div>

      {/* Reasoning summary */}
      <div
        style={{
          padding: "18px 22px",
          marginBottom: 36,
          borderRadius: 14,
          border: `1px solid ${T.line}`,
          borderLeft: `3px solid ${T.violet}`,
          background: T.surface,
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontFamily: T.sans,
            fontSize: 14,
            fontWeight: 600,
            color: T.violet,
          }}
        >
          Reasoning summary
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: T.sans,
            fontSize: 14.5,
            lineHeight: 1.7,
            color: T.body,
          }}
        >
          {xai_summary.replace(/\*\*/g, "")}
        </p>
      </div>

      {/* Factors */}
      <h4
        style={{
          margin: "0 0 16px",
          fontFamily: T.display,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: T.text,
        }}
      >
        Explainability factors
      </h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
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
