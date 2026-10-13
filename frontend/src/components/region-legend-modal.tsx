import React, { useState } from "react";
import { RegionLegendOrbitals } from "./region-legend-orbital";

export function RegionLegendModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: "100%",
          padding: "16px 20px",
          borderRadius: 12,
          border: "1px solid rgba(59, 130, 246, 0.3)",
          background: "rgba(59, 130, 246, 0.1)",
          color: "#3b82f6",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          transition: "all 0.2s",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
          e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
          e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
        }}
      >
        🔍 Explore Region Legend (Orbital View)
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              position: "relative",
              width: "95vw",
              height: "95vh",
              background: "black",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 10000,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                width: 44,
                height: 44,
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
            >
              ✕
            </button>
            <RegionLegendOrbitals />
          </div>
        </div>
      )}
    </>
  );
}

export default RegionLegendModal;
