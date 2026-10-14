"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

export type CollectiveProfile = {
  name: string;
  title: string;
  bio: string;
  image: string;
  role: "supervisor" | "member";
};

type CollectiveCircleProps = {
  profiles: CollectiveProfile[];
  heading: string;
  subheading: string;
  className?: string;
};

const SUPERVISOR_INDEX = 0;
const STAGE_MAX_PX = 360;
const RING_WIDTH_PX = 2;

function orbitAngle(profileIndex: number, pivot: number, total: number) {
  const slot = (profileIndex - pivot + total) % total;
  return (2 * Math.PI * slot) / total - Math.PI / 2;
}

function computeOrbitRadius(stageSize: number) {
  return stageSize / 2 - RING_WIDTH_PX / 2;
}

function avatarSizeForStage(stageSize: number, expanded: boolean) {
  if (!expanded) return Math.min(84, Math.round(stageSize * 0.24));
  return Math.min(68, Math.round(stageSize * 0.19));
}

const ORBIT_DOTS = [0, 1, 2, 3].map((i) => {
  const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
  return { angle, label: ["N", "E", "S", "W"][i] };
});

export function ScrollingAnimation({
  profiles,
  heading,
  subheading,
  className,
}: CollectiveCircleProps) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(SUPERVISOR_INDEX);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState(STAGE_MAX_PX);
  const [orbitPx, setOrbitPx] = useState(148);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const measure = () => {
      const size = el.getBoundingClientRect().width;
      if (size > 0) {
        setStageSize(size);
        setOrbitPx(computeOrbitRadius(size));
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isOpen = expanded || Boolean(reduceMotion);
  const pivot = activeIndex;
  const active = profiles[pivot];
  const transitionMs = reduceMotion ? 0 : 500;
  const orbitAvatarPx = avatarSizeForStage(stageSize, true);
  const centerAvatarPx = avatarSizeForStage(stageSize, false);
  const radius = isOpen ? orbitPx : 0;

  const handleExpand = () => {
    if (!isOpen) setExpanded(true);
  };

  const handleProfileClick = (index: number) => {
    if (!isOpen) {
      setExpanded(true);
      setActiveIndex(index);
      return;
    }
    setActiveIndex(index);
  };

  return <></>;
}
