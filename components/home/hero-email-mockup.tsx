"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import { ShieldCheck, Server, AlertCircle, Sparkles, ChevronRight, BarChart3, Database, Workflow, Bell, Fingerprint, Zap } from "lucide-react";

const mockMatches = [
  {
    id: "dod-001",
    score: 98,
    title: "Zero Trust Architecture Implementation & Cyber Ops",
    agency: "Department of Defense (DoD)",
    value: "Est. $4.5M - $8.0M",
    dueDate: "April 30, 2026",
    naics: "541512",
    insight: "Strong past performance match. Security clearance requirements perfectly align with your profile. 'FedRAMP' keyword detected 14 times.",
    setAside: "Small Business",
  },
  {
    id: "gsa-002",
    score: 91,
    title: "Enterprise Cloud Migration & AI Modernization",
    agency: "General Services Administration (GSA)",
    value: "Est. $1.2M - $3.0M",
    dueDate: "May 12, 2026",
    naics: "541519",
    insight: "100% remote delivery authorized in SOW. High historical win probability based on previous GSA Schedule 70 awards.",
    setAside: "8(a) Competitive",
  },
];

/* ── HUD Process Step ────────────────────────────────────────────── */
function ProcessStep({ icon: Icon, text, active, completed, delay }: { icon: any, text: string, active: boolean, completed: boolean, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 ${active ? 'text-[#C9A84C]' : completed ? 'text-[#10B981]' : 'text-[#6B6560]'} transition-colors duration-500`}
    >
      <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${active ? 'border-[#C9A84C] bg-[#C9A84C]/10' : completed ? 'border-[#10B981] bg-[#10B981]/10' : 'border-[#332E2A] bg-[#1A1815]'}`}>
        <Icon size={12} className={active ? 'animate-pulse' : ''} />
        {active && (
          <span className="absolute inset-0 rounded-full border border-[#C9A84C] animate-ping opacity-50" />
        )}
      </div>
      <span className={`text-[12px] ${active || completed ? 'font-medium' : 'font-normal'} font-mono tracking-tight`}>
        {text}
      </span>
      {completed && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10B981]" />
      )}
      {active && (
        <div className="ml-auto flex gap-1">
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 rounded-full bg-[#C9A84C]" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-[#C9A84C]" />
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-[#C9A84C]" />
        </div>
      )}
    </motion.div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
export default function HeroEmailMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax float effect
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const floatY = useSpring(rawY, { stiffness: 40, damping: 20 });
  
  // Interactive glass lighting
  const mouseXpx = useMotionValue(0);
  const mouseYpx = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseXpx.set(e.clientX - rect.left);
    mouseYpx.set(e.clientY - rect.top);
  };

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const sequence = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2600),
      setTimeout(() => setPhase(4), 3600),
    ];
    return () => sequence.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ y: floatY }}
      className="relative w-full max-w-[580px] select-none mx-auto lg:mx-0 group z-10 perspective-[1200px]"
      aria-hidden="true"
    >
      {/* Intense glow matching the dark premium theme */}
      <div className="absolute -inset-12 -z-20 bg-gradient-to-br from-[#C9A84C]/20 via-transparent to-[#10B981]/10 blur-[80px] opacity-0 group-hover:opacity-70 transition-opacity duration-1000 rounded-[4rem] pointer-events-none" />

      {/* Main App Container */}
      <motion.div 
        layout
        className="relative rounded-[24px] overflow-hidden bg-[#141210] border border-[#332E2A]/60 shadow-[0_50px_100px_-20px_rgba(20,18,16,0.6)] group-hover:shadow-[0_40px_120px_-10px_rgba(201,168,76,0.15)] transition-all duration-700"
      >
        {/* Dynamic Spotlight */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50 will-change-transform"
          style={{
            background: useMotionTemplate`radial-gradient(600px circle at ${mouseXpx}px ${mouseYpx}px, rgba(201,168,76,0.08), transparent 80%)`
          }}
        />

        {/* Ambient top highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent opacity-50" />

        {/* Header - Advanced Notification Banner */}
        <div className="relative z-20 bg-[#1A1815] border-b border-[#332E2A]/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 shadow-[0_0_15px_rgba(201,168,76,0.2)]">
              <Bell size={14} className="text-[#C9A84C]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-[#F7F5F0] tracking-wide">Plexovia Intelligence</span>
              <span className="text-[10px] text-[#A8A29E] font-mono tracking-tight">DAILY DIGEST &middot; 06:00 AM</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-6 w-px bg-[#332E2A]" />
             <Fingerprint size={16} className="text-[#6B6560]" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="relative z-20 p-6 w-full bg-[#141210] min-h-[460px] overflow-hidden">
          
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />

          {/* Scanning HUD */}
          <div className="relative z-10 bg-[#1A1815]/80 backdrop-blur-md border border-[#2A2621] p-5 rounded-[16px] shadow-lg mb-6 flex flex-col gap-4">
            <h3 className="text-[10px] font-black text-[#6B6560] uppercase tracking-[0.15em] flex items-center gap-2">
              <Zap size={10} className="text-[#C9A84C]" /> System Operation
            </h3>
            
            <div className="flex flex-col gap-3">
              <ProcessStep icon={Database} text="Ingesting federal & state portals" active={phase === 0} completed={phase > 0} delay={0.1} />
              <AnimatePresence>
                {phase >= 1 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <ProcessStep icon={Workflow} text="Applying 541512 & 541519 NAICS filters" active={phase === 1} completed={phase > 1} delay={0} />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <ProcessStep icon={BarChart3} text="Scoring probabilistic win matrices" active={phase === 2} completed={phase > 2} delay={0} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {phase >= 3 && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                   className="pt-3 mt-1 border-t border-[#2A2621] flex justify-between items-center bg-[#C9A84C]/[0.02] -mx-5 -mb-5 px-5 py-4 rounded-b-[16px]"
                 >
                   <span className="flex items-center gap-2 text-[#C9A84C] font-semibold text-[13px]">
                     <Sparkles size={14} />
                     2 High-Value Matches Found
                   </span>
                   <span className="text-[11px] font-mono text-[#8A8580] bg-[#141210] px-2 py-1 rounded border border-[#2A2621]">
                     {mockMatches.length} / 14,832 Scanned
                   </span>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Matches */}
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 relative z-20"
              >
                {mockMatches.map((match, i) => (
                  <motion.div
                    key={match.id}
                    layout
                    initial={{ opacity: 0, y: 20, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: i * 0.25, type: "spring", stiffness: 200, damping: 20 }}
                    whileHover={{ scale: 1.02, y: -2, zIndex: 30 }}
                    className="group/match relative bg-gradient-to-b from-[#1C1917] to-[#161412] border border-[#332E2A]/80 rounded-[14px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] cursor-pointer overflow-hidden transition-all duration-300 transform-gpu"
                  >
                    {/* Sweep highlight */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[#C9A84C]/5 to-transparent -translate-x-[150%] group-hover/match:translate-x-[150%] transition-transform duration-[1.5s] ease-out pointer-events-none" />
                    
                    {/* Hover Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 blur-3xl rounded-full opacity-0 group-hover/match:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-3.5">
                      
                      {/* Top Row: Score & Tags */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center font-mono text-[14px] font-black tracking-tighter px-2.5 py-0.5 rounded shadow-inner ${match.score >= 95 ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 box-shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'}`}>
                            {match.score}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-[#8A8580] tracking-widest">Match Score</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-mono text-[10px] text-[#A8A29E] bg-[#141210] px-2 py-0.5 rounded border border-[#2A2621] uppercase tracking-wider shadow-sm">
                            {match.agency}
                          </span>
                        </div>
                      </div>

                      {/* Title & Data */}
                      <div>
                        <h4 className="text-[16px] sm:text-[18px] font-bold text-[#F7F5F0] leading-[1.3] group-hover/match:text-[#C9A84C] transition-colors line-clamp-2">
                          {match.title}
                        </h4>
                      </div>

                      {/* Value & Due Tag Row */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 text-[#E8E4DF] text-[12px] font-semibold bg-[#10B981]/10 px-2.5 py-1 rounded border border-[#10B981]/20">
                          <span className="text-[#10B981]">Value:</span> {match.value}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#E8E4DF] text-[12px] font-semibold bg-[#2A2621]/50 px-2.5 py-1 rounded border border-[#332E2A]">
                          Deadline: {match.dueDate}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#C4B5FD] text-[12px] font-semibold bg-[#6D28D9]/15 px-2.5 py-1 rounded border border-[#6D28D9]/30">
                          {match.setAside}
                        </div>
                      </div>

                      {/* AI Rationale Block */}
                      <div className="mt-1 bg-[#1A1815]/80 backdrop-blur-sm border border-[#C9A84C]/20 rounded-[10px] p-3 flex items-start gap-3 shadow-inner relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#C9A84C] to-transparent opacity-50" />
                        <Sparkles size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
                        <p className="text-[12px] text-[#A8A29E] leading-relaxed">
                          <span className="font-bold text-[#C9A84C] mr-1.5">Intelligence:</span>
                          {match.insight}
                        </p>
                      </div>

                    </div>
                  </motion.div>
                ))}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
