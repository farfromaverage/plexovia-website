"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const duration = 600;
    const startValue = display;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
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
  const [missedPerMonth, setMissedPerMonth] = useState(2);
  const [liveScanned, setLiveScanned] = useState(15847);

  // Connect to engine to grab actual contract scan volume to make the pain real
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/engine-stats");
        if (res.ok) {
          const data = await res.json();
          if (data.total_contracts) setLiveScanned(data.total_contracts);
        }
      } catch {
        // Fallback to initial value silently
      }
    }
    fetchStats();
  }, []);
  
  const annualLoss = contractValue * missedPerMonth * 12;
  const displayLoss = useAnimatedNumber(annualLoss);

  return (
    <section className="py-24 px-5 sm:px-8 bg-[var(--pub-bg)] border-b border-[var(--pub-border)]">
      <style dangerouslySetInnerHTML={{__html: `
        .gold-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: #E2DDD6;
          border-radius: 99px;
          outline: none;
          transition: background 0.2s;
        }
        .gold-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid var(--accent);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(28,25,23,0.1), 0 0 0 0 rgba(201,168,76,0);
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
        }
        .gold-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid var(--accent);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(28,25,23,0.1), 0 0 0 0 rgba(201,168,76,0);
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
        }
        .gold-slider::-webkit-slider-thumb:hover,
        .gold-slider:active::-webkit-slider-thumb {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(28,25,23,0.12), 0 0 0 8px rgba(201,168,76,0.15);
        }
        .gold-slider::-moz-range-thumb:hover,
        .gold-slider:active::-moz-range-thumb {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(28,25,23,0.12), 0 0 0 8px rgba(201,168,76,0.15);
        }
        .slider-track {
          position: absolute;
          height: 8px;
          background: var(--accent);
          border-radius: 99px;
          pointer-events: none;
          top: 0;
          left: 0;
        }
      `}} />

      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[var(--pub-text)] font-extrabold tracking-tight mb-4">
            The hidden cost of manual searches.
          </h2>
          <p className="text-lg sm:text-xl text-[var(--pub-muted)] max-w-2xl mx-auto">
            We discovered <strong className="text-[var(--pub-text)] font-semibold">{liveScanned.toLocaleString()}</strong> government contracts in the last 7 days. If you're checking manually, you are missing bids. Let's calculate the exact cost.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Controls Side */}
          <div className="bg-[#FFFFFF] border border-[#E2DDD6] rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="space-y-10">
              
              {/* Average Contract Value Slider */}
              <div className="relative">
                <div className="flex justify-between items-end mb-4">
                  <label htmlFor="comp-value" className="text-sm font-semibold text-[var(--pub-text)]">
                    Average contract value
                  </label>
                  <span className="font-mono text-lg text-[var(--accent)] font-semibold border-b border-[var(--accent-bg-pub)]">
                    ${contractValue.toLocaleString()}
                  </span>
                </div>
                <div className="relative pt-2">
                  <input
                    id="comp-value"
                    type="range"
                    min="10000"
                    max="500000"
                    step="10000"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="gold-slider relative z-10 w-full bg-transparent"
                    aria-label="Average contract value slider"
                  />
                  <div className="absolute top-2 w-full h-2 bg-[#E2DDD6] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--accent)]" 
                      style={{ width: `${((contractValue - 10000) / 490000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bids Missed Slider */}
              <div className="relative">
                <div className="flex justify-between items-end mb-4">
                  <label htmlFor="missed-bids" className="text-sm font-semibold text-[var(--pub-text)]">
                    Bids missed per month
                  </label>
                  <span className="font-mono text-lg text-[var(--pub-text)] font-semibold border-b border-[var(--pub-border)]">
                    {missedPerMonth}
                  </span>
                </div>
                <div className="relative pt-2">
                  <input
                    id="missed-bids"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={missedPerMonth}
                    onChange={(e) => setMissedPerMonth(Number(e.target.value))}
                    className="gold-slider relative z-10 w-full bg-transparent"
                    aria-label="Missed bids per month slider"
                  />
                  <div className="absolute top-2 w-full h-2 bg-[#E2DDD6] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#1C1917]" 
                      style={{ width: `${((missedPerMonth - 1) / 9) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#E2DDD6] flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#16A34A] text-white flex-shrink-0 bg-opacity-10 text-[#16A34A] font-bold text-xs">i</span>
              <p className="text-xs text-[var(--pub-muted)] leading-relaxed">
                Most contractors miss 3-5 relevant bids per month simply because they didn't check the specific state portal where it was posted.
              </p>
            </div>
          </div>

          {/* Value Display Side */}
          <div className="flex flex-col justify-center h-full sm:px-6">
            <h3 className="text-[var(--pub-muted)] font-semibold text-sm uppercase tracking-wider mb-2">
              Annual Lost Revenue
            </h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[var(--pub-text)] text-5xl sm:text-6xl font-extrabold tracking-tighter">
                $
              </span>
              <motion.span 
                key={displayLoss}
                initial={{ opacity: 0.8, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--accent)] text-6xl sm:text-7xl lg:text-8xl tabular-nums font-mono font-bold tracking-tighter drop-shadow-[0_4px_16px_rgba(201,168,76,0.3)]"
              >
                {displayLoss.toLocaleString()}
              </motion.span>
            </div>
            
            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-lg p-4 mt-2">
              <p className="text-[#DC2626] font-medium leading-snug">
                That number is what your competitors earned from the bids you missed this year. Stop leaving money on the table.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
