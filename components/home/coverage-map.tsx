"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usaMapDimensions } from "@/lib/usa-map-dimensions";

// Base percentage distribution of contracts per state to compute "live" values
const STATE_DISTRIBUTION: Record<string, number> = {
  CA: 0.12, TX: 0.10, NY: 0.08, FL: 0.07, VA: 0.06, PA: 0.05, IL: 0.045,
  OH: 0.04, GA: 0.038, NC: 0.035, MI: 0.032, NJ: 0.03, WA: 0.028, MA: 0.025,
  MD: 0.024, AZ: 0.02, CO: 0.019, IN: 0.018, TN: 0.017, MO: 0.016, WI: 0.015,
  MN: 0.014, SC: 0.012, AL: 0.011, LA: 0.01, KY: 0.009, OR: 0.008, OK: 0.007,
  CT: 0.006, IA: 0.005, UT: 0.004, NV: 0.004, AR: 0.003, MS: 0.003, KS: 0.002,
  NM: 0.002, NE: 0.002, WV: 0.001, ID: 0.001, HI: 0.001, NH: 0.001, ME: 0.001,
  MT: 0.0005, RI: 0.0005, DE: 0.0005, SD: 0.0005, ND: 0.0005, AK: 0.0005, VT: 0.0005,
  WY: 0.0001
};

const ESSENTIAL_PLAN_STATES = ["CA", "NY", "TX", "FL", "VA", "MA", "IL", "WA"];

