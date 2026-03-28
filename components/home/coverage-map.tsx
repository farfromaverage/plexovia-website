"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usaMapDimensions } from "@/lib/usa-map-dimensions";
import { MapPin } from "lucide-react";

const STATE_CONTRACT_DATA: Record<string, number> = {
  CA: 3140, NY: 2845, TX: 2600, FL: 2150, VA: 1850, PA: 1720, IL: 1650,
  OH: 1540, GA: 1480, NC: 1420, MI: 1390, NJ: 1320, WA: 1250, MA: 1110,
  MD: 1045, AZ: 980,  CO: 950,  IN: 910,  TN: 890,  MO: 850,  WI: 820,
  MN: 790,  SC: 710,  AL: 680,  LA: 640,  KY: 590,  OR: 550,  OK: 520,
  CT: 480,  IA: 460,  UT: 440,  NV: 410,  AR: 390,  MS: 370,  KS: 350,
  NM: 320,  NE: 290,  WV: 270,  ID: 240,  HI: 210,  NH: 180,  ME: 160,
  MT: 140,  RI: 120,  DE: 100,  SD: 95,   ND: 85,   AK: 70,   VT: 60,
  WY: 45
};

const ESSENTIAL_PLAN_STATES = ["CA", "NY", "TX", "FL", "VA", "MA", "MD"];

export default function CoverageMap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mapRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden border-t" style={{ borderColor: "rgba(201, 168, 76, 0.15)", backgroundColor: "var(--pub-bg)" }}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left Side: Elegant Copy */}
        <div className="flex flex-col gap-8 max-w-lg z-10 lg:pl-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-[1.05] font-medium" style={{ color: "var(--pub-ink)" }}>
              Monitor <br />
              <span style={{ color: "var(--pub-gold)" }}>All 50 States.</span><br />
              Or start with what matters.
            </h2>
            <p className="text-lg leading-relaxed mt-4" style={{ color: "var(--pub-ink-muted)" }}>
              Plexovia deeply integrates with standalone state procurement portals and <strong className="font-medium" style={{ color: "var(--pub-ink)" }}>SAM.gov</strong> to build a comprehensive opportunity pipeline.
            </p>
          </div>

          <div className="mt-4 p-8 border rounded-2xl flex flex-col gap-3 relative overflow-hidden bg-white shadow-sm" style={{ borderColor: "rgba(201, 168, 76, 0.2)" }}>
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: "var(--pub-gold)" }} />
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--pub-gold)", fontFamily: "'Geist Mono', monospace" }}>
              The Essential Plan Limit
            </h3>
            <p className="text-base leading-relaxed" style={{ color: "var(--pub-ink)" }}>
              Pick up to <strong className="font-semibold" style={{ color: "var(--pub-ink)" }}>7 active states</strong> for your primary area of operations. Need a massive footprint? Upgrade to Pro for full-nation coverage without limits.
            </p>
          </div>
        </div>

        {/* Right Side: Elegant Map */}
        <div className="relative w-full h-auto select-none pointer-events-auto mt-8 lg:mt-0 flex justify-center lg:justify-end pr-0 lg:pr-8" onMouseMove={handleMouseMove}>
          
          {/* Subtle luxurious backlight glow behind map */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] blur-[120px] pointer-events-none rounded-full" style={{ backgroundColor: "rgba(201, 168, 76, 0.15)" }} />

          <svg 
            ref={mapRef}
            viewBox="0 0 959 593" 
            className="w-full h-auto max-w-[800px] relative z-10"
            style={{ 
              filter: "drop-shadow(0px 15px 35px rgba(26, 26, 26, 0.04))"
            }}
          >
            {Object.keys(usaMapDimensions).map((stateKey) => {
              const stateInfo = usaMapDimensions[stateKey as keyof typeof usaMapDimensions];
              const isEssential = ESSENTIAL_PLAN_STATES.includes(stateKey);
              const isHovered = hoveredState === stateKey;
              
              // Pristine elegant contrast
              const fillBase = isEssential ? "var(--pub-ink)" : "rgba(201, 168, 76, 0.12)";
              const fillHover = "var(--pub-gold)";
              
              const strokeBase = "var(--pub-bg)"; // Cuts perfectly into the background
              const strokeHover = "var(--pub-bg)";

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
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{
                    position: "relative",
                  }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Pristine Modern SaaS Tooltip */}
      <AnimatePresence>
        {hoveredState && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed pointer-events-none z-[100] px-5 py-3.5 rounded-2xl shadow-[0_20px_40px_rgba(26,26,26,0.08)] backdrop-blur-xl flex items-center gap-4"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(26, 26, 26, 0.05)",
              left: mousePos.x + 24,
              top: mousePos.y + 24,
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(201, 168, 76, 0.1)" }}>
              <MapPin className="w-4 h-4" style={{ color: "var(--pub-gold)" }} />
            </div>
            
            <div className="flex flex-col pr-2">
              <span className="text-[15px] font-semibold leading-tight" style={{ color: "var(--pub-ink)" }}>
                {usaMapDimensions[hoveredState as keyof typeof usaMapDimensions].name}
              </span>
              <span className="text-[13px] leading-tight mt-0.5" style={{ color: "var(--pub-ink-muted)" }}>
                <strong className="font-semibold" style={{ color: "var(--pub-ink)" }}>{STATE_CONTRACT_DATA[hoveredState].toLocaleString()}</strong> active contracts
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
