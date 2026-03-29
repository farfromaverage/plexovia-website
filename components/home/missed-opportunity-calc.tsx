"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Calculator, TrendingDown } from "lucide-react";

function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const duration = 600;
    const startValue = display;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + (value - startValue) * ease));

      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

export default function MissedOpportunityCalc() {
  const [contractValue, setContractValue] = useState(120000);
  const [missedPerMonth, setMissedPerMonth] = useState(3);
  const [liveScanned, setLiveScanned] = useState(15847);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/engine-stats");
        if (res.ok) {
          const data = await res.json();
          if (data.total_contracts) setLiveScanned(data.total_contracts);
        }
      } catch {
        // Fallback to initial value
      }
    }
    fetchStats();
  }, []);
  
  const annualLoss = contractValue * missedPerMonth * 12;
  const displayLoss = useAnimatedNumber(annualLoss);

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#0C0B0A] relative overflow-hidden border-t border-[rgba(255,255,255,0.05)]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] sm:w-[800px] sm:h-[400px] bg-[rgba(201,168,76,0.08)] blur-[100px] sm:blur-[120px] pointer-events-none rounded-[100%]" />

      <style dangerouslySetInnerHTML={{__html: `
        .dark-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          background: transparent;
          outline: none;
          margin: 0;
          padding: 0;
        }
        .dark-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: transparent;
          border-radius: 99px;
        }
        .dark-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #1C1917;
          border: 2px solid #D6D3D1;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: all 0.15s ease;
          margin-top: -9px;
        }
        .dark-slider::-moz-range-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: transparent;
          border-radius: 99px;
        }
        .dark-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #1C1917;
          border: 2px solid #D6D3D1;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          transition: all 0.15s ease;
        }
        .dark-slider:focus::-webkit-slider-thumb, .dark-slider:active::-webkit-slider-thumb {
          transform: scale(1.15);
          border-color: var(--accent);
          background: var(--accent);
        }
        .dark-slider:focus::-moz-range-thumb, .dark-slider:active::-moz-range-thumb {
          transform: scale(1.15);
          border-color: var(--accent);
          background: var(--accent);
        }
      `}} />

      <div className="mx-auto max-w-5xl relative z-10">
        <div className="mb-12 md:mb-16 max-w-3xl mx-auto text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)]"
          >
            <Calculator size={14} className="text-[var(--accent)]" />
            <span className="font-mono text-xs font-semibold tracking-widest uppercase text-[var(--accent)]">
              Impact Calculator
            </span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight"
            style={{ color: "#F5F3EE" }}
          >
            Your competitors are winning the contracts you never see.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#A8A29E] leading-relaxed max-w-2xl"
          >
            Over <strong className="text-white font-medium">{liveScanned.toLocaleString()}</strong> new government contracts were published in just the last 7 days. 
            While you rely on manual searches to check dozens of scattered portals, relevant opportunities are slipping through the cracks, and your competitors are capitalizing on them. Let's calculate the exact cost of losing those bids.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#1C1917] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row"
        >
          {/* Controls Side (Left Half) */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 lg:border-r border-[rgba(255,255,255,0.08)] flex flex-col justify-center space-y-10 sm:space-y-12">
            
            {/* Average Contract Value Slider */}
            <div className="relative group">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <label htmlFor="comp-value" className="text-base font-medium text-[#F5F3EE] flex items-center gap-2">
                    <Activity size={18} className="text-[#6B6560]" />
                    Average contract value
                  </label>
                  <p className="text-sm text-[#6B6560] mt-1">What is a typical win worth?</p>
                </div>
                <span className="font-mono text-2xl text-[var(--accent)] font-semibold tracking-tight">
                  ${contractValue.toLocaleString()}
                </span>
              </div>
              <div className="relative flex items-center h-6 w-full mb-2">
                <div className="absolute inset-x-0 h-[6px] rounded-full bg-[rgba(255,255,255,0.1)] pointer-events-none" />
                <div 
                  className="absolute left-0 h-[6px] rounded-full bg-[var(--accent)] pointer-events-none shadow-[0_0_10px_rgba(201,168,76,0.3)]"
                  style={{ width: `${((contractValue - 10000) / 490000) * 100}%` }}
                />
                <input
                  id="comp-value"
                  type="range"
                  min="10000"
                  max="500000"
                  step="10000"
                  value={contractValue}
                  onChange={(e) => setContractValue(Number(e.target.value))}
                  className="dark-slider relative z-10 block w-full"
                  aria-label="Average contract value slider"
                />
              </div>
            </div>

            {/* Bids Missed Slider */}
            <div className="relative group mt-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <label htmlFor="missed-bids" className="text-base font-medium text-[#F5F3EE] flex items-center gap-2">
                    <AlertTriangle size={18} className="text-[var(--alert)]" />
                    Opportunities you likely miss each month
                  </label>
                  <p className="text-sm text-[#6B6560] mt-1">Based on industry averages and your inputs</p>
                </div>
                <span className="font-mono text-2xl text-[var(--accent)] font-semibold tracking-tight">
                  {missedPerMonth}
                </span>
              </div>
              <div className="relative flex items-center h-6 w-full mb-2">
                <div className="absolute inset-x-0 h-[6px] rounded-full bg-[rgba(255,255,255,0.1)] pointer-events-none" />
                <div 
                  className="absolute left-0 h-[6px] rounded-full bg-[var(--accent)] pointer-events-none shadow-[0_0_10px_rgba(201,168,76,0.3)]" 
                  style={{ width: `${((missedPerMonth - 1) / 9) * 100}%` }}
                />
                <input
                  id="missed-bids"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={missedPerMonth}
                  onChange={(e) => setMissedPerMonth(Number(e.target.value))}
                  className="dark-slider relative z-10 block w-full"
                  aria-label="Missed bids per month slider"
                />
              </div>
            </div>
            
          </div>

          {/* Value Display Side (Right Half) */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-[#1C1917] to-[#111110] relative flex flex-col justify-center">
            {/* Internal glow for right panel */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="bg-red-500/10 p-2 rounded-full border border-red-500/20">
                <TrendingDown size={16} className="text-red-400" />
              </div>
              <h3 className="font-semibold text-xs tracking-widest uppercase" style={{ color: "#A8A29E" }}>
                Estimated revenue lost to missed opportunities
              </h3>
            </div>
            
            <div className="flex items-baseline gap-1 relative z-10 overflow-visible whitespace-nowrap mb-10">
              <span className="text-red-400 text-3xl font-semibold">
                $
              </span>
              <motion.span 
                key={displayLoss}
                initial={{ opacity: 0.8, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#F5F3EE] text-5xl sm:text-6xl tabular-nums font-mono font-bold tracking-tighter"
              >
                {displayLoss.toLocaleString()}
              </motion.span>
            </div>
            
            <div className="pt-8 border-t border-[rgba(255,255,255,0.08)] relative z-10 space-y-4">
              <p className="text-[#D6D3D1] text-base leading-relaxed font-medium">
                This is revenue you didn't even know existed.
              </p>
              <p className="text-[#D6D3D1] text-base leading-relaxed font-medium">
                While you're manually searching, competitors are finding and winning these contracts faster.
              </p>
              <p className="text-[var(--accent)] text-base leading-relaxed font-semibold">
                Plexovia ensures you never miss them again.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
