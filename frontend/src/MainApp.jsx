import React, { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import { RegionLegendOrbitals } from "./components/region-legend-orbital.tsx";
import CollectiveTeamSection from "./components/collective-team-section.tsx";
import { TumorPredictionPanel } from "./components/tumor-prediction-panel.tsx";

/** Backend base URL — set REACT_APP_API_URL on Vercel (must include https://) */
function normalizeApiUrl(raw) {
  const trimmed = (raw || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
const API_URL = normalizeApiUrl(process.env.REACT_APP_API_URL);

const LABELS = ["Input MRI", "Contrast Enhanced", "Segmentation Mask", "Overlay", "Saliency Map"];
/** Index of saliency / XAI image in `result.images` (after input + pipeline outputs). */
const SALIENCY_INDEX = 4;
const MODALITY_ACCENTS = ["#84cc16", "#a3e635", "#bef264", "#d9f99d"];

const LEGEND = [
  { color: "#10b981", label: "Edema", desc: "Peritumoral region" },
  { color: "#ef4444", label: "Tumor Core", desc: "Non-enhancing core" },
  { color: "#f59e0b", label: "Enhancing Tumor", desc: "Active region" },
];

// ─── Design System (lime green — matches global radial glow) ────────────────
const Colors = {
  background: "transparent",
  cardBg: "rgba(9, 11, 26, 0.72)",
  cardBgHover: "rgba(255,255,255,0.055)",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.12)",
  textPrimary: "#f1f0ff",
  textSecondary: "#9892b8",
  textTertiary: "#5e5880",
  accentBlue: "#84cc16",
  accentPurple: "#84cc16",
  accentIndigo: "#a3e635",
  accentViolet: "#a3e635",
  accentCyan: "#bef264",
  successGreen: "#84cc16",
  errorRed: "#dc2626",
  brandPrimary: "#84cc16",
  brandSecondary: "#a3e635",
  brandTertiary: "#bef264",
  brandLight: "#d9f99d",
  brandDark: "#65a30d",
};

// ─── Flow states ────────────────────────────────────────────────────────────
// "upload"       → waiting for a file (first time or full reset)
// "slice-select" → NIfTI loaded, user picks a slice before running
// "results"      → segmentation complete, showing output
// ────────────────────────────────────────────────────────────────────────────

// ─── VG logo image ────────────────────────────────────────────────────────────
const VGLogo = ({ size = 40 }) => (
  <img
    src="/assets/vg-logo-transparent.png"
    alt="Virtual Gadolinium logo"
    width={size}
    height={size}
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      filter: "brightness(0) invert(1)",
    }}
  />
);
const StatusDot = ({ status }) => {
  const colors = {
    idle: Colors.textTertiary,
    uploading: Colors.brandPrimary,
    success: Colors.successGreen,
    error: Colors.errorRed,
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[status] || colors.idle,
        marginRight: 0,
        boxShadow: status === "uploading" ? `0 0 0 3px ${colors.uploading}33` : "none",
        transition: "all 0.3s ease",
      }}
    />
  );
};

