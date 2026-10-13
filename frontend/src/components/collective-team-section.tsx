import React from "react";
import {
  ScrollingAnimation,
  type CollectiveProfile,
} from "./ui/scrolling-animation";

const COLLECTIVE: CollectiveProfile[] = [
  {
    name: "Zaeem Nazir",
    title: "Associate Lecturer, University of Narowal",
    bio: "Academic supervisor guiding research direction and methodology on the Virtual Gadolinium project.",
    image: "/team/zaeem-nazir.png",
    role: "supervisor",
  },
  {
    name: "Samar Abbas",
    title: "ML & segmentation lead",
    bio: "Architects the BraTS-grade model stack and trains tumor subregion heads for robust clinical deployment.",
    image: "/team/samar-abbas.png",
    role: "member",
  },
  {
    name: "Awais Ali",
    title: "Clinical imaging scientist",
    bio: "Bridges radiology workflows with quantitative MRI QA, study design, and reader protocols.",
    image: "/team/awais-ali.png",
    role: "member",
  },
  {
    name: "Ume Habiba",
    title: "Platform & inference engineer",
    bio: "Owns the FastAPI and PyTorch serving path, latency budgets, and production deployment for the suite.",
    image: "/team/ume-habiba.png",
    role: "member",
  },
];

export default function CollectiveTeamSection() {
  return (
    <section
      id="collective-team"
      className="relative mb-10 md:mb-14"
      aria-labelledby="collective-team-heading"
    >
      <h2 id="collective-team-heading" className="sr-only">
        Project collective — supervisor and team members
      </h2>
      <ScrollingAnimation
        profiles={COLLECTIVE}
        heading="Our collective"
        subheading="Supervisor and core team behind Virtual Gadolinium."
      />
    </section>
  );
}
