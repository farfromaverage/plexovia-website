"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usaMapDimensions } from "@/lib/usa-map-dimensions";

// Base realistic state contract volumes based on SAM.gov / State Portals
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

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    // We use clientX and clientY for fixed positioning
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden border-t" style={{ borderColor: "rgba(201, 168, 76, 0.15)", backgroundColor: "var(--pub-bg)" }}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        
        {/* Left Side: Copy */}
        <div className="flex flex-col gap-8 max-w-lg z-10 lg:pl-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-[1.05] font-medium" style={{ color: "var(--pub-ink)" }}>
              Monitor <br />
              <span style={{ color: "var(--pub-gold)" }}>All 50 States.</span><br />
              Or start with what matters.
            </h2>
            <p className="text-lg leading-relaxed mt-4" style={{ color: "var(--pub-ink-muted)" }}>
              Plexovia deeply integrates with standalone state procurement portals and <span style={{ color: "var(--pub-ink)", fontWeight: 500 }}>SAM.gov</span> to build a comprehensive opportunity pipeline.
            </p>
          </div>

          <div className="mt-4 p-8 border rounded-xl flex flex-col gap-3 relative overflow-hidden" style={{ borderColor: "rgba(201, 168, 76, 0.2)", backgroundColor: "rgba(201, 168, 76, 0.03)" }}>
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: "var(--pub-gold)" }} />
            <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--pub-gold)", fontFamily: "'Geist Mono', monospace" }}>
              The Essential Plan Limit
            </h3>
            <p className="text-base leading-relaxed" style={{ color: "var(--pub-ink)" }}>
              Pick up to <strong className="font-semibold" style={{ color: "var(--pub-gold)" }}>7 active states</strong> for your primary area of operations. Need a massive footprint? Upgrade to Pro for full-nation coverage without limits.
            </p>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="relative w-full h-auto select-none pointer-events-auto mt-8 lg:mt-0 flex justify-center lg:justify-end pr-0 lg:pr-8">
          <svg 
            ref={mapRef}
            viewBox="0 0 959 593" 
            className="w-full h-auto max-w-[800px]"
            style={{ 
              filter: "drop-shadow(0px 20px 40px rgba(201, 168, 76, 0.05))"
            }}
          >
            {Object.keys(usaMapDimensions).map((stateKey) => {
              const stateInfo = usaMapDimensions[stateKey as keyof typeof usaMapDimensions];
              const isEssential = ESSENTIAL_PLAN_STATES.includes(stateKey);
              const isHovered = hoveredState === stateKey;
              
              const fillBase = isEssential ? "rgba(201, 168, 76, 0.75)" : "rgba(201, 168, 76, 0.15)";
              const fillHover = isEssential ? "rgba(201, 168, 76, 0.95)" : "rgba(201, 168, 76, 0.35)";

              return (
                <path
                  key={stateKey}
                  d={stateInfo.dimensions}
                  data-name={stateKey}
                  onMouseEnter={() => setHoveredState(stateKey)}
                  onMouseLeave={() => setHoveredState(null)}
                  onMouseMove={handleMouseMove}
                  className="transition-all duration-300 ease-in-out cursor-pointer"
                  fill={isHovered ? fillHover : fillBase}
                  stroke={isHovered ? "var(--pub-ink)" : "rgba(201, 168, 76, 0.3)"}
                  strokeWidth={isHovered ? 2.5 : 0.5}
                />
              );
            })}
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {hoveredState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed pointer-events-none z-[100] px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md"
            style={{
              backgroundColor: "rgba(253, 251, 247, 0.98)", // Parchment based
              borderColor: "rgba(201, 168, 76, 0.3)",
              left: mousePos.x + 20,
              top: mousePos.y + 20,
            }}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--pub-ink)" }}>
                {usaMapDimensions[hoveredState as keyof typeof usaMapDimensions].name}
              </span>
              <span className="text-xs whitespace-nowrap" style={{ color: "var(--pub-ink-muted)", fontFamily: "'Geist Mono', monospace" }}>
                <strong style={{ color: "var(--pub-gold)" }}>{STATE_CONTRACT_DATA[hoveredState].toLocaleString()}</strong> active contracts
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
