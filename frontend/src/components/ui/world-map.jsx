"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import DottedMap from "dotted-map";
import { useTheme } from "next-themes";

export default function WorldMap({
  dots = [],
  lineColor
}) {
  const svgRef = useRef(null);
  const map = new DottedMap({ height: 100, grid: "diagonal" });

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Use the exact continent dots color from the image reference
  const svgMap = map.getSVG({
    radius: 0.22,
    color: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(6, 32, 86, 0.35)",
    shape: "circle",
    backgroundColor: "transparent",
  });

  const projectPoint = (lat, lng) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (start, end) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Base arc color
  const activeLineColor = lineColor || (isDark ? "#06b6d4" : "#3b82f6");

  return (
    <div className="w-full aspect-[2/1] bg-transparent rounded-lg relative font-sans">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1.2"
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: 1,
                }}
                transition={{
                  duration: 1.6,
                  delay: 0.4 * i,
                  ease: "easeOut",
                }}
                key={`start-upper-${i}`}
              ></motion.path>
            </g>
          );
        })}

        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={activeLineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={activeLineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => {
          const startColor = isDark ? (i % 2 === 0 ? "#06b6d4" : "#3b82f6") : "#3b82f6";
          const endColor = isDark ? (i % 2 === 0 ? "#3b82f6" : "#6366f1") : "#6366f1";
          const startPt = projectPoint(dot.start.lat, dot.start.lng);
          const endPt = projectPoint(dot.end.lat, dot.end.lng);

          return (
            <g key={`points-group-${i}`}>
              {/* Start Point */}
              <g key={`start-${i}`}>
                <circle
                  cx={startPt.x}
                  cy={startPt.y}
                  r="3.5"
                  fill={startColor}
                />
                <circle
                  cx={startPt.x}
                  cy={startPt.y}
                  r="5.5"
                  fill="none"
                  stroke={isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(6, 32, 86, 0.4)"}
                  strokeWidth="0.75"
                />
                <circle
                  cx={startPt.x}
                  cy={startPt.y}
                  r="3.5"
                  fill={startColor}
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    from="3.5"
                    to="12"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>

              {/* End Point */}
              <g key={`end-${i}`}>
                <circle
                  cx={endPt.x}
                  cy={endPt.y}
                  r="3.5"
                  fill={endColor}
                />
                <circle
                  cx={endPt.x}
                  cy={endPt.y}
                  r="5.5"
                  fill="none"
                  stroke={isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(6, 32, 86, 0.4)"}
                  strokeWidth="0.75"
                />
                <circle
                  cx={endPt.x}
                  cy={endPt.y}
                  r="3.5"
                  fill={endColor}
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    from="3.5"
                    to="12"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="2s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}