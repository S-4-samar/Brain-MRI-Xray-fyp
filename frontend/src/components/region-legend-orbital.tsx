import { useState } from "react";

interface Region {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  color: string;
}

const regions: Region[] = [
  {
    id: 1,
    title: "Edema",
    subtitle: "Peritumoral",
    content:
      "Peritumoral edema represents the swollen tissue surrounding the tumor. This region contains fluid accumulation and represents the tumor's influence on surrounding healthy brain tissue.",
    color: "#10b981",
  },
  {
    id: 2,
    title: "Tumor Core",
    subtitle: "Non-enhancing",
    content:
      "The non-enhancing tumor core represents the central hypointense region. This is the primary tumor mass that does not enhance with contrast agent.",
    color: "#ef4444",
  },
  {
    id: 3,
    title: "Enhancing Tumor",
    subtitle: "Active region",
    content:
      "The enhancing tumor region shows contrast enhancement indicating areas of active tumor growth with disrupted blood-brain barrier. This represents the most aggressive tumor areas.",
    color: "#eab308",
  },
];

export function RegionLegendOrbitals() {
  const [openId, setOpenId] = useState<number | null>(1);

  return (
    <div className="w-full max-w-2xl mx-auto divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {regions.map((r) => {
        const isOpen = openId === r.id;
        return (
          <div key={r.id}>
            <h3>
              <button
                type="button"
                id={`region-btn-${r.id}`}
                aria-expanded={isOpen}
                aria-controls={`region-panel-${r.id}`}
                onClick={() => setOpenId(isOpen ? null : r.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 transition-colors"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: r.color,
                    boxShadow: `0 0 10px ${r.color}99`,
                  }}
                  aria-hidden="true"
                />
                <span className="flex-1">
                  <span className="block text-base font-semibold text-white">
                    {r.title}
                  </span>
                  <span className="block text-sm text-white/50">
                    {r.subtitle}
                  </span>
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`shrink-0 text-white/60 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </h3>

            <div
              id={`region-panel-${r.id}`}
              role="region"
              aria-labelledby={`region-btn-${r.id}`}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pl-11 text-sm leading-relaxed text-white/75">
                  {r.content}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RegionLegendOrbitals;
