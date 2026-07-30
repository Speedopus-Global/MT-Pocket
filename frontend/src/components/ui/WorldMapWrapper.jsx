"use client";

import { useTheme } from "next-themes";
import WorldMap from "@/components/ui/world-map";

export default function WorldMapWrapper() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="absolute inset-x-0 bottom-[-260px] flex justify-center overflow-hidden">
      {/* Globe Background Container */}
      <div 
        className={`relative h-[900px] w-[900px] overflow-hidden rounded-full border transition-all duration-500 ${
          isDark 
            ? "border-sky-500/10 shadow-[inset_0_0_60px_rgba(255,255,255,0.08),0_0_100px_rgba(6,32,86,0.7)]" 
            : "border-sky-300/30 shadow-[inset_0_0_60px_rgba(59,130,246,0.1),0_0_80px_rgba(59,130,246,0.15)]"
        }`}
        style={{
          background: isDark 
            ? "radial-gradient(circle at 50% 40%, #062056 0%, #020b24 55%, #000000 100%)" 
            : "radial-gradient(circle at 50% 40%, #ffffff 0%, #f0f9ff 60%, #e0f2fe 100%)"
        }}
      >
        {/* Atmosphere/Glow Layer */}
        <div 
          className="absolute inset-0 rounded-full transition-opacity duration-500" 
          style={{
            background: isDark 
              ? "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.1), transparent 45%)" 
              : "radial-gradient(circle at 50% 20%, rgba(59,130,246,0.08), transparent 45%)"
          }}
        />

        {/* World Map */}
        <div className="scale-[1.55] pt-20">
          <WorldMap
            dots={[
              {start:{lat:64.2008,lng:-149.4937},end:{lat:34.0522,lng:-118.2437}},
              {start:{lat:64.2008,lng:-149.4937},end:{lat:-15.7975,lng:-47.8919}},
              {start:{lat:-15.7975,lng:-47.8919},end:{lat:38.7223,lng:-9.1393}},
              {start:{lat:51.5074,lng:-0.1278},end:{lat:28.6139,lng:77.209}},
              {start:{lat:28.6139,lng:77.209},end:{lat:43.1332,lng:131.9113}},
              {start:{lat:28.6139,lng:77.209},end:{lat:-1.2921,lng:36.8219}},
            ]}
          />
        </div>
      </div>
    </div>
  );
}