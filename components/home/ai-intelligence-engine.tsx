"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Database, Server, Cpu, CheckCircle2, ChevronRight, Zap, Target } from "lucide-react";

// Mock contract data for the animation flow
const mockContracts = [
  {
    id: "dod-1",
    agency: "Department of Defense",
    title: "Zero Trust Architecture Implementation",
    value: "$4.5M - $8.0M",
    naics: "541512",
    setAside: "Small Business",
    scoreStart: 42,
    scoreEnd: 96,
  },
  {
    id: "gsa-1",
    agency: "General Services Administration",
    title: "Enterprise Cloud Migration",
    value: "$1.2M - $3.0M",
    naics: "541519",
    setAside: "8(a) Competitive",
    scoreStart: 31,
    scoreEnd: 92,
  },
  {
    id: "hhs-1",
    agency: "Health & Human Services",
    title: "Healthcare Data Analytics Platform",
    value: "$2.5M - $5.0M",
    naics: "541511",
    setAside: "SDVOSB",
    scoreStart: 55,
    scoreEnd: 98,
  }
];

export default function AiIntelligenceEngine() {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState("ingesting"); // ingesting, processing, outputting
  const [score, setScore] = useState(0);
  const [liveContracts, setLiveContracts] = useState<any[]>(mockContracts);
  const [totalScanned, setTotalScanned] = useState(14832);

  useEffect(() => {
    async function fetchLiveEngineData() {
      try {
        const res = await fetch("/api/engine-stats");
        if (res.ok) {
          const data = await res.json();
          if (data.total_contracts) {
            setTotalScanned(data.total_contracts);
          }
          if (data.recent_contracts && data.recent_contracts.length > 0) {
            // Map the engine JSON to our animation object structure cleanly
            const mapped = data.recent_contracts.slice(0, 5).map((row: any, i: number) => ({
              id: `live-${i}`,
              agency: row.agency || "Federal Agency",
              title: row.title,
              value: row.value_min ? `$${(row.value_min / 1000000).toFixed(1)}M+` : "Undisclosed",
              naics: row.naics_code || "Multiple",
              setAside: row.set_aside || "Full & Open",
              scoreStart: Math.floor(Math.random() * 20) + 30, // 30-50 start
              scoreEnd: Math.floor(Math.random() * 8) + 91, // 91-98 highly matched finish
            }));
            setLiveContracts(mapped);
          }
        }
      } catch (err) {
        // silently fallback to mock defaults
      }
    }
    fetchLiveEngineData();
    
    // Poll every 15 seconds to sync visualization with database
    const interval = setInterval(fetchLiveEngineData, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeContract = liveContracts[cycle % liveContracts.length];

  // Engine Animation Loop
  useEffect(() => {
    let scoreInterval: NodeJS.Timeout;
    
    // Phase 1: Ingesting (0-1.5s)
    setPhase("ingesting");
    
    // Phase 2: Processing (1.5s - 3.5s)
    const t1 = setTimeout(() => {
      setPhase("processing");
      setScore(activeContract.scoreStart);
      
      // Animate score up
      const duration = 1500;
      const steps = 30;
      const stepTime = duration / steps;
      const scoreDiff = activeContract.scoreEnd - activeContract.scoreStart;
      
      let currentStep = 0;
      scoreInterval = setInterval(() => {
        currentStep++;
        setScore(Math.floor(activeContract.scoreStart + (scoreDiff * (currentStep / steps))));
        if (currentStep >= steps) clearInterval(scoreInterval);
      }, stepTime);
      
    }, 1500);
    
    // Phase 3: Outputting (3.5s - 5.5s)
    const t2 = setTimeout(() => {
      setPhase("outputting");
    }, 3500);

    // Reset and next cycle
    const t3 = setTimeout(() => {
      setCycle(c => c + 1);
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (scoreInterval) clearInterval(scoreInterval);
    };
  }, [cycle, activeContract]);

  return (
    <div className="relative w-full max-w-[500px] h-[600px] mx-auto flex flex-col items-center select-none perspective-[1000px] font-sans">
      
      {/* 1. INPUT LAYER (Data Ingestion) */}
      <div className="relative w-full h-[120px] mb-4 flex justify-center items-end">
        {/* Streams */}
        <div className="absolute inset-0 flex justify-center items-end gap-12 overflow-hidden pointer-events-none opacity-60">
          <Stream delay={0} />
          <Stream delay={0.4} />
          <Stream delay={0.8} />
        </div>

        {/* Portals */}
        <div className="relative z-10 flex gap-4 -translate-y-4">
          <InputNode label="SAM.gov" active={phase === "ingesting"} icon={Database} delay={0} />
          <InputNode label="State Portals" active={phase === "ingesting"} icon={Server} delay={0.2} />
          <InputNode label="Local Gov" active={phase === "ingesting"} icon={Target} delay={0.4} />
        </div>
      </div>

      {/* 2. PROCESSING LAYER (AI Engine Core) */}
      <div className="relative z-20 w-full max-w-[420px] rounded-2xl bg-[#141210] border border-[#2E2C2A] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] p-6 mb-6 overflow-hidden">
        {/* Ambient Core Glow */}
        <motion.div 
          animate={{ 
            opacity: phase === "processing" ? 0.8 : 0.2,
            scale: phase === "processing" ? 1.05 : 0.95 
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,168,76,0.1),transparent_70%)] pointer-events-none"
        />

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2E2C2A]/50">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#C9A84C]" />
            <span className="text-xs font-bold text-[#E8E4DF] tracking-widest uppercase">Engine Core</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <motion.div 
                key={i}
                animate={{ opacity: phase === "processing" ? [0.3, 1, 0.3] : 0.2 }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]"
              />
            ))}
          </div>
        </div>

        {/* Processing Animation */}
        <div className="relative h-[80px] flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {phase === "ingesting" && (
              <motion.div 
                key="ingesting"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="text-[#8A8580] text-sm font-mono tracking-wider"
              >
                Scanning {totalScanned.toLocaleString()} Solicitations...
              </motion.div>
            )}

            {phase === "processing" && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
                className="flex items-center gap-6"
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#8A8580] uppercase tracking-wider mb-1">Match Score</span>
                  <div className="text-4xl font-extrabold text-[#C9A84C] font-mono tabular-nums">
                    {score}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <ProcessTag text="NAICS Aligned" delay={0.2} />
                  <ProcessTag text="Competition: Low" delay={0.6} />
                </div>
              </motion.div>
            )}

            {phase === "outputting" && (
              <motion.div 
                key="outputting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-[#10B981] flex items-center gap-2 text-sm font-mono tracking-wider"
              >
                <CheckCircle2 size={16} /> Priority Match Found
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. OUTPUT LAYER (High-Value Results) */}
      <div className="relative w-full max-w-[460px] h-[180px] perspective-[800px]">
        <AnimatePresence>
          {phase === "outputting" && (
            <motion.div
              key={activeContract.id}
              initial={{ opacity: 0, y: -40, rotateX: 15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute inset-0 w-full bg-[#1C1917] rounded-xl border border-[#C9A84C]/30 shadow-[0_20px_40px_rgba(201,168,76,0.15)] p-5 z-30"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/10 blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] uppercase font-bold text-[#8A8580] tracking-widest px-2 py-1 bg-[#141210] rounded border border-[#2E2C2A]">
                  {activeContract.agency}
                </span>
                <div className="flex items-center gap-1.5 bg-[#C9A84C]/10 px-2 py-0.5 rounded border border-[#C9A84C]/30 text-[#C9A84C]">
                  <Zap size={10} className="fill-[#C9A84C]" />
                  <span className="text-[11px] font-bold font-mono">{activeContract.scoreEnd} SCORE</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white leading-tight mb-4">
                {activeContract.title}
              </h3>

              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded border border-[#10B981]/20">
                  Value: {activeContract.value}
                </span>
                <span className="text-[#E8E4DF] bg-[#2E2C2A] px-2 py-1 rounded border border-[#3A3835]">
                  {activeContract.setAside}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stack behind the active card to imply history/volume */}
        <div className="absolute top-4 left-4 right-4 h-full bg-[#1A1815] rounded-xl border border-[#2E2C2A] opacity-50 translate-z-[-20px] scale-[0.96] z-20 shadow-lg" />
        <div className="absolute top-8 left-8 right-8 h-full bg-[#141210] rounded-xl border border-[#2E2C2A] opacity-30 translate-z-[-40px] scale-[0.92] z-10 shadow-lg" />
      </div>

    </div>
  );
}

function Stream({ delay }: { delay: number }) {
  return (
    <div className="relative w-px h-full bg-gradient-to-b from-transparent via-[#C9A84C]/40 to-transparent">
      <motion.div 
        animate={{ y: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-12 bg-[#C9A84C] blur-[2px] rounded-full"
      />
    </div>
  );
}

function InputNode({ label, active, delay, icon: Icon }: { label: string, active: boolean, delay: number, icon: any }) {
  return (
    <motion.div 
      animate={{ 
        y: active ? [0, -4, 0] : 0,
        borderColor: active ? "rgba(201,168,76,0.5)" : "rgba(46,44,42,1)",
        backgroundColor: active ? "rgba(255,255,255,1)" : "rgba(247,245,240,1)", 
      }}
      transition={{ duration: 2, repeat: Infinity, delay }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white shadow-sm"
    >
      <Icon size={14} className={active ? "text-[#C9A84C]" : "text-[#A8A29E]"} />
      <span className="text-[11px] font-bold text-[#6B6560] tracking-wide uppercase">{label}</span>
      {active && (
         <motion.div 
           initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
           className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-1" 
         />
      )}
    </motion.div>
  );
}

function ProcessTag({ text, delay }: { text: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded text-[11px] font-mono text-[#C9A84C]"
    >
      <ShieldCheck size={12} />
      {text}
    </motion.div>
  );
}
