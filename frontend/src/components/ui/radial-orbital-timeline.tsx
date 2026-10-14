"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon?: React.ElementType;
  color?: string;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {},
  );
  const [viewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: ReturnType<typeof setInterval>;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.5) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 40);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.5,
      Math.min(1, 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2)),
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-black border-white";
      case "in-progress":
        return "text-black bg-white border-black";
      case "pending":
        return "text-white bg-black/40 border-white/50";
      default:
        return "text-white bg-black/40 border-white/50";
    }
  };

  return (
    <div
      className="w-full flex flex-col items-center justify-center bg-black rounded-lg overflow-hidden"
      style={{ height: "500px", padding: "20px" }}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* SVG Background with gradient orbit and stars */}
          <svg
            className="absolute w-full h-full"
            style={{ filter: "drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))" }}
          >
            <defs>
              <linearGradient
                id="orbitGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <style>{`
                @keyframes twinkle {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 1; }
                }
                .star { animation: twinkle 3s infinite; }
                .star:nth-child(1) { animation-delay: 0s; }
                .star:nth-child(2) { animation-delay: 0.5s; }
                .star:nth-child(3) { animation-delay: 1s; }
                .star:nth-child(4) { animation-delay: 1.5s; }
                .star:nth-child(5) { animation-delay: 2s; }
                .star:nth-child(6) { animation-delay: 2.5s; }
                .star:nth-child(7) { animation-delay: 1.2s; }
                .star:nth-child(8) { animation-delay: 0.8s; }
                .star:nth-child(9) { animation-delay: 1.8s; }
                .star:nth-child(10) { animation-delay: 0.3s; }
                .star:nth-child(11) { animation-delay: 2.2s; }
                .star:nth-child(12) { animation-delay: 1.6s; }
                .star:nth-child(13) { animation-delay: 0.6s; }
                .star:nth-child(14) { animation-delay: 2.3s; }
                .star:nth-child(15) { animation-delay: 0.9s; }
              `}</style>
            </defs>
            {/* Background stars */}
            <circle cx="15%" cy="20%" r="1.5" fill="#ffffff" className="star" />
            <circle cx="85%" cy="15%" r="1" fill="#e0e7ff" className="star" />
            <circle cx="10%" cy="70%" r="1.2" fill="#ffffff" className="star" />
            <circle cx="90%" cy="75%" r="0.8" fill="#c7d2fe" className="star" />
            <circle cx="20%" cy="90%" r="1" fill="#e0e7ff" className="star" />
            <circle cx="80%" cy="85%" r="1.3" fill="#ffffff" className="star" />
            <circle cx="25%" cy="35%" r="0.9" fill="#f3e8ff" className="star" />
            <circle cx="75%" cy="55%" r="1.1" fill="#ffffff" className="star" />
            <circle cx="40%" cy="15%" r="0.8" fill="#ddd6fe" className="star" />
            <circle cx="92%" cy="40%" r="1" fill="#ffffff" className="star" />
            <circle cx="8%" cy="45%" r="0.9" fill="#ede9fe" className="star" />
            <circle cx="60%" cy="92%" r="1.2" fill="#ffffff" className="star" />
            <circle cx="35%" cy="70%" r="0.7" fill="#dbeafe" className="star" />
            <circle cx="70%" cy="25%" r="1.1" fill="#ffffff" className="star" />
            <circle cx="45%" cy="88%" r="0.8" fill="#e0e7ff" className="star" />
            <circle cx="55%" cy="10%" r="0.9" fill="#dbeafe" className="star" />
            <circle cx="12%" cy="25%" r="1.1" fill="#ffffff" className="star" />
            <circle cx="88%" cy="88%" r="0.9" fill="#e0d9f0" className="star" />
            <circle cx="5%" cy="60%" r="0.8" fill="#c7d2fe" className="star" />
            <circle cx="95%" cy="50%" r="1" fill="#f3e8ff" className="star" />

            {/* Moon emoji in corner */}
            <text
              x="94%"
              y="12%"
              fontSize="40"
              fill="#f5f3ff"
              textAnchor="middle"
              filter="drop-shadow(0 0 20px rgba(200, 150, 255, 0.7))"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              🌙
            </text>

            <circle
              cx="50%"
              cy="50%"
              r="96"
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth="3"
              opacity="0.9"
              filter="url(#glow)"
            />
            <circle
              cx="50%"
              cy="50%"
              r="96"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              opacity="0.4"
              strokeDasharray="8,4"
            />
          </svg>

          {/* Enhanced core */}
          <div
            className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-teal-400 animate-pulse flex items-center justify-center z-10"
            style={{
              boxShadow:
                "0 0 40px rgba(59, 130, 246, 0.8), 0 0 60px rgba(168, 85, 247, 0.6), inset 0 0 20px rgba(255,255,255,0.4)",
            }}
          >
            <div
              className="absolute w-10 h-10 rounded-full border-2 border-blue-400/60 animate-ping opacity-100"
              style={{ animationDuration: "1.5s" }}
            ></div>
            <div
              className="absolute w-14 h-14 rounded-full border-2 border-purple-400/40 animate-ping opacity-70"
              style={{ animationDelay: "0.5s", animationDuration: "2s" }}
            ></div>
            <div className="w-2 h-2 rounded-full bg-white backdrop-blur-md shadow-lg shadow-white/50"></div>
          </div>

          {/* Orbit circle with glow */}
          <div
            className="absolute w-48 h-48 rounded-full border-3 border-white/50"
            style={{
              boxShadow:
                "0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.2)",
              filter: "drop-shadow(0 0 10px rgba(168, 85, 247, 0.3))",
            }}
          ></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) nodeRefs.current[item.id] = el;
                }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse" : ""
                  }`}
                  style={{
                    background: item.color
                      ? `radial-gradient(circle, ${item.color}40 0%, ${item.color}20 40%, rgba(255,255,255,0) 70%)`
                      : `radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 70%)`,
                    width: `${item.energy * 0.4 + 30}px`,
                    height: `${item.energy * 0.4 + 30}px`,
                    left: `-${(item.energy * 0.4 + 30 - 32) / 2}px`,
                    top: `-${(item.energy * 0.4 + 30 - 32) / 2}px`,
                    animationDuration: isPulsing ? "1.5s" : undefined,
                    boxShadow: item.color
                      ? `0 0 20px ${item.color}30, inset 0 0 10px ${item.color}20`
                      : "none",
                  }}
                ></div>

                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${
                    item.color
                      ? ""
                      : isExpanded
                        ? "bg-white text-black"
                        : isRelated
                          ? "bg-white/50 text-black"
                          : "bg-black text-white"
                  }
                  border-2 
                  ${
                    isExpanded
                      ? "shadow-lg shadow-white/40"
                      : isRelated
                        ? "animate-pulse"
                        : ""
                  }
                  transition-all duration-300 transform
                  ${isExpanded ? "scale-125" : ""}
                  ${
                    isExpanded
                      ? "border-white"
                      : isRelated
                        ? "border-white/60"
                        : item.color
                          ? "border-white/60"
                          : "border-white/40"
                  }
                `}
                  style={
                    item.color
                      ? {
                          backgroundColor: item.color,
                          boxShadow: isExpanded
                            ? `0 0 30px ${item.color}, 0 0 50px ${item.color}60, inset 0 0 15px rgba(255,255,255,0.4), 0 0 20px rgba(0,0,0,0.8)`
                            : `0 0 15px ${item.color}80, 0 0 25px ${item.color}40, inset 0 0 5px rgba(255,255,255,0.2)`,
                          filter: "drop-shadow(0 0 8px rgba(0,0,0,0.5))",
                          cursor: "pointer",
                        }
                      : {}
                  }
                >
                  {item.icon && <item.icon size={16} />}
                </div>

                <div
                  className={`
                  absolute top-10  whitespace-nowrap
                  text-xs font-semibold tracking-wider
                  transition-all duration-300
                  ${isExpanded ? "text-white scale-125" : "text-white/70"}
                `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-16 left-1/2 -translate-x-1/2 w-56 bg-black/90 backdrop-blur-lg border-white/30 shadow-xl shadow-white/10 overflow-visible">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-white/50"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 text-xs ${getStatusStyles(
                            item.status,
                          )}`}
                        >
                          {item.status === "completed"
                            ? "COMPLETE"
                            : item.status === "in-progress"
                              ? "IN PROGRESS"
                              : "PENDING"}
                        </Badge>
                        <span className="text-xs font-mono text-white/50">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/80">
                      <p>{item.content}</p>

                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center">
                            <Zap size={10} className="mr-1" />
                            Energy Level
                          </span>
                          <span className="font-mono">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center mb-2">
                            <Link size={10} className="text-white/70 mr-1" />
                            <h4 className="text-xs uppercase tracking-wider font-medium text-white/70">
                              Connected Nodes
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId,
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-xs rounded-none border-white/20 bg-transparent hover:bg-white/10 text-white/80 hover:text-white transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className="ml-1 text-white/60"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
