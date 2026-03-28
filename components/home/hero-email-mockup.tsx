"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import MatchScoreBadge from "@/components/ui/match-score-badge";

const mockMatches = [
  {
    id:     "fdic-001",
    score:  94,
    title:  "Network Infrastructure Modernization",
    agency: "FDIC (Federal Deposit Insurance Corp)",
    state:  "VA",
    due:    "Apr 30, 2026",
    naics:  "541511",
  },
  {
    id:     "gsa-003",
    score:  86,
    title:  "IT Security Assessment Support",
    agency: "GSA (Federal Acquisition Service)",
    state:  "DC",
    due:    "May 24, 2026",
    naics:  "541519",
  },
  {
    id:     "navy-002",
    score:  71,
    title:  "Facilities Management Services",
    agency: "Naval Surface Warfare Center",
    state:  "MD",
    due:    "May 12, 2026",
    naics:  "561210",
  },
];

function TerminalLogs({ phase }: { phase: number }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length < 3 ? d + "." : ""), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-mono text-[11px] sm:text-[12px] text-[var(--pub-muted)] bg-[var(--pub-bg)]/80 border border-[var(--pub-border)] shadow-inner rounded-xl p-4 space-y-2.5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
         <span className="flex items-center gap-2">
           <span className="text-[var(--accent)] font-bold">❯</span>
           <span className="text-[var(--pub-text)]">Initializing SAM.gov data stream</span>
         </span>
         {phase >= 1 ? <span className="text-[#16A34A] font-bold">OK</span> : <span className="font-medium text-[var(--pub-muted)]">{dots}</span>}
      </div>
      
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center justify-between overflow-hidden">
             <span className="flex items-center gap-2">
               <span className="text-[var(--accent)] font-bold">❯</span>
               <span className="text-[var(--pub-text)]">Analyzing 14,832 new solicitations</span>
             </span>
             {phase >= 2 ? <span className="text-[#16A34A] font-bold">OK</span> : <span className="font-medium text-[var(--pub-muted)]">{dots}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase >= 2 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center justify-between overflow-hidden">
             <span className="flex items-center gap-2">
               <span className="text-[var(--accent)] font-bold">❯</span>
               <span className="text-[var(--pub-text)]">Applying capability matrix filters</span>
             </span>
             {phase >= 3 ? <span className="text-[#16A34A] font-bold">OK</span> : <span className="font-medium text-[var(--pub-muted)]">{dots}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase >= 3 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between border-t border-[var(--pub-border)]/80 pt-2.5 mt-1">
             <span className="flex items-center gap-2 text-[var(--pub-text)] font-semibold">
               <span className="text-[#16A34A]">✓</span>
               Found 3 high-probability matches.
             </span>
             <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
             </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HeroEmailMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const floatY = useSpring(rawY, { stiffness: 60, damping: 20 });
  
  // 3D Tilt & Lighting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const mouseXpx = useMotionValue(0);
  const mouseYpx = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ["3deg", "-3deg"]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-3deg", "3deg"]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x / rect.width - 0.5);
    mouseY.set(y / rect.height - 0.5);
    mouseXpx.set(x);
    mouseYpx.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2800);
    const t3 = setTimeout(() => setPhase(3), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ y: floatY, rotateX, rotateY, transformPerspective: 1200 }}
      className="relative w-full max-w-[500px] select-none mx-auto lg:mx-0 group z-10"
      aria-hidden="true"
    >
       {/* Ambient Backglow */}
       <motion.div 
         className="absolute -inset-10 -z-20 rounded-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 blur-3xl pointer-events-none"
         style={{
           background: useMotionTemplate`radial-gradient(circle at ${useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"])} ${useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"])}, rgba(201,168,76,0.3) 0%, transparent 60%)`
         }}
       />

       {/* Outer Frame with Glassmorphism */}
       <motion.div 
         layout
         className="relative rounded-2xl overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_32px_80px_-16px_rgba(28,25,23,0.1),0_0_0_1px_rgba(28,25,23,0.02)] transition-shadow duration-700 group-hover:shadow-[0_40px_100px_-20px_rgba(201,168,76,0.25),0_0_0_1px_rgba(201,168,76,0.2)]"
       >
         {/* Inner Hover Spotlight */}
         <motion.div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 mix-blend-overlay"
            style={{
              background: useMotionTemplate`radial-gradient(400px circle at ${mouseXpx}px ${mouseYpx}px, rgba(201,168,76,0.3), transparent 80%)`
            }}
         />

         {/* Scanning Laser Array */}
         <AnimatePresence>
           {phase < 3 && (
             <motion.div
               initial={{ top: "0%" }}
               animate={{ top: ["0%", "100%", "0%"] }}
               transition={{ duration: 3, ease: "linear", repeat: Infinity }}
               className="pointer-events-none absolute left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent z-40 opacity-70 shadow-[0_0_12px_var(--accent)]"
               exit={{ opacity: 0, transition: { duration: 0.5 } }}
             />
           )}
         </AnimatePresence>

         {/* Mockup Header - Mac OS Style */}
         <div className="relative z-20 bg-[var(--pub-surface)]/90 px-5 py-3.5 border-b border-[var(--pub-border)]/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E5E5EA] border border-[#D1D1D6] group-hover:bg-[#FF5F56] transition-colors duration-300" />
              <span className="w-3 h-3 rounded-full bg-[#E5E5EA] border border-[#D1D1D6] group-hover:bg-[#FFBD2E] transition-colors duration-300 delay-75" />
              <span className="w-3 h-3 rounded-full bg-[#E5E5EA] border border-[#D1D1D6] group-hover:bg-[#27C93F] transition-colors duration-300 delay-150" />
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
              <h2 className="text-[12px] font-bold text-[var(--pub-text)] tracking-wider uppercase font-sans whitespace-nowrap">
                Plexovia Engine <span className="text-[var(--accent)] font-mono text-[10px]">v2.4</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 overflow-hidden rounded-full bg-[var(--pub-bg)] border border-[var(--pub-border)] px-2 py-0.5 shadow-sm">
               <motion.span 
                 animate={{ opacity: [1, 0.4, 1] }} 
                 transition={{ duration: 1.5, repeat: Infinity }} 
                 className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shadow-[0_0_8px_rgba(22,163,74,0.6)]" 
               />
               <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--pub-text)]">System Log</span>
            </div>
         </div>

         {/* Body */}
         <div className="relative z-20 p-5 w-full bg-gradient-to-b from-white/95 to-white/60 min-h-[300px]">
           <TerminalLogs phase={phase} />

           <AnimatePresence>
             {phase >= 3 && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 className="mt-5 space-y-3.5"
               >
                 {mockMatches.map((match, i) => (
                   <motion.div
                      key={match.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.15, type: "spring", stiffness: 350, damping: 25 }}
                      whileHover={{ y: -3, scale: 1.02, boxShadow: "0 16px 40px -10px rgba(28,25,23,0.1), 0 0 0 1px var(--accent)" }}
                      className="group/card relative bg-[var(--pub-surface)] border border-[var(--pub-border)] rounded-xl p-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] cursor-pointer overflow-hidden z-30 transition-shadow transition-transform"
                   >
                    {/* Inner Sweep Hover Effect */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[var(--pub-surface-2)]/60 to-transparent -translate-x-[150%] group-hover/card:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-4">
                      
                      <div className="flex items-start gap-3 w-full">
                        <div className="relative flex-shrink-0 mt-0.5">
                           <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-0 group-hover/card:opacity-30 group-hover/card:animate-ping transition-opacity" />
                           <MatchScoreBadge score={match.score} className="relative z-20 bg-white shadow-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[14px] font-bold text-[var(--pub-text)] leading-[1.3] font-sans pr-2 group-hover/card:text-[var(--accent)] transition-colors">
                            {match.title}
                          </h4>
                          <p className="text-[12px] text-[var(--pub-muted)] font-medium font-sans mt-[3px] truncate">{match.agency}</p>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3 pt-3 border-t border-[var(--pub-border)]/60">
                            <div className="flex items-center gap-1.5 bg-[var(--pub-bg)] rounded py-0.5 px-2 border border-[var(--pub-border)]/60">
                              <span className="text-[9px] uppercase font-bold text-[var(--pub-muted)] tracking-wider shrink-0">NAICS</span>
                              <span className="text-[11px] font-mono text-[var(--pub-text)] font-semibold">{match.naics}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-[var(--pub-bg)] rounded py-0.5 px-2 border border-[var(--pub-border)]/60">
                              <span className="text-[9px] uppercase font-bold text-[var(--pub-muted)] tracking-wider shrink-0">STATE</span>
                              <span className="text-[11px] font-mono text-[var(--pub-text)] font-semibold">{match.state}</span>
                            </div>
                            <div className="flex items-center justify-end flex-grow gap-1.5 ml-auto">
                              <span className="text-[9px] uppercase font-bold text-[var(--pub-muted)] tracking-wider shrink-0">DUE</span>
                              <span className="text-[11px] font-mono text-[var(--pub-text)] font-bold">{match.due}</span>
                            </div>
                          </div>
                        </div>
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