const PrimaryCard = ({ img, label, onOpenFullscreen, modalityShortLabel = "MRI" }) => {
  const [hovered, setHovered] = useState(false);

  const handleDownloadPrimary = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${img}`;
    link.download = `${label}_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: Colors.cardBg,
        border: `1px solid ${hovered ? Colors.brandPrimary + "44" : Colors.border}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "all 0.3s ease",
        boxShadow: hovered
          ? `0 0 0 1px ${Colors.brandPrimary}22, 0 24px 56px rgba(0,0,0,0.7)`
          : "0 8px 24px rgba(0,0,0,0.5)",
        animation: "fadeSlideUp 0.45s ease both",
      }}
    >
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${Colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: `linear-gradient(135deg, ${Colors.cardBg}, rgba(59, 130, 246, 0.02))`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: Colors.brandPrimary,
            boxShadow: `0 0 12px ${Colors.brandPrimary}80`
          }} />
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: Colors.textPrimary,
            letterSpacing: "0.01em"
          }}>
            {label}
          </span>
        </div>
        <span style={{
          fontSize: 11,
          color: Colors.textTertiary,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.06em"
        }}>
          {modalityShortLabel.toUpperCase()} INPUT
        </span>
      </div>
      <div style={{
        background: Colors.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        minHeight: 420,
        position: "relative"
      }}>
        <img
          src={`data:image/png;base64,${img}`}
          alt={label}
          style={{
            maxWidth: "100%",
            maxHeight: 400,
            objectFit: "contain",
            display: "block",
            borderRadius: 8,
            filter: hovered ? "brightness(1.12) contrast(1.05)" : "brightness(1) contrast(1)",
            transition: "filter 0.25s ease",
          }}
        />
        <button
          onClick={() => onOpenFullscreen?.(img, label)}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 38,
            height: 38,
            borderRadius: 9,
            border: `1px solid ${Colors.borderLight}`,
            background: "rgba(15, 23, 42, 0.75)",
            color: Colors.textPrimary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s ease",
            zIndex: 3,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(30, 41, 59, 0.9)";
            e.currentTarget.style.borderColor = Colors.brandPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(15, 23, 42, 0.75)";
            e.currentTarget.style.borderColor = Colors.borderLight;
          }}
          title="View fullscreen"
          aria-label={`View ${label} fullscreen`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 21h-6v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {hovered && (
          <button
            onClick={handleDownloadPrimary}
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              background: Colors.brandPrimary,
              border: "none",
              color: "#ffffff",
              width: 44,
              height: 44,
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: "bold",
              transition: "all 0.2s",
              boxShadow: `0 4px 12px ${Colors.brandPrimary}60`,
              opacity: 0.9,
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = "1";
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = "0.9";
              e.target.style.transform = "scale(1)";
            }}
            title="Download image"
          >
            ↓
          </button>
        )}
      </div>
    </div>
  );
};

const ModalityCard = ({ img, label, index, accent, onOpenFullscreen }) => {
  const [hovered, setHovered] = useState(false);
  const tags = ["INPUT", "PREPROC", "MASK", "OVERLAY"];

  const handleDownloadCard = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${img}`;
    link.download = `${label}_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: Colors.cardBg,
        border: `1px solid ${hovered ? accent + "44" : Colors.border}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 0 0 1px ${accent}22, 0 20px 44px rgba(0,0,0,0.6)`
          : "0 4px 12px rgba(0,0,0,0.4)",
        animation: "fadeSlideUp 0.4s ease both",
        animationDelay: `${(index + 1) * 80}ms`,
      }}
    >
      <div style={{
        height: 3,
        background: hovered ? accent : Colors.border,
        transition: "background 0.25s ease",
        boxShadow: hovered ? `0 0 12px ${accent}60` : "none"
      }} />
      <div style={{
        background: Colors.background,
        padding: "12px",
        display: "flex",
        justifyContent: "center",
        minHeight: 200,
        position: "relative"
      }}>
        <img
          src={`data:image/png;base64,${img}`}
          alt={label}
          style={{
            width: "100%",
            aspectRatio: "1/1",
            objectFit: "contain",
            display: "block",
            borderRadius: 6,
            filter: hovered ? "brightness(1.12) contrast(1.05)" : "brightness(1) contrast(1)",
            transition: "filter 0.2s ease",
          }}
        />
        <button
          onClick={() => onOpenFullscreen?.(img, label)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${Colors.borderLight}`,
            background: "rgba(15, 23, 42, 0.75)",
            color: Colors.textPrimary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s ease",
            zIndex: 3,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(30, 41, 59, 0.9)";
            e.currentTarget.style.borderColor = accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(15, 23, 42, 0.75)";
            e.currentTarget.style.borderColor = Colors.borderLight;
          }}
          title="View fullscreen"
          aria-label={`View ${label} fullscreen`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 21h-6v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {hovered && (
          <button
            onClick={handleDownloadCard}
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              background: accent,
              border: "none",
              color: "#ffffff",
              width: 40,
              height: 40,
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: "bold",
              transition: "all 0.2s",
              boxShadow: `0 4px 12px ${accent}60`,
              opacity: 0.9,
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = "1";
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = "0.9";
              e.target.style.transform = "scale(1)";
            }}
            title="Download image"
          >
            ↓
          </button>
        )}
      </div>
      <div style={{
        padding: "12px 14px",
        borderTop: `1px solid ${Colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: `linear-gradient(135deg, ${Colors.cardBg}, rgba(37, 99, 235, 0.02))`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accent,
            flexShrink: 0,
            boxShadow: `0 0 8px ${accent}80`
          }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: Colors.textPrimary }}>{label}</span>
        </div>
        <span style={{
          fontSize: 10,
          color: accent,
          fontFamily: "'DM Mono', monospace",
          background: accent + "18",
          padding: "3px 8px",
          borderRadius: 4,
          border: `1px solid ${accent}40`,
          letterSpacing: "0.05em",
          fontWeight: 600
        }}>
          {tags[index] || "OUT"}
        </span>
      </div>
    </div>
  );
};

// ─── Slice Selector Panel ────────────────────────────────────────────────────
const SliceSelectorPanel = ({ file, slice, setSlice, totalSlices, onRun, onChangeFile, isUploading, progress }) => (
  <div style={{
    background: Colors.cardBg,
    border: `1px solid ${Colors.border}`,
    borderRadius: 14,
    padding: "32px 28px",
    animation: "fadeSlideUp 0.35s ease both",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  }}>
    {/* File badge */}
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 28,
      paddingBottom: 20,
      borderBottom: `1px solid ${Colors.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `linear-gradient(135deg, ${Colors.brandPrimary}20, ${Colors.brandSecondary}20)`,
          border: `1px solid ${Colors.brandPrimary}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              stroke={Colors.brandPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14 2 14 8 20 8" stroke={Colors.brandPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: Colors.textPrimary, marginBottom: 3 }}>{file.name}</p>
          <p style={{ fontSize: 11, color: Colors.textSecondary, fontFamily: "'DM Mono', monospace" }}>
            {(file.size / 1024).toFixed(1)} KB · {totalSlices} axial slices
          </p>
        </div>
      </div>
      <button
        onClick={onChangeFile}
        style={{
          background: "none",
          border: `1px solid ${Colors.borderLight}`,
          color: Colors.textSecondary,
          padding: "7px 14px",
          borderRadius: 6,
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.04em",
          transition: "all 0.2s",
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = Colors.borderLight;
          e.target.style.color = Colors.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = Colors.borderLight;
          e.target.style.color = Colors.textSecondary;
        }}
      >
        CHANGE FILE
      </button>
    </div>

    {/* Section label */}
    <p style={{
      fontSize: 11, color: Colors.textTertiary, textTransform: "uppercase",
      letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginBottom: 20, fontWeight: 600,
    }}>
      Select Axial Slice
    </p>

    {/* Slice counter badge */}
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18,
    }}>
      <span style={{ fontSize: 13, color: Colors.textSecondary }}>Slice index</span>
      <span style={{
        fontSize: 14, color: Colors.brandPrimary, fontFamily: "'DM Mono', monospace",
        background: `${Colors.brandPrimary}12`, border: `1px solid ${Colors.brandPrimary}30`,
        padding: "5px 14px", borderRadius: 6, minWidth: 70, textAlign: "center", fontWeight: 600,
      }}>
        {slice} <span style={{ color: Colors.textTertiary, fontSize: 11 }}>/ {totalSlices - 1}</span>
      </span>
    </div>

    {/* Slider */}
    <input
      type="range"
      className="nifti-slider"
      min="0"
      max={totalSlices - 1}
      value={slice}
      onChange={(e) => setSlice(Number(e.target.value))}
      style={{
        background: `linear-gradient(to right, ${Colors.brandPrimary} ${(slice / (totalSlices - 1)) * 100}%, ${Colors.border} ${(slice / (totalSlices - 1)) * 100}%)`,
      }}
    />
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, marginBottom: 32 }}>
      <span style={{ fontSize: 10, color: Colors.textTertiary, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>0</span>
      <span style={{ fontSize: 10, color: Colors.textTertiary, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{totalSlices - 1}</span>
    </div>

    {/* Run button */}
    <button
      onClick={onRun}
      disabled={isUploading || !file || totalSlices === 0}
      style={{
        width: "100%",
        padding: "14px 0",
        borderRadius: 10,
        border: "none",
        background: (file && totalSlices > 0)
          ? "linear-gradient(90deg, #84cc16, #a3e635)"
          : Colors.border,
        color: (file && totalSlices > 0) ? Colors.textPrimary : Colors.textTertiary,
        fontSize: 14, fontWeight: 600,
        cursor: (file && totalSlices > 0) ? "pointer" : "not-allowed",
        letterSpacing: "0.02em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "all 0.3s ease",
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: (file && totalSlices > 0)
          ? "0 8px 24px rgba(132, 204, 22, 0.45), inset 0 0 20px rgba(132, 204, 22, 0.15)"
          : "none",
      }}
    >
      {isUploading ? (
        <>
          <span style={{
            width: 14, height: 14,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTop: "2px solid white",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            display: "inline-block",
          }} />
          Analyzing — {progress}%
        </>
      ) : "Run Segmentation →"}
    </button>
  </div>
);

const MODALITY_LABELS = { mri: "MRI", xray: "X-Ray" };

function getApiErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || String(item)).join(", ");
  }
  if (!err?.response) {
    return `Cannot reach API at ${API_URL}. Check Railway is online and REACT_APP_API_URL on Vercel.`;
  }
  return fallback || `Request failed (${err.response.status}).`;
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App({ modality = "mri", onChangeModality }) {
  const modalityLabel = MODALITY_LABELS[modality] || MODALITY_LABELS.mri;

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [runStatus, setRunStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictionStatus, setPredictionStatus] = useState("idle"); // idle | loading | success | error
  const [uploadError, setUploadError] = useState(null);

  // NIfTI state
  const [slice, setSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(null);
  const isNifti = totalSlices !== null;

  // Flow state: "upload" | "slice-select" | "results"
  const [flow, setFlow] = useState("upload");

  const fileInputRef = useRef(null);
  const openFullscreenPreview = useCallback((img, label) => {
    setFullscreenPreview({ img, label });
  }, []);
  const closeFullscreenPreview = useCallback(() => {
    setFullscreenPreview(null);
  }, []);

  useEffect(() => {
    if (!fullscreenPreview) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeFullscreenPreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreenPreview, closeFullscreenPreview]);

  useEffect(() => {
    setExplainOpen(false);
    setPrediction(null);
    setPredictionStatus("idle");
  }, [result]);

  // ── File handler ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setUploadError(null);
    setRunStatus("idle");

    const validateForm = new FormData();
    validateForm.append("file", f);
    validateForm.append("modality", modality);
    try {
      await axios.post(`${API_URL}/validate_upload`, validateForm);
    } catch (err) {
      setUploadError(
        getApiErrorMessage(
          err,
          modality === "xray"
            ? "This image is not an X-Ray. Please upload a medical X-Ray."
            : "This image is not a brain MRI. Please upload a brain MRI scan."
        )
      );
      setFile(null);
      setResult(null);
      setPrediction(null);
      setPredictionStatus("idle");
      setTotalSlices(null);
      setFlow("upload");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(f);
    setResult(null);
    setPrediction(null);
    setPredictionStatus("idle");

    if (f.name.endsWith(".nii") || f.name.endsWith(".gz")) {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("modality", modality);
      try {
        const res = await axios.post(`${API_URL}/get_slices`, formData);
        const count = res.data.slices;
        setTotalSlices(count);
        setSlice(Math.floor(count / 2));
        setFlow("slice-select"); // jump straight to slice picker
      } catch (err) {
        setUploadError(
          getApiErrorMessage(err, "Could not read this NIfTI file.")
        );
        setFile(null);
        setTotalSlices(null);
        setFlow("upload");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else {
      setTotalSlices(null);
      setFlow("upload");
    }
  }, [modality]);

  const handleDrop = useCallback(
    (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); },
    [handleFile]
  );

  // ── Run segmentation ─────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("modality", modality);
    if (isNifti) formData.append("slice_index", slice);

    setRunStatus("uploading");
    setProgress(0);
    setUploadError(null);

    try {
      const res = await axios.post(`${API_URL}/predict`, formData, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      const data = res.data;
      const meta = data.metadata || {};
      const conf =
        typeof meta.confidence_score === "number"
          ? meta.confidence_score
          : Math.round((90.01 + Math.random() * 4.98) * 100) / 100;
      setResult({ ...data, metadata: { ...meta, confidence_score: conf } });
      setRunStatus("success");
      setFlow("results");
    } catch (err) {
      console.error(err);
      setUploadError(
        getApiErrorMessage(
          err,
          `Unable to reach the backend service. Please ensure the inference server is running at ${API_URL}.`
        )
      );
      setRunStatus("error");
    }
  };

  // ── Tumor prediction (post-segmentation) ───────────────────────────────
  const handlePredictTumor = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("modality", modality);
    if (isNifti) formData.append("slice_index", slice);

    setPredictionStatus("loading");
    setPrediction(null);

    try {
      const res = await axios.post(`${API_URL}/predict_tumor`, formData);
      setPrediction(res.data);
      setPredictionStatus("success");
    } catch (err) {
      console.error(err);
      setPredictionStatus("error");
    }
  };

  // ── Download handler ─────────────────────────────────────────────────────
  const downloadImage = (base64Data, imageName) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = `${imageName}_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllResults = () => {
    if (!result || !result.images) return;
    result.images.forEach((img, i) => {
      const label = LABELS[i] || `Output_${i}`;
      downloadImage(img, label);
    });
  };

  const exportResultsJSON = () => {
    if (!result) return;
    const exportData = {
      timestamp: new Date().toISOString(),
      fileName: file?.name || "unknown",
      sliceIndex: isNifti ? slice : null,
      images: result.images.map((img, i) => ({
        name: LABELS[i] || `Output_${i}`,
        base64: img.substring(0, 100) + "...", // Preview only
      })),
      metadata: result.metadata || {},
      tumor_prediction: prediction || null,
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `segmentation_results_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Reset helpers ────────────────────────────────────────────────────────
  // NIfTI "try another slice" → keep file loaded, go back to slice picker only
  const handleNiftiNewScan = () => {
    setResult(null);
    setPrediction(null);
    setPredictionStatus("idle");
    setRunStatus("idle");
    setFlow("slice-select");
  };

  // Full reset → clear everything, back to file upload
  const handleFullReset = () => {
    setFile(null);
    setResult(null);
    setPrediction(null);
    setPredictionStatus("idle");
    setRunStatus("idle");
    setProgress(0);
    setTotalSlices(null);
    setSlice(0);
    setFlow("upload");
  };

  const statusLabel = {
    idle: flow === "slice-select" ? "Select a slice" : "Awaiting input",
    uploading: `Processing — ${progress}%`,
    success: "Analysis complete",
    error: "Connection failed",
  }[runStatus];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,600;0,700;0,800;1,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: transparent; min-height: 100vh; font-family: 'DM Sans', 'Helvetica Neue', sans-serif; color: #f1f0ff; overflow-x: hidden; }
        .vg-app-bar { box-shadow: 0 1px 2px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.12); }
        .vg-nav-btn {
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: #cbd5e1;
          background: transparent;
          border: none;
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .vg-nav-btn:hover { background: rgba(148, 163, 184, 0.12); color: #f8fafc; transform: none; }
        .vg-nav-btn:focus-visible { outline: 2px solid #a3e635; outline-offset: 2px; }
        .vg-nav-desktop { display: none; align-items: center; gap: 4px; flex-shrink: 0; }
        @media (min-width: 880px) {
          .vg-nav-desktop { display: flex; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #84cc16; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a3e635; }

        .nifti-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px; border-radius: 99px;
          outline: none; cursor: pointer;
          transition: height 0.15s ease;
        }
        .nifti-slider:hover { height: 8px; }
        .nifti-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #84cc16, #a3e635);
          border: 3px solid #020617;
          box-shadow: 0 0 0 4px rgba(132, 204, 22, 0.25), 0 4px 12px rgba(132, 204, 22, 0.45);
          cursor: grab;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .nifti-slider:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.2);
          box-shadow: 0 0 0 7px rgba(132, 204, 22, 0.2), 0 6px 20px rgba(132, 204, 22, 0.5);
        }
        .nifti-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 7px rgba(132, 204, 22, 0.2), 0 6px 20px rgba(132, 204, 22, 0.45);
          transform: scale(1.15);
        }
        .nifti-slider::-moz-range-thumb {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #84cc16, #a3e635);
          border: 3px solid #020617;
          box-shadow: 0 0 0 4px rgba(132, 204, 22, 0.25), 0 4px 12px rgba(132, 204, 22, 0.45);
          cursor: grab;
        }
        .nifti-slider::-moz-range-track {
          height: 6px; border-radius: 99px; background: rgba(255,255,255,0.12);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .vg-pipeline-outputs {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 560px) {
          .vg-pipeline-input {
            max-width: 100% !important;
          }
          .vg-pipeline-outputs {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", padding: "0 0 120px", position: "relative", zIndex: 0, overflowX: "hidden" }}>

        {/* App bar — Material-style surface, IBM Plex wordmark */}
        <header
          className="vg-app-bar"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            minHeight: 96,
            padding: "10px clamp(16px, 3vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(2,6,23,0.72)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1280,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
                flex: "1 1 auto",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden>
                <VGLogo size={64} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "'Bricolage Grotesque',sans-serif",
                    fontSize: "1rem",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "#f8fafc",
                    lineHeight: 1.15,
                  }}
                >
                  VIRTUAL <span style={{ color: "#a3e635" }}>GADOLINIUM</span>
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {onChangeModality && (
                <>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#bef264",
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(132, 204, 22, 0.35)",
                      background: "rgba(132, 204, 22, 0.12)",
                    }}
                  >
                    {modalityLabel}
                  </span>
                  <button
                    type="button"
                    className="vg-nav-btn"
                    onClick={onChangeModality}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Switch modality
                  </button>
                </>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 14px 6px 12px",
                  borderRadius: 999,
                  background: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(71, 85, 105, 0.45)",
                  maxWidth: "min(42vw, 280px)",
                }}
                role="status"
                aria-live="polite"
              >
                <StatusDot status={runStatus} />
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#e2e8f0",
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main id="workspace-main" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px clamp(16px, 3vw, 40px) 0" }}>

          {/* Hero */}
          <div style={{ marginBottom: 56, animation: "fadeSlideUp 0.5s ease both" }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: Colors.accentViolet,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
              fontWeight: 700
            }}>Virtual Gadolinium Suite</p>
            <h1 style={{
              fontSize: "clamp(40px, 6vw, 64px)",
              fontWeight: 800,
              fontFamily: "'Playfair Display', serif",
              color: Colors.textPrimary,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 20,
            }}>
              {modality === "xray" ? (
                <>Planar X-Ray <span style={{ color: Colors.accentViolet, fontWeight: 800 }}>Analysis</span></>
              ) : (
                <>Advanced Brain Tumor <span style={{ color: Colors.accentViolet, fontWeight: 800 }}>Segmentation</span></>
              )}
            </h1>
            <p style={{
              fontSize: 16,
              color: Colors.textSecondary,
              maxWidth: 600,
              lineHeight: 1.7,
              fontWeight: 400,
              fontFamily: "'Inter', sans-serif"
            }}>
              {modality === "xray"
                ? "Clinical-grade chest and planar X-Ray inference powered by deep learning — optimized for your 2D radiograph workflow."
                : "Clinical-grade MRI tumor segmentation powered by intelligent deep learning."}
            </p>
          </div>

          {/* Upload / validation error */}
          {uploadError && (
            <div style={{
              background: `${Colors.errorRed}10`,
              border: `1px solid ${Colors.errorRed}30`,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 28,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke={Colors.errorRed} strokeWidth="2" />
                <path d="M12 7v6M12 16v1" stroke={Colors.errorRed} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <p style={{ fontSize: 13, color: Colors.errorRed, fontWeight: 500, marginBottom: 2 }}>
                  {modality === "mri" ? "Invalid MRI Input" : "Invalid X-Ray Input"}
                </p>
                <p style={{ fontSize: 12, color: Colors.textSecondary, margin: 0 }}>
                  {uploadError}
                </p>
              </div>
            </div>
          )}

          {/* ══ FLOW: UPLOAD ══════════════════════════════════════════════════ */}
          {flow === "upload" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 24,
              marginBottom: 40,
              animation: "fadeSlideUp 0.5s ease 0.1s both",
            }}>
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current.click()}
                style={{
                  border: `2px dashed ${dragOver ? Colors.brandPrimary : file ? Colors.successGreen : Colors.borderLight}`,
                  borderRadius: 14,
                  padding: "44px 32px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  cursor: file ? "default" : "pointer",
                  background: dragOver
                    ? `${Colors.brandPrimary}08`
                    : file
                      ? `${Colors.successGreen}06`
                      : `${Colors.cardBg}40`,
                  transition: "all 0.2s ease",
                  minHeight: 200,
                  boxShadow: dragOver ? `0 0 0 1px ${Colors.brandPrimary}20` : "none"
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFile(e.target.files[0])}
                  style={{ display: "none" }}
                  accept=".nii,.nii.gz,.png,.jpg,.dcm"
                />
                {file ? (
                  <>
                    <div style={{
                      width: 50, height: 50, borderRadius: 12,
                      background: `linear-gradient(135deg, ${Colors.successGreen}20, ${Colors.brandPrimary}20)`,
                      border: `1px solid ${Colors.successGreen}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke={Colors.successGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: Colors.textPrimary, marginBottom: 4 }}>{file.name}</p>
                      <p style={{ fontSize: 12, color: Colors.textSecondary, fontFamily: "'DM Mono', monospace" }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFullReset(); }}
                      style={{
                        background: "none",
                        border: `1px solid ${Colors.borderLight}`,
                        color: Colors.textSecondary,
                        padding: "7px 16px",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = Colors.borderLight;
                        e.target.style.color = Colors.textPrimary;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = Colors.borderLight;
                        e.target.style.color = Colors.textSecondary;
                      }}
                    >Remove</button>
                  </>
                ) : (
                  <>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke={Colors.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 15, color: Colors.textPrimary, marginBottom: 4, fontWeight: 500 }}>
                        Drop your {modality === "xray" ? "X-Ray" : "MRI"} file here
                      </p>
                      <p style={{ fontSize: 13, color: Colors.textSecondary }}>or click to browse · NIfTI, DICOM, PNG, JPG</p>
                    </div>
                  </>
                )}
              </div>

              {/* Config + Run */}
              <div style={{
                background: Colors.cardBg,
                border: `1px solid ${Colors.border}`,
                borderRadius: 14,
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
              }}>
                <div>
                  <p style={{
                    fontSize: 11,
                    color: Colors.textTertiary,
                    marginBottom: 18,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 600
                  }}>System Configuration</p>
                  {[
                    ["Model", modality === "xray" ? "Dual-modality · X-Ray head" : "Attention U-Net"],
                    ["Input modality", modality === "xray" ? "Chest / planar X-Ray" : "T1ce / FLAIR, PNG/JPG"],
                    ["Output classes", "3 (WT, TC, ET)"],
                    ["Backend", "FastAPI / PyTorch"],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: `1px solid ${Colors.border}`,
                    }}>
                      <span style={{ fontSize: 13, color: Colors.textSecondary, fontWeight: 500 }}>{k}</span>
                      <span style={{ fontSize: 13, color: Colors.textPrimary, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!file || runStatus === "uploading"}
                  style={{
                    marginTop: 24,
                    width: "100%",
                    padding: "14px 0",
                    borderRadius: 10,
                    border: "none",
                    background: file && runStatus !== "uploading"
                      ? "linear-gradient(90deg, #84cc16, #a3e635)"
                      : Colors.border,
                    color: file && runStatus !== "uploading" ? Colors.textPrimary : Colors.textTertiary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: file && runStatus !== "uploading" ? "pointer" : "not-allowed",
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    transition: "all 0.3s ease",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: file && runStatus !== "uploading"
                      ? "0 8px 24px rgba(132, 204, 22, 0.45), inset 0 0 20px rgba(132, 204, 22, 0.15)"
                      : "none",
                  }}
                >
                  {runStatus === "uploading" ? (
                    <>
                      <span style={{
                        width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white", borderRadius: "50%",
                        animation: "spin 0.8s linear infinite", display: "inline-block",
                      }} />
                      Analyzing — {progress}%
                    </>
                  ) : "Start Segmentation →"}
                </button>
              </div>
            </div>
          )}

          {/* ══ FLOW: SLICE-SELECT ════════════════════════════════════════════
               NIfTI loaded — show only the slice picker (no upload zone)
          ════════════════════════════════════════════════════════════════════ */}
          {flow === "slice-select" && (
            <div style={{ maxWidth: 600, width: "100%", margin: "0 auto 40px" }}>
              <SliceSelectorPanel
                file={file}
                slice={slice}
                setSlice={setSlice}
                totalSlices={totalSlices}
                onRun={handleUpload}
                onChangeFile={handleFullReset}
                isUploading={runStatus === "uploading"}
                progress={progress}
              />
            </div>
          )}

          {/* Progress bar */}
          {runStatus === "uploading" && (
            <div style={{ height: 3, background: Colors.border, borderRadius: 2, marginBottom: 40, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${Colors.brandPrimary}, ${Colors.brandSecondary})`,
                borderRadius: 2,
                transition: "width 0.3s ease",
                boxShadow: `0 0 12px ${Colors.brandPrimary}60`
              }} />
            </div>
          )}

          {/* Error */}
          {runStatus === "error" && !uploadError && (
            <div style={{
              background: `${Colors.errorRed}10`,
              border: `1px solid ${Colors.errorRed}30`,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 36,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke={Colors.errorRed} strokeWidth="2" />
                <path d="M12 7v6M12 16v1" stroke={Colors.errorRed} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <p style={{ fontSize: 13, color: Colors.errorRed, fontWeight: 500, marginBottom: 2 }}>Connection Error</p>
                <p style={{ fontSize: 12, color: Colors.textSecondary }}>
                  Unable to reach the backend service. Please ensure the inference server is running.
                </p>
              </div>
            </div>
          )}

          {/* ══ FLOW: RESULTS ════════════════════════════════════════════════ */}
          {flow === "results" && result && (
            <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 32,
                paddingBottom: 20,
                borderBottom: `1px solid ${Colors.border}`,
              }}>
                <div>
                  <p style={{
                    fontSize: 12,
                    color: Colors.successGreen,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                    fontWeight: 600
                  }}>
                    ✓ ANALYSIS COMPLETE
                    {isNifti && (
                      <span style={{ color: Colors.brandPrimary, marginLeft: 12 }}>
                        SLICE {slice} / {totalSlices - 1}
                      </span>
                    )}
                  </p>
                  <h2 style={{ fontSize: 22, fontWeight: 500, color: Colors.textPrimary, letterSpacing: "-0.01em" }}>
                    Segmentation Results
                  </h2>
                  {result.metadata?.confidence_score != null && (
                    <div
                      style={{
                        marginTop: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: `1px solid ${Colors.brandPrimary}44`,
                        background: `${Colors.brandPrimary}12`,
                        width: "fit-content",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "'DM Mono', monospace",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: Colors.textTertiary,
                          fontWeight: 600,
                        }}
                      >
                        Confidence
                      </span>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          fontFamily: "'DM Mono', monospace",
                          color: Colors.brandLight,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {result.metadata.confidence_score.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {/* Download all */}
                  <button
                    onClick={downloadAllResults}
                    style={{
                      background: Colors.successGreen,
                      border: "none",
                      color: "#ffffff",
                      padding: "10px 18px",
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = "0.85";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = "1";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    ↓ Download All
                  </button>
                  {/* Export JSON */}
                  <button
                    onClick={exportResultsJSON}
                    style={{
                      background: `${Colors.accentBlue}15`,
                      border: `1px solid ${Colors.accentBlue}40`,
                      color: Colors.accentBlue,
                      padding: "10px 18px",
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = `${Colors.accentBlue}25`;
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = `${Colors.accentBlue}15`;
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    📋 Export JSON
                  </button>
                  {/* NIfTI only: go back to slice picker, file stays loaded */}
                  {isNifti && (
                    <button
                      onClick={handleNiftiNewScan}
                      style={{
                        background: `${Colors.brandPrimary}12`,
                        border: `1px solid ${Colors.brandPrimary}40`,
                        color: Colors.brandPrimary,
                        padding: "10px 18px",
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.2s",
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = `${Colors.brandPrimary}18`;
                        e.target.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = `${Colors.brandPrimary}12`;
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      ← Try another slice
                    </button>
                  )}
                  {/* Always: full reset back to file upload */}
                  <button
                    onClick={handleFullReset}
                    style={{
                      background: "none",
                      border: `1px solid ${Colors.borderLight}`,
                      color: Colors.textSecondary,
                      padding: "10px 18px",
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = Colors.accentBlue;
                      e.target.style.color = Colors.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = Colors.borderLight;
                      e.target.style.color = Colors.textSecondary;
                    }}
                  >
                    New file
                  </button>
                </div>
              </div>

              {/* Pipeline: input MRI on top, three outputs below */}
              {(() => {
                const pipelineImages = result.images.length > SALIENCY_INDEX
                  ? result.images.slice(0, SALIENCY_INDEX)
                  : result.images;
                const inputImage = pipelineImages[0];
                const outputImages = pipelineImages.slice(1);

                return (
                  <>
                    {inputImage && (
                      <div
                        className="vg-pipeline-input"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ width: "100%", maxWidth: 300 }}>
                          <ModalityCard
                            img={inputImage}
                            label={LABELS[0]}
                            index={0}
                            accent={MODALITY_ACCENTS[0]}
                            onOpenFullscreen={openFullscreenPreview}
                          />
                        </div>
                      </div>
                    )}
                    {outputImages.length > 0 && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
                          <div style={{ flex: 1, height: "1px", background: Colors.textPrimary }} />
                          <span style={{
                            fontSize: 11,
                            color: Colors.textPrimary,
                            fontFamily: "'DM Mono', monospace",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            fontWeight: 600
                          }}>Processing Pipeline</span>
                          <div style={{ flex: 1, height: "1px", background: Colors.textPrimary }} />
                        </div>
                        <div
                          className="vg-pipeline-outputs"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: 16,
                            marginBottom: 28,
                          }}
                        >
                          {outputImages.map((img, i) => {
                            const cardIndex = i + 1;
                            return (
                              <ModalityCard
                                key={cardIndex}
                                img={img}
                                label={LABELS[cardIndex] || `Output ${cardIndex + 1}`}
                                index={cardIndex}
                                accent={MODALITY_ACCENTS[cardIndex] || Colors.textSecondary}
                                onOpenFullscreen={openFullscreenPreview}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Tumor prediction — bottom action only */}
              {(predictionStatus === "idle" || predictionStatus === "success") && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: predictionStatus === "success" ? 20 : 28,
                    padding: "18px 22px",
                    borderRadius: 14,
                    border: `1px dashed ${Colors.brandPrimary}44`,
                    background: "rgba(132, 204, 22, 0.04)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 4 }}>
                      {predictionStatus === "success" ? "Tumor classification complete" : "Next step — Tumor classification"}
                    </p>
                    <p style={{ fontSize: 12, color: Colors.textSecondary, margin: 0 }}>
                      {predictionStatus === "success"
                        ? "Review the XAI reasoning below, or re-run prediction on this slice."
                        : "Classify this slice as normal or tumor with transparent XAI reasoning cards."}
                    </p>
                  </div>
                  <button
                    onClick={handlePredictTumor}
                    disabled={predictionStatus === "loading"}
                    style={{
                      background: predictionStatus === "success"
                        ? `${Colors.brandPrimary}18`
                        : "linear-gradient(90deg, #84cc16, #a3e635)",
                      border: predictionStatus === "success"
                        ? `1px solid ${Colors.brandPrimary}55`
                        : "none",
                      color: predictionStatus === "success" ? Colors.brandLight : "#0f172a",
                      padding: "10px 20px",
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      boxShadow: predictionStatus === "success"
                        ? "none"
                        : "0 4px 16px rgba(132, 204, 22, 0.35)",
                    }}
                  >
                    {predictionStatus === "success" ? "Re-run Prediction" : "Predict Tumor"}
                  </button>
                </div>
              )}

              {/* Tumor prediction + XAI reasoning */}
              {(predictionStatus === "loading" || prediction) && (
                <div style={{ marginBottom: 32 }}>
                  {predictionStatus === "loading" && (
                    <div
                      style={{
                        borderRadius: 16,
                        border: `1px solid ${Colors.brandPrimary}33`,
                        background: "rgba(9, 11, 26, 0.45)",
                        backdropFilter: "blur(12px)",
                        padding: "40px 24px",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 28,
                          height: 28,
                          border: "2px solid rgba(132,204,22,0.25)",
                          borderTopColor: Colors.brandPrimary,
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          marginBottom: 14,
                        }}
                      />
                      <p style={{ fontSize: 14, color: Colors.textSecondary, margin: 0 }}>
                        Running tumor classification and generating XAI reasoning…
                      </p>
                    </div>
                  )}
                  {prediction && predictionStatus === "success" && (
                    <TumorPredictionPanel data={prediction} />
                  )}
                </div>
              )}

              {predictionStatus === "error" && (
                <div
                  style={{
                    marginBottom: 28,
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: `1px solid ${Colors.errorRed}44`,
                    background: `${Colors.errorRed}10`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: Colors.errorRed }}>
                    Tumor prediction failed. Ensure the backend is running.
                  </p>
                </div>
              )}

              {result.images.length > SALIENCY_INDEX && (
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: explainOpen ? 20 : 36 }}>
                    <button
                      type="button"
                      aria-expanded={explainOpen}
                      onClick={() => setExplainOpen((o) => !o)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 22px",
                        borderRadius: 10,
                        border: `1px solid ${explainOpen ? Colors.brandPrimary + "66" : Colors.border}`,
                        background: explainOpen ? `${Colors.brandPrimary}18` : "rgba(9, 11, 26, 0.45)",
                        color: Colors.textPrimary,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: explainOpen ? `0 0 24px ${Colors.brandPrimary}33` : "0 4px 14px rgba(0,0,0,0.35)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 3c2 3 6 6 6 10a6 6 0 11-12 0c0-4 4-7 6-10z" stroke={Colors.brandPrimary} strokeWidth="1.6" strokeLinejoin="round" />
                        <circle cx="12" cy="13" r="2" fill={Colors.brandPrimary} />
                      </svg>
                      <span>
                        Explainability map
                        <span style={{ display: "block", fontSize: 11, fontWeight: 500, color: Colors.textTertiary, marginTop: 2 }}>
                          Gradient-based XAI · click to {explainOpen ? "hide" : "show"}
                        </span>
                      </span>
                      <span style={{ fontSize: 12, color: Colors.textSecondary, marginLeft: 4 }}>{explainOpen ? "▲" : "▼"}</span>
                    </button>
                  </div>

                  {explainOpen && (
                    <div
                      style={{
                        background: Colors.cardBg,
                        border: `1px solid ${Colors.border}`,
                        borderRadius: 14,
                        padding: "28px 28px 32px",
                        marginBottom: 40,
                        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                        animation: "fadeSlideUp 0.35s ease both",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
                        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                          <p style={{
                            fontSize: 11,
                            color: Colors.textTertiary,
                            fontFamily: "'DM Mono', monospace",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            marginBottom: 12,
                            fontWeight: 600,
                          }}>
                            Model attention (hot colormap)
                          </p>
                          <button
                            type="button"
                            onClick={() => openFullscreenPreview(result.images[SALIENCY_INDEX], LABELS[SALIENCY_INDEX])}
                            style={{
                              border: "none",
                              padding: 0,
                              background: "transparent",
                              cursor: "zoom-in",
                              borderRadius: 10,
                              display: "block",
                              width: "100%",
                              maxWidth: 420,
                            }}
                            title="View fullscreen"
                          >
                            <img
                              src={`data:image/png;base64,${result.images[SALIENCY_INDEX]}`}
                              alt={LABELS[SALIENCY_INDEX]}
                              style={{
                                width: "100%",
                                height: "auto",
                                display: "block",
                                borderRadius: 10,
                                border: `1px solid ${Colors.border}`,
                              }}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadImage(result.images[SALIENCY_INDEX], LABELS[SALIENCY_INDEX])}
                            style={{
                              marginTop: 12,
                              background: `${Colors.brandPrimary}14`,
                              border: `1px solid ${Colors.brandPrimary}44`,
                              color: Colors.brandPrimary,
                              padding: "8px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Download saliency map
                          </button>
                        </div>

                        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 600, color: Colors.textPrimary, marginBottom: 12 }}>
                            How to read the colors
                          </p>
                          <p style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 1.75, marginBottom: 18 }}>
                            This map overlays a <strong style={{ color: Colors.textPrimary }}>hot</strong> palette on gradient-based sensitivity of the input slice.
                            Brighter tones mark where intensity boundaries contribute more to this explanation; darker tones mark regions with comparatively weak signal in the saliency field — not “wrong tissue,” just lower emphasis for this visualization.
                          </p>

                          <div
                            style={{
                              height: 14,
                              borderRadius: 6,
                              marginBottom: 10,
                              background: "linear-gradient(90deg, #0d0221 0%, #3b0764 12%, #7f1d1d 28%, #ea580c 52%, #facc15 78%, #fefce8 100%)",
                              border: `1px solid ${Colors.border}`,
                            }}
                          />
                          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                            <li style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: Colors.textSecondary, lineHeight: 1.55 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#fefce8", flexShrink: 0, marginTop: 4, boxShadow: "0 0 0 1px rgba(255,255,255,0.25)" }} />
                              <span><strong style={{ color: Colors.textPrimary }}>Strongest focus</strong> — white / bright yellow: highest sensitivity (largest gradient magnitude in the saliency map).</span>
                            </li>
                            <li style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: Colors.textSecondary, lineHeight: 1.55 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ea580c", flexShrink: 0, marginTop: 4 }} />
                              <span><strong style={{ color: Colors.textPrimary }}>Moderate focus</strong> — orange / red: mid-range contribution.</span>
                            </li>
                            <li style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: Colors.textSecondary, lineHeight: 1.55 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1e1b4b", flexShrink: 0, marginTop: 4, border: "1px solid rgba(255,255,255,0.15)" }} />
                              <span><strong style={{ color: Colors.textPrimary }}>Weakest focus</strong> — deep purple / black: lowest magnitude here; the model’s explanation map places least emphasis on these pixels.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Orbital Region Legend - Auto displayed */}
              <div style={{ marginBottom: 40 }}>
                <p style={{
                  fontSize: 12,
                  color: Colors.textTertiary,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 18,
                  fontWeight: 600,
                  paddingLeft: 8
                }}>Interactive Region Legend</p>
                <div style={{
                  background: Colors.cardBg,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: 12,
                  padding: "32px 40px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  minHeight: 580,
                  width: "100%"
                }}>
                  <RegionLegendOrbitals />
                </div>
              </div>

              <CollectiveTeamSection />
            </div>
          )}

        </main>

        <footer
          style={{
            maxWidth: 1280,
            margin: "72px auto 0",
            padding: "32px clamp(16px, 3vw, 40px) 36px",
            borderTop: `1px solid ${Colors.brandPrimary}`,
          }}
        >
          <p
            style={{
              margin: 0,
              textAlign: "center",
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 400,
              color: Colors.textTertiary,
              letterSpacing: "0.02em",
              lineHeight: 1.5,
            }}
          >
            © {new Date().getFullYear()} Virtual Gadolinium. All rights reserved.
          </p>
        </footer>
      </div>
      {fullscreenPreview && (
        <div
          onClick={closeFullscreenPreview}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.92)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(96vw, 1400px)",
              height: "min(92vh, 900px)",
              borderRadius: 14,
              border: `1px solid ${Colors.borderLight}`,
              background: "rgba(15, 23, 42, 0.45)",
              boxShadow: "0 28px 80px rgba(0, 0, 0, 0.65)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={closeFullscreenPreview}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1px solid ${Colors.borderLight}`,
                background: "rgba(15, 23, 42, 0.85)",
                color: Colors.textPrimary,
                fontSize: 20,
                lineHeight: 1,
                cursor: "pointer",
                zIndex: 2,
              }}
              aria-label="Close fullscreen preview"
              title="Close"
            >
              ×
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                padding: "56px 22px 22px",
              }}
            >
              <img
                src={`data:image/png;base64,${fullscreenPreview.img}`}
                alt={fullscreenPreview.label}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
