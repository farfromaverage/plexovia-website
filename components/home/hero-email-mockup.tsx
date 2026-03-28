"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
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
    id:     "navy-002",
    score:  71,
    title:  "Facilities Management Services",
    agency: "Naval Surface Warfare Center",
    state:  "MD",
    due:    "May 12, 2026",
    naics:  "561210",
  },
  {
    id:     "gsa-003",
    score:  58,
    title:  "IT Security Assessment Support",
    agency: "GSA (Federal Acquisition Service)",
    state:  "DC",
    due:    "May 24, 2026",
    naics:  "541519",
  },
];

export default function HeroEmailMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scrolled Parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const floatY = useSpring(rawY, { stiffness: 80, damping: 20 });
  
  // 3D Mouse Tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ["3deg", "-3deg"]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-3deg", "3deg"]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x / rect.width - 0.5);
    mouseY.set(y / rect.height - 0.5);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: 0.45 + i * 0.12,
        type: "spring" as const,
        stiffness: 200,
        damping: 15
      },
    }),
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ y: floatY, rotateX, rotateY, transformPerspective: 1000 }}
      className="relative w-full max-w-[440px] select-none mx-auto lg:mx-0 group"
      aria-hidden="true"
    >
      {/* Dynamic Glow following mouse */}
      <motion.div
        className="absolute -inset-10 -z-10 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)",
          x: useTransform(mouseX, [-0.5, 0.5], ["-80px", "80px"]),
          y: useTransform(mouseY, [-0.5, 0.5], ["-80px", "80px"]),
        }}
      />
      
      {/* Email client chrome */}
      <div
        className="
          rounded-2xl overflow-hidden
          shadow-[0_32px_80px_-16px_rgba(28,25,23,0.15),0_4px_24px_-4px_rgba(28,25,23,0.06)]
          border border-[#E2DDD6]
          bg-[#FFFFFF] transition-shadow duration-500 group-hover:shadow-[0_40px_100px_-20px_rgba(201,168,76,0.15),0_8px_32px_-8px_rgba(28,25,23,0.1)]
        "
      >
        {/* Email header bar */}
        <div className="bg-[#F0EDE7]/80 backdrop-blur-sm px-5 py-3.5 border-b border-[#E2DDD6]">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]/40" />
          </div>
          <div className="text-xs text-[#6B6560] font-sans">
            <span className="font-medium text-[#1C1917]">From:</span>{" "}
            alerts@plexovia.com
          </div>
          <div className="mt-0.5 text-xs text-[#6B6560] font-sans">
            <span className="font-medium text-[#1C1917]">Subject:</span>{" "}
            Your Daily Contract Matches (3)
          </div>
        </div>

        {/* Email body */}
        <div className="px-5 py-5 space-y-3.5 bg-gradient-to-b from-[#FFFFFF] to-[#F7F5F0]/30">
          <p className="text-[13px] text-[#6B6560] font-medium leading-relaxed font-sans">
            Good morning. Here are today&apos;s matches for your NAICS profile. We found 3 high-probability bids.
          </p>

          {mockMatches.map((match, i) => (
            <motion.div
              key={match.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={badgeVariants}
              whileHover={{ scale: 1.02, backgroundColor: "#FDFCFB", borderColor: "#C9A84C80" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="
                rounded-xl border border-[#E2DDD6] bg-[#F7F5F0]
                px-4 py-3.5 flex items-start gap-3.5 shadow-sm
                cursor-default
              "
            >
              <MatchScoreBadge score={match.score} className="mt-[3px] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-[#1C1917] font-sans leading-snug truncate">
                  {match.title}
                </p>
                <p className="text-[12px] text-[#6B6560] font-sans mt-[3px] truncate">{match.agency}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-mono text-[#A8A29E] bg-[#E2DDD6]/30 px-1.5 py-0.5 rounded-sm">{match.state}</span>
                  <span className="text-[11px] font-medium font-sans text-[#A8A29E]">Due {match.due}</span>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div 
            className="pt-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <p className="text-[11px] font-sans text-[#A8A29E] inline-flex items-center justify-center gap-1.5 w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse shadow-[0_0_4px_rgba(22,163,74,0.6)]"></span>
              Live matches generated at 06:00 AM
            </p>
          </motion.div>
        </div>
      </div>

      {/* Decorative ambient background glow (static fallback) */}
      <div
        className="absolute -inset-8 -z-20 rounded-3xl opacity-30 blur-2xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, #C9A84C22 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
