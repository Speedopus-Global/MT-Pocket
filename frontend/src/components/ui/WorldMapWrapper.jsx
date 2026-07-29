"use client";

import { useTheme } from "next-themes";
import WorldMap from "@/components/ui/world-map";

export default function WorldMapWrapper() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="absolute inset-x-0 bottom-[-260px] flex justify-center overflow-hidden">
      {/* Atmosphere Glow */}
      <div
        className={`absolute bottom-24 h-[850px] w-[850px] rounded-full blur-[120px] ${
          isDark ? "bg-white/5" : "bg-sky-400/20"
        }`}
      />

      <div className="relative h-[900px] w-[900px] overflow-hidden rounded-full border border-primary/10">

        {/* Globe Background */}
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-[radial-gradient(circle_at_50%_38%,#3f3f3f_0%,#242424_40%,#111111_70%,#000000_100%)]"
              : "bg-[radial-gradient(circle_at_50%_38%,#68D4FF_0%,#2596FF_28%,#1565C0_58%,#0A3A82_78%,#031A3A_100%)]"
          }`}
        />

        {/* Atmosphere */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.35),transparent_45%)]" />

        {/* World Map */}
        <div className="absolute inset-0 scale-[1.55] pt-20">
          <WorldMap
            dots={[
              {
                start: { lat: 64.2008, lng: -149.4937 },
                end: { lat: 34.0522, lng: -118.2437 },
              },
              {
                start: { lat: 64.2008, lng: -149.4937 },
                end: { lat: -15.7975, lng: -47.8919 },
              },
              {
                start: { lat: -15.7975, lng: -47.8919 },
                end: { lat: 38.7223, lng: -9.1393 },
              },
              {
                start: { lat: 51.5074, lng: -0.1278 },
                end: { lat: 28.6139, lng: 77.209 },
              },
              {
                start: { lat: 28.6139, lng: 77.209 },
                end: { lat: 43.1332, lng: 131.9113 },
              },
              {
                start: { lat: 28.6139, lng: 77.209 },
                end: { lat: -1.2921, lng: 36.8219 },
              },
            ]}
          />
        </div>

        {/* Bottom Clouds */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-white/60 via-white/20 to-transparent blur-3xl dark:from-white/10 dark:via-white/5" />

        {/* Fog */}
        <div className="pointer-events-none absolute -bottom-16 left-1/2 h-72 w-[120%] -translate-x-1/2 rounded-full bg-white/20 blur-[90px] dark:bg-white/5" />

        {/* Fade into Card */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>
    </div>
  );
}