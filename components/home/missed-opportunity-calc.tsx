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
  const [missedPerMonth, setMissedPerMonth] = useState(2);
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
    <section className="py-32 px-5 sm:px-8 bg-[var(--pub-bg)] border-b border-[var(--pub-border)]">
      <style dangerouslySetInnerHTML={{__html: `
        .premium-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: transparent;
          outline: none;
        }
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid var(--pub-text);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(28,25,23,0.08);
          transition: transform 0.1s;
          margin-top: -9px;
        }
        .premium-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid var(--pub-text);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(28,25,23,0.08);
          transition: transform 0.1s;
        }
        .premium-slider:active::-webkit-slider-thumb {
          transform: scale(1.1);
          border-color: var(--accent);
        }
        .premium-slider:active::-moz-range-thumb {
          transform: scale(1.1);
          border-color: var(--accent);
        }
        .track-bg {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 0;
          right: 0;
          height: 6px;
          border-radius: 99px;
          background: var(--pub-border);
          pointer-events: none;
        }
        .track-fill {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 0;
          height: 6px;
          border-radius: 99px;
          background: var(--accent);
          pointer-events: none;
        }
      `}} />

      <div className="mx-auto max-w-5xl">
        <div className="mb-16 md:mb-24 max-w-3xl">
          <h2 className="text-3xl sm:text-5xl text-[var(--pub-text)] font-semibold tracking-tight mb-6 leading-tight">
            The hidden cost of manual searches.
          </h2>
          <p className="text-lg sm:text-xl text-[var(--pub-muted)] leading-relaxed">
            We discovered <strong className="text-[var(--pub-text)] font-medium">{liveScanned.toLocaleString()}</strong> government contracts in the last 7 days. 
            If your team relies on manual checks across dozens of state portals, you are missing relevant bids right now. Let's calculate the exact impact on your pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Controls Side */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-12">
            
            {/* Average Contract Value Slider */}
            <div>
              <div className="flex justify-between items-end mb-4 sm:mb-6">
                <label htmlFor="comp-value" className="text-base sm:text-lg font-medium text-[var(--pub-text)]">
                  Average contract value
                </label>
                <span className="font-mono text-xl sm:text-2xl text-[var(--pub-text)] font-semibold">
                  ${contractValue.toLocaleString()}
                </span>
              </div>
              <div className="relative pt-2 pb-2">
                <div className="track-bg" />
                <div 
                  className="track-fill" 
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
                  className="premium-slider relative z-10 block"
                  aria-label="Average contract value slider"
                />
              </div>
            </div>

            {/* Bids Missed Slider */}
            <div>
              <div className="flex justify-between items-end mb-4 sm:mb-6">
                <label htmlFor="missed-bids" className="text-base sm:text-lg font-medium text-[var(--pub-text)]">
                  Bids missed per month
                </label>
                <span className="font-mono text-xl sm:text-2xl text-[var(--pub-text)] font-semibold">
                  {missedPerMonth}
                </span>
              </div>
              <div className="relative pt-2 pb-2 mb-4">
                <div className="track-bg" />
                <div 
                  className="track-fill" 
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
                  className="premium-slider relative z-10 block"
                  aria-label="Missed bids per month slider"
                />
              </div>
              <p className="text-sm text-[var(--pub-muted)] leading-relaxed max-w-md">
                Industry average: Most contractors unknowingly miss 3-5 relevant bids per month due to fragmented state and local procurement sites.
              </p>
            </div>
            
          </div>

          {/* Value Display Side */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-[#FFFFFF] border border-[#E2DDD6] rounded-3xl p-8 sm:p-10 shadow-sm relative z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
              
              <h3 className="text-[var(--pub-muted)] font-medium text-xs sm:text-sm tracking-widest uppercase mb-4 relative z-10">
                Annual Lost Revenue
              </h3>
              
              <div className="flex items-baseline gap-1 relative z-10 overflow-visible whitespace-nowrap">
                <span className="text-[var(--pub-text)] text-3xl sm:text-4xl lg:text-5xl font-semibold">
                  $
                </span>
                <motion.span 
                  key={displayLoss}
                  initial={{ opacity: 0.8, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[var(--pub-text)] text-5xl sm:text-6xl tabular-nums font-mono font-medium tracking-tight"
                >
                  {displayLoss.toLocaleString()}
                </motion.span>
              </div>
              
              <div className="mt-8 pt-8 border-t border-[var(--pub-border)] relative z-10">
                <p className="text-[var(--pub-text)] text-sm leading-relaxed font-medium">
                  That number is what your competitors are taking from the bids you didn't see. Stop leaving money on the table.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
