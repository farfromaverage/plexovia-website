"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usaMapDimensions } from "@/lib/usa-map-dimensions";
import { MapPin, Crosshair, Radar } from "lucide-react";

// Fallback proxy data (used if live Supabase stats fail)
const FALLBACK_STATE_DATA: Record<string, number> = {
  CA: 3140, NY: 2845, TX: 2600, FL: 2150, VA: 1850, PA: 1720, IL: 1650,
  OH: 1540, GA: 1480, NC: 1420, MI: 1390, NJ: 1320, WA: 1250, MA: 1110,
  MD: 1045, AZ: 980,  CO: 950,  IN: 910,  TN: 890,  MO: 850,  WI: 820,
  MN: 790,  SC: 710,  AL: 680,  LA: 640,  KY: 590,  OR: 550,  OK: 520,
  CT: 480,  IA: 460,  UT: 440,  NV: 410,  AR: 390,  MS: 370,  KS: 350,
  NM: 320,  NE: 290,  WV: 270,  ID: 240,  HI: 210,  NH: 180,  ME: 160,
  MT: 140,  RI: 120,  DE: 100,  SD: 95,   ND: 85,   AK: 70,   VT: 60,
  WY: 45
};

// Coordinates for radar pings (rough SVG viewbox translation)
const RADAR_NODES = [
  { id: "CA", x: 100, y: 300 },
  { id: "TX", x: 420, y: 410 },
  { id: "NY", x: 800, y: 155 },
  { id: "FL", x: 740, y: 470 },
  { id: "IL", x: 590, y: 220 },
  { id: "WA", x: 130, y: 65 },
  { id: "VA", x: 780, y: 245 }
];

export default function CoverageMap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mapRef = useRef<SVGSVGElement>(null);
  const [stateData, setStateData] = useState<Record<string, number>>(FALLBACK_STATE_DATA);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/engine-stats');
        if (res.ok) {
          const data = await res.json();
          if (data.contracts_by_state && Object.keys(data.contracts_by_state).length > 0) {
            setStateData(data.contracts_by_state);
          }
        }
      } catch (e) {
        // keep fallback
      }
    }

    fetchStats();
    // Poll every 15 seconds to keep it truly live from engine
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-[#0A0A0A] border-y border-[#222120]">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111110_1px,transparent_1px),linear-gradient(to_bottom,#111110_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] blur-[150px] opacity-[0.15] pointer-events-none rounded-full" style={{ backgroundColor: "var(--accent)" }} />
      </div>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-12 items-center relative z-10">
        
        {/* Left Side: Advanced Telemetry Copy */}
        <div className="flex flex-col gap-8 max-w-lg z-10 w-full xl:pl-12">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A1917] border border-[#2E2C2A] w-fit shadow-[0_0_15px_rgba(201,168,76,0.05)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]"></span>
              </span>
              <span className="text-[12px] uppercase tracking-widest text-[#E8C06A] font-semibold" style={{ fontFamily: "'Geist Mono', monospace" }}>
                Live SAM.gov Telemetry
              </span>
            </div>
            
            <h2 
              className="text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-[1.05] font-medium"
              style={{ color: "#F5F3EE" }}
            >
              Monitor <br />
              <span style={{ color: "var(--accent)" }}>All 50 States.</span><br />
              Zero Blind Spots.
            </h2>
            <p className="text-lg leading-relaxed mt-4" style={{ color: "#8A8580" }}>
              Plexovia deeply integrates with standalone state procurement portals and <strong className="font-medium text-white" style={{ color: "#FFFFFF" }}>SAM.gov</strong> to build a comprehensive, high-velocity opportunity pipeline.
            </p>
          </div>

          <div className="mt-4 p-8 border border-[#2E2C2A] rounded-2xl flex flex-col gap-4 relative overflow-hidden bg-[#111110] shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all hover:border-[#3A3835]">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: "var(--accent)" }} />
            <div className="flex items-center gap-3">
              <Radar className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9A84C", fontFamily: "'Geist Mono', monospace" }}>
                Coverage Allocation
              </h3>
            </div>
            <p className="text-base leading-relaxed" style={{ color: "#D6D3CD" }}>
              Get automated coverage across <strong className="font-semibold" style={{ color: "#FFFFFF" }}>all 50 active states</strong>. Unrestricted nationwide pipeline generation with no limits on your footprint.
            </p>
          </div>
        </div>

        {/* Right Side: High-Contrast HUD Map */}
        <div className="relative w-full h-auto select-none pointer-events-auto flex justify-center xl:justify-end" onMouseMove={handleMouseMove}>
          <div className="relative w-full max-w-[900px]">
            <svg 
              ref={mapRef}
              viewBox="0 0 959 593" 
              className="w-full h-auto relative z-10"
              style={{ filter: "drop-shadow(0px 25px 45px rgba(0, 0, 0, 0.5))" }}
            >
              {Object.keys(usaMapDimensions).map((stateKey) => {
                const stateInfo = usaMapDimensions[stateKey as keyof typeof usaMapDimensions];
                const isHovered = hoveredState === stateKey;
                
                // Advanced Dark Theme Styling
                const fillBase = "#1A1917"; // All states highlighted identically
                const fillHover = "#C9A84C";
                const strokeBase = "#3A3835";
                const strokeHover = "#E8C06A";

                return (
                  <path
                    key={stateKey}
                    d={stateInfo.dimensions}
                    data-name={stateKey}
                    onMouseEnter={() => setHoveredState(stateKey)}
                    onMouseLeave={() => setHoveredState(null)}
                    className="transition-all duration-300 ease-out cursor-pointer outline-none"
                    fill={isHovered ? fillHover : fillBase}
                    stroke={isHovered ? strokeHover : strokeBase}
                    strokeWidth={isHovered ? 2 : 1.5}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Advanced Dark HUD Tooltip */}
      <AnimatePresence>
        {hoveredState && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed pointer-events-none z-[100] px-5 py-4 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center gap-4 border border-[#3A3835] bg-[#111110]/95"
            style={{
              left: mousePos.x + 24,
              top: mousePos.y + 24,
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#C9A84C]/30 bg-[#C9A84C]/10">
              <Crosshair className="w-4 h-4 text-[#C9A84C]" />
            </div>
            
            <div className="flex flex-col pr-2">
              <span className="text-[15px] font-semibold leading-tight text-white mb-1">
                {usaMapDimensions[hoveredState as keyof typeof usaMapDimensions].name}
              </span>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span className="text-[13px] leading-tight text-[#8A8580] tracking-wide" style={{ fontFamily: "'Geist Mono', monospace" }}>
                  <strong className="font-semibold text-[#E8C06A]">{stateData[hoveredState]?.toLocaleString() || "0"}</strong> contracts detected
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

