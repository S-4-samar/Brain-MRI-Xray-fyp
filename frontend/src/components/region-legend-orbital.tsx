import RadialOrbitalTimeline from "./ui/radial-orbital-timeline";

const tumorRegionData = [
  {
    id: 1,
    title: "Edema",
    date: "Peritumoral",
    content: "Peritumoral edema represents the swollen tissue surrounding the tumor. This region contains fluid accumulation and represents the tumor's influence on surrounding healthy brain tissue.",
    category: "Region",
    color: "#10b981",
    relatedIds: [2],
    status: "completed" as const,
    energy: 85,
  },
  {
    id: 2,
    title: "Tumor Core",
    date: "Non-enhancing",
    content: "The non-enhancing tumor core represents the central hypointense region. This is the primary tumor mass that does not enhance with contrast agent.",
    category: "Region",
    color: "#ef4444",
    relatedIds: [1, 3],
    status: "in-progress" as const,
    energy: 100,
  },
  {
    id: 3,
    title: "Enhancing Tumor",
    date: "Active Region",
    content: "The enhancing tumor region shows contrast enhancement indicating areas of active tumor growth with disrupted blood-brain barrier. This represents the most aggressive tumor areas.",
    category: "Region",
    color: "#eab308",
    relatedIds: [2],
    status: "in-progress" as const,
    energy: 90,
  },
];

export function RegionLegendOrbitals() {
  return (
    <RadialOrbitalTimeline timelineData={tumorRegionData} />
  );
}
