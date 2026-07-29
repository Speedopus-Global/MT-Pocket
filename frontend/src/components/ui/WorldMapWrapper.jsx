"use client";

import WorldMap from "@/components/ui/world-map";

export default function WorldMapWrapper() {
  return (
    <div className="absolute inset-x-0 bottom-[-260px] flex justify-center">
      <div className="h-[900px] w-[900px] overflow-hidden rounded-full border border-primary/10 bg-gradient-to-b from-background to-muted/30">
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