// Advanced HUD Pulse Nodes based on viewBox 0 0 959 593
const RADAR_NODES = [
  { id: "CA", x: 100, y: 250 },
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

  const [totalLiveContracts, setTotalLiveContracts] = useState<number>(24100);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchEngineStats() {
      try {
        const res = await fetch("/api/engine-stats");
        if (res.ok) {
          const data = await res.json();
          if (data.total_contracts) {
             setTotalLiveContracts(data.total_contracts);
             setIsLive(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchEngineStats();
    
    const interval = setInterval(() => {
      setTotalLiveContracts(prev => prev + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const getLiveStateValue = (stateKey: string) => {
     const percentage = STATE_DISTRIBUTION[stateKey] || 0.001;
     return Math.floor(totalLiveContracts * percentage);
  };

  // Switch the ENTIRE SECTION to Dark Mode for extreme contrast
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden border-y" style={{ backgroundColor: "var(--pub-ink)", borderColor: "rgba(255, 255, 255, 0.05)" }}>
      {/* Absolute background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)"
        }}
      />

      {/* Edge glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(201, 168, 76, 0.05) 0%, transparent 70%)" }} />

      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left Side: Advanced Copy Terminal */}
        <div className="flex flex-col gap-6 w-full lg:col-span-5 relative z-10 lg:pl-12">
          
          <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full border mb-2 w-max shadow-[0_0_15px_rgba(201,168,76,0.15)]" style={{ borderColor: "rgba(201, 168, 76, 0.4)", backgroundColor: "rgba(201, 168, 76, 0.1)" }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--pub-gold)" }}></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "var(--pub-gold)" }}></span>
            </span>
            <span className="text-xs uppercase font-medium tracking-widest" style={{ color: "var(--pub-gold)", fontFamily: "'Geist Mono', monospace" }}>
              Engine Status: {isLive ? "LIVE SYNC" : "CONNECTING..."}
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-[1.05] font-medium text-white">
            Nationwide Coverage.<br />
            <span style={{ color: "var(--pub-gold)" }}>Precision Tracking.</span>
          </h2>
          
          <p className="text-lg leading-relaxed mt-2 text-white/60">
            Our infrastructure interfaces directly with <strong className="font-semibold text-white">SAM.gov</strong> and all 50 independent state portals. No delays, no missing data.
          </p>

          {/* Terminal Box */}
          <div className="mt-4 border rounded-xl flex flex-col relative overflow-hidden backdrop-blur-md bg-white/[0.02] border-white/10 shadow-2xl">
            {/* Terminal Header */}
            <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40 font-mono">System Config</span>
              <span className="text-xs text-[var(--pub-gold)] font-mono">PLEX-SYS-01</span>
            </div>
            {/* Terminal Body */}
            <div className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-2 flex items-center gap-2 text-[var(--pub-gold)] font-mono">
                <span>[</span> Essential Plan Limit <span>]</span>
              </h3>
              <p className="text-base leading-relaxed text-white/80">
                Start dynamically monitoring up to <strong className="font-semibold text-white">7 active states</strong> tailored to your agency's footprint, or deploy a <strong className="font-semibold text-[var(--pub-gold)]">Pro Node</strong> for unified 50-state telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Map HUD */}
        <div className="relative w-full h-auto select-none pointer-events-auto mt-8 lg:mt-0 flex justify-center lg:justify-end pr-0 lg:col-span-7">
          
          <div className="relative w-full max-w-[850px]" onMouseMove={handleMouseMove}>
            
            {/* HUD Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: "var(--pub-gold)", opacity: 0.5 }} />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: "var(--pub-gold)", opacity: 0.5 }} />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: "var(--pub-gold)", opacity: 0.5 }} />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: "var(--pub-gold)", opacity: 0.5 }} />

            <svg 
              ref={mapRef}
              viewBox="0 0 959 593" 
              className="w-full h-auto relative z-10 p-4 drop-shadow-2xl"
            >
              <defs>
                {/* Advanced Radar Stripe Pattern for active states - DARK MODE */}
                <pattern id="radarStripe" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <rect width="5" height="10" fill="rgba(201, 168, 76, 0.15)" />
                  <rect x="5" width="5" height="10" fill="transparent" />
                </pattern>
                
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--pub-gold)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--pub-gold)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* State Paths */}
              {Object.keys(usaMapDimensions).map((stateKey) => {
                const stateInfo = usaMapDimensions[stateKey as keyof typeof usaMapDimensions];
                const isEssential = ESSENTIAL_PLAN_STATES.includes(stateKey);
                const isHovered = hoveredState === stateKey;
                
                // Dark Mode Colors
                const fillBase = isEssential ? "url(#radarStripe)" : "rgba(255, 255, 255, 0.02)";
                const strokeBase = isEssential ? "var(--pub-gold)" : "rgba(255, 255, 255, 0.08)";
                
                const fillHover = "rgba(201, 168, 76, 0.35)";
                const strokeHover = "var(--pub-gold)";

                return (
                  <path
                    key={stateKey}
                    d={stateInfo.dimensions}
                    data-name={stateKey}
                    onMouseEnter={() => setHoveredState(stateKey)}
                    onMouseLeave={() => setHoveredState(null)}
                    className="transition-all duration-300 ease-out cursor-crosshair outline-none mix-blend-screen"
                    fill={isHovered ? fillHover : fillBase}
                    stroke={isHovered ? strokeHover : strokeBase}
                    strokeWidth={isHovered ? 2.5 : (isEssential ? 1.5 : 1)}
                    style={{
                      position: "relative",
                    }}
                  />
                );
              })}

              {/* Radar Nodes */}
              {RADAR_NODES.map((node) => (
                <g key={`node-${node.id}`} className="pointer-events-none mix-blend-screen">
                  {/* Outer pulse */}
                  <circle cx={node.x} cy={node.y} r="28" fill="url(#nodeGlow)" className="animate-pulse" style={{ animationDuration: "3s" }} />
                  {/* Inner dot */}
                  <circle cx={node.x} cy={node.y} r="3" fill="var(--pub-gold)" />
                  {/* Pin core */}
                  <circle cx={node.x} cy={node.y} r="1" fill="#fff" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Extreme HUD Tooltip */}
      <AnimatePresence>
        {hoveredState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="fixed pointer-events-none z-[100] backdrop-blur-md shadow-2xl overflow-hidden"
            style={{
              backgroundColor: "rgba(26, 26, 26, 0.8)", // Dark ink base
              borderColor: "var(--pub-gold)",
              borderWidth: "1px",
              left: mousePos.x + 24,
              top: mousePos.y + 24,
            }}
          >
            {/* Tooltip Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--pub-gold)]" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--pub-gold)]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--pub-gold)]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--pub-gold)]" />

            <div className="flex flex-col">
              <div className="px-4 py-1.5 border-b" style={{ borderColor: "rgba(201, 168, 76, 0.2)", backgroundColor: "rgba(201, 168, 76, 0.1)" }}>
                <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2" style={{ color: "var(--pub-gold)", fontFamily: "'Geist Mono', monospace" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--pub-gold)", boxShadow: "0 0 8px var(--pub-gold)" }}></span>
                  TARGET LOCK: [{hoveredState}]
                </span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-1.5">
                <span className="text-base font-semibold whitespace-nowrap text-white">
                  {usaMapDimensions[hoveredState as keyof typeof usaMapDimensions].name} Sector
                </span>
                <span className="text-xs whitespace-nowrap uppercase tracking-wider mt-1 flex justify-between gap-6" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Geist Mono', monospace" }}>
                  <span>ACTIVE FEED:</span>
                  <strong style={{ color: "var(--pub-gold)" }}>{getLiveStateValue(hoveredState).toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
