"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import { ShieldCheck, Server, AlertCircle, Sparkles, ChevronRight, BarChart3, Database } from "lucide-react";

const mockMatches = [
  {
    id: "dod-001",
    score: 98,
    title: "Zero Trust Architecture Implementation",
    agency: "Department of Defense (DoD)",
    value: "Est. $4.5M - $8M",
    dueDate: "April 30, 2026",
    naics: "541512",
    insight: "Strong past performance match. Security clearance requirements align with your profile. 'FedRAMP' keyword detected 14 times.",
  },
  {
    id: "gsa-002",
    score: 91,
    title: "Enterprise Cloud Migration Services",
    agency: "General Services Administration (GSA)",
    value: "Est. $1.2M - $3M",
    dueDate: "May 12, 2026",
    naics: "541519",
    insight: "Set-aside for Small Business. 100% remote delivery authorized in SOW. High historical win rate for this capability.",
  },
];

function ScanningHUD({ phase }: { phase: number }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length < 3 ? d + "." : ""), 300);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative z-10 bg-[#141210]/95 backdrop-blur-xl border border-[#2A2621] p-4 rounded-xl shadow-2xl overflow-hidden min-h-[140px] flex flex-col justify-center">
       {/* Background grid */}
       <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#C9A84C 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
       
       <div className="space-y-3 font-mono text-[11px] sm:text-[12px] relative z-10 w-full">
         <div className="flex items-center justify-between text-[#8A8580]">
           <span className="flex items-center gap-2">
             <Database size={13} className="text-[#C9A84C]" />
             <span>Ingesting federal & state portals</span>
           </span>
           {phase >= 1 ? <span className="text-[#10B981] font-semibold">14,832 records</span> : <span>{dots}</span>}
         </div>
         
         <AnimatePresence>
           {phase >= 1 && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center justify-between text-[#8A8580] overflow-hidden">
               <span className="flex items-center gap-2">
                 <Server size={13} className="text-[#C9A84C]" />
                 <span>Applying NAICS & NLP capability matrix</span>
               </span>
               {phase >= 2 ? <span className="text-[#10B981] font-semibold">Processed</span> : <span>{dots}</span>}
             </motion.div>
           )}
         </AnimatePresence>

         <AnimatePresence>
           {phase >= 2 && (
             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center justify-between text-[#8A8580] overflow-hidden">
               <span className="flex items-center gap-2">
                 <BarChart3 size={13} className="text-[#C9A84C]" />
                 <span>Scoring probabilistic win rates</span>
               </span>
               {phase >= 3 ? <span className="text-[#10B981] font-semibold">Done</span> : <span>{dots}</span>}
             </motion.div>
           )}
         </AnimatePresence>

         <AnimatePresence>
           {phase >= 3 && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 mt-2 border-t border-[#2A2621] flex justify-between items-center">
               <span className="flex items-center gap-2 text-[#E8E4DF] font-semibold font-sans">
                 <Sparkles size={14} className="text-[#C9A84C]" />
                 2 High-Value Opportunities Identified
               </span>
               <span className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
               </span>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
    </div>
  );
}

export default function HeroEmailMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax float effect
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const floatY = useSpring(rawY, { stiffness: 50, damping: 20 });
  
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
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => setPhase(3), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ y: floatY }}
      className="relative w-full max-w-[540px] select-none mx-auto lg:mx-0 group z-10 perspective-[1000px]"
      aria-hidden="true"
    >
      {/* Intense glow matching the dark premium theme */}
      <div className="absolute -inset-10 -z-20 bg-gradient-to-br from-[#C9A84C]/20 to-transparent blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000 rounded-[3rem] pointer-events-none" />

      {/* Main App Container */}
      <motion.div 
        layout
        className="relative rounded-2xl overflow-hidden bg-[#1D1A17] border border-[#332E2A] shadow-[0_40px_100px_-20px_rgba(28,25,23,0.3)] group-hover:shadow-[0_40px_100px_-10px_rgba(201,168,76,0.15)] transition-shadow duration-700"
      >
        {/* Dynamic Spotlight */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 will-change-transform"
          style={{
            background: useMotionTemplate`radial-gradient(600px circle at ${mouseXpx}px ${mouseYpx}px, rgba(201,168,76,0.06), transparent 80%)`
          }}
        />

        {/* Header - Advanced Notification Banner */}
        <div className="relative z-20 bg-[#141210] border-b border-[#332E2A] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#2A2621] border border-[#3A3530]">
              <ShieldCheck size={12} className="text-[#C9A84C]" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#E8E4DF] uppercase tracking-wider">Plexovia Core</span>
              <span className="text-[10px] text-[#8A8580] font-mono">06:00 AM • OVERNIGHT RUN</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]"></span>
            </span>
            <span className="text-[9px] font-bold text-[#10B981] uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="relative z-20 p-5 w-full bg-[#1A1815] min-h-[400px]">
          {/* Scanning HUD */}
          <ScanningHUD phase={phase} />

          {/* AI Matches */}
          <AnimatePresence>
            {phase >= 3 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 space-y-4"
              >
                {mockMatches.map((match, i) => (
                  <motion.div
                    key={match.id}
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.2 + 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ y: -4, scale: 1.015, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.3)" }}
                    className="group/match relative bg-[#221F1C] border border-[#332E2A] rounded-xl p-4 shadow-lg cursor-pointer overflow-hidden z-30 transition-all duration-300"
                  >
                    {/* Sweep highlight */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[#C9A84C]/5 to-transparent -translate-x-[150%] group-hover/match:translate-x-[150%] transition-transform duration-700 ease-in-out pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-3">
                      
                      {/* Top Row: Score & Tags */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Score Badge */}
                          <div className={`flex items-center justify-center font-mono text-[13px] font-black tracking-tighter px-2 py-0.5 rounded shadow-inner ${match.score >= 95 ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' : 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'}`}>
                            {match.score}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-[#8A8580] tracking-wider">Match</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#A8A29E] bg-[#141210] px-2 py-0.5 rounded border border-[#2A2621]">
                          NAICS: {match.naics}
                        </div>
                      </div>

                      {/* Title & Agency */}
                      <div>
                        <h4 className="text-[15px] sm:text-[16px] font-bold text-[#F7F5F0] leading-snug group-hover/match:text-[#C9A84C] transition-colors line-clamp-2">
                          {match.title}
                        </h4>
                        <p className="text-[12px] text-[#8A8580] font-medium mt-1 truncate">
                          {match.agency}
                        </p>
                      </div>

                      {/* Data Row */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="flex items-center gap-1.5 text-[#E8E4DF] text-[12px] font-medium bg-[#1A1815] px-2 py-1 rounded border border-[#2A2621]">
                          <span className="text-[#8A8580]">Value:</span> {match.value}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#E8E4DF] text-[12px] font-medium bg-[#1A1815] px-2 py-1 rounded border border-[#2A2621]">
                          <span className="text-[#8A8580]">Closes in:</span> <span className="text-[#EF4444]">{match.dueDate}</span>
                        </div>
                      </div>

                      {/* AI Rationale Block */}
                      <div className="mt-1 bg-[#161412] border border-[#2A2621] rounded-lg p-2.5 flex items-start gap-2.5">
                        <Sparkles size={12} className="text-[#C9A84C] mt-0.5 shrink-0" />
                        <p className="text-[11px] text-[#A8A29E] leading-relaxed">
                          <span className="font-semibold text-[#C9A84C] mr-1">AI Reasoning:</span>
                          {match.insight}
                        </p>
                      </div>

                    </div>
                  </motion.div>
                ))}

                {/* View All Button */}
                <motion.button
                  whileHover={{ backgroundColor: "#2A2621" }}
                  className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-[12px] font-bold text-[#C9A84C] uppercase tracking-wider border border-[#332E2A] rounded-xl bg-[#1A1815] transition-colors"
                >
                  View 11 Other Matches
                  <ChevronRight size={14} />
                </motion.button>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
