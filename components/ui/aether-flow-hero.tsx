"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Radar } from 'lucide-react';

export default function AetherFlowHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  // Fetch live contract count from engine
  useEffect(() => {
    fetch('/api/engine-stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.total_contracts && typeof data.total_contracts === 'number') {
          setLiveCount(data.total_contracts);
        }
      })
      .catch(() => { /* graceful degradation */ });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];

    // ── Mobile detection (once, at mount) ──────────────────────────────
    const isMobile = window.innerWidth < 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for sharp rendering

    // Logical (CSS pixel) dimensions — updated on resize, used for all particle math
    let logicalW = 0;
    let logicalH = 0;

    // The fluid physics focal point
    const mouse = { x: null as number | null, y: null as number | null, radius: isMobile ? 150 : 250 };
    // The actual hardware cursor
    const targetMouse = { x: null as number | null, y: null as number | null };

    const createParticle = (x: number, y: number, directionX: number, directionY: number, size: number, color: string) => {
      return {
        x, y, directionX, directionY, size, color,
        draw() {
          if (!ctx) return;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
          ctx.fillStyle = this.color;
          ctx.fill();
        },
        update(cw: number, ch: number, dt: number) {
          if (!canvas) return;
          if (this.x > cw || this.x < 0) {
            this.directionX = -this.directionX;
          }
          if (this.y > ch || this.y < 0) {
            this.directionY = -this.directionY;
          }

          // Interaction: particles repel from cursor/finger
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
              const forceDirectionX = dx / distance;
              const forceDirectionY = dy / distance;
              const force = (mouse.radius - distance) / mouse.radius;
              this.x -= forceDirectionX * force * 5;
              this.y -= forceDirectionY * force * 5;
            }
          }

          // Delta-time movement: consistent speed regardless of frame rate
          this.x += this.directionX * dt;
          this.y += this.directionY * dt;
          this.draw();
        }
      };
    };

    function init() {
      if (!canvas) return;
      particles = [];
      const cw = logicalW;
      const ch = logicalH;

      // Mobile: minimal particles to preserve battery + CPU headroom
      // Desktop: ~100 at 1920×1080, Mobile: ~12 at 375×800
      const densityDivisor = isMobile ? 25000 : 18000;
      let numberOfParticles = (cw * ch) / densityDivisor;

      // Hard cap: mobile 15, desktop 100
      const maxParticles = isMobile ? 15 : 100;
      numberOfParticles = Math.min(numberOfParticles, maxParticles);

      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2.5 + 1;
        const x = Math.random() * (cw - size * 2) + size;
        const y = Math.random() * (ch - size * 2) + size;
        // Same speed on all devices — delta-time in update() handles consistency
        const directionX = Math.random() * 1.0 - 0.5;
        const directionY = Math.random() * 1.0 - 0.5;

        // DEPTH FIELD: Tie base opacity to size
        const baseAlpha = Math.max(0.15, (size - 1) / 2.5 * 0.85);
        const color = `rgba(28, 25, 23, ${baseAlpha.toFixed(2)})`;
        particles.push(createParticle(x, y, directionX, directionY, size, color));
      }
    }

    // Track last known width to prevent scroll-triggered re-init on mobile.
    // Mobile browsers fire 'resize' when the address bar hides/shows (height change).
    // Re-init on height change = particles teleport to random positions = broken.
    let lastCanvasWidth = 0;

    const resizeCanvas = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      const widthChanged = Math.abs(w - lastCanvasWidth) > 1;

      // Store logical dimensions for particle math
      logicalW = w;
      logicalH = h;

      // Scale canvas buffer for crisp rendering on high-DPI screens.
      // DO NOT set inline style.width/height — Tailwind's w-full h-full
      // handles CSS display sizing. Inline styles conflict on iOS/Android.
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // Scale context so drawing coords match CSS (logical) pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (widthChanged || particles.length === 0) {
        lastCanvasWidth = w;
        init();
      }
    };

    // Defer resize slightly to ensure container dims are ready
    setTimeout(resizeCanvas, 50);
    window.addEventListener('resize', resizeCanvas);

    const connect = () => {
      if (!canvas || !ctx) return;
      let opacityValue = 1;
      const cw = logicalW;
      const ch = logicalH;
      const now = Date.now();

      // Mobile: shorter connection distance (smaller screen = tighter web)
      const connectionArea = isMobile
        ? (cw / 5) * (ch / 5)
        : (cw / 7) * (ch / 7);

      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = dx * dx + dy * dy;

          if (distance < connectionArea) {
            opacityValue = 1 - distance / 22000;
            if (opacityValue < 0) opacityValue = 0;
            if (opacityValue > 1) opacityValue = 1;

            // BREATHING: ambient sine wave
            const phase = (now / 2000) + (a * 0.05);
            const breathingVariance = (Math.sin(phase) + 1) / 2;
            const baseConnOpacity = opacityValue * (0.12 + (breathingVariance * 0.15));

            ctx.lineWidth = 1.5;
            ctx.beginPath();

            if (mouse.x !== null && mouse.y !== null) {
              const dx_mouse = particles[a].x - mouse.x;
              const dy_mouse = particles[a].y - mouse.y;
              const distance_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

              if (distance_mouse < mouse.radius) {
                // Interactive lines turn Bright Gold when cursor is near
                ctx.strokeStyle = `rgba(201, 168, 76, ${opacityValue.toFixed(2)})`;
                ctx.lineWidth = 2.0;
              } else {
                ctx.strokeStyle = `rgba(28, 25, 23, ${baseConnOpacity.toFixed(2)})`;
              }
            } else {
              ctx.strokeStyle = `rgba(28, 25, 23, ${baseConnOpacity.toFixed(2)})`;
            }

            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    // ── Delta-time animation: consistent speed on all devices ──
    let lastFrameTime = 0;

    const animate = (timestamp: number = 0) => {
      if (!canvas || !ctx) return;
      animationFrameId = requestAnimationFrame(animate);

      // Delta time in "frame units" (1.0 = 16.67ms = 60fps baseline)
      // This ensures particles move at the same visual speed whether
      // the device runs at 30fps, 60fps, or 120fps.
      const rawDt = lastFrameTime === 0 ? 16.67 : timestamp - lastFrameTime;
      lastFrameTime = timestamp;
      // Clamp dt to prevent huge jumps after tab switches or scroll pauses
      const dt = Math.min(rawDt, 50) / 16.67;

      // FLUID LERP: Smoothly chase the cursor or finger
      if (targetMouse.x !== null && targetMouse.y !== null) {
        if (mouse.x === null || mouse.y === null) {
          mouse.x = targetMouse.x;
          mouse.y = targetMouse.y;
        } else {
          // Touch gets faster lerp (0.15) for responsive feel, mouse gets smooth drag (0.08)
          const lerpSpeed = isTouchDevice ? 0.15 : 0.08;
          mouse.x += (targetMouse.x - mouse.x) * lerpSpeed;
          mouse.y += (targetMouse.y - mouse.y) * lerpSpeed;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      // Clear the canvas (logical dimensions — DPR handled by transform)
      ctx.clearRect(0, 0, logicalW, logicalH);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(logicalW, logicalH, dt);
      }
      connect();
    };

    // Mouse listeners
    const handleMouseMove = (event: MouseEvent) => {
      targetMouse.x = event.clientX;
      targetMouse.y = event.clientY;
    };

    const handleMouseOut = () => {
      targetMouse.x = null;
      targetMouse.y = null;
    };

    // Touch listeners — map finger position to same targetMouse coords
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        targetMouse.x = touch.clientX;
        targetMouse.y = touch.clientY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        targetMouse.x = touch.clientX;
        targetMouse.y = touch.clientY;
      }
    };

    const handleTouchEnd = () => {
      targetMouse.x = null;
      targetMouse.y = null;
    };

    // Attach all interaction listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: "easeOut" as const,
      },
    }),
  };

  const trustPoints = [
    "Takes 3 minutes to set up.",
    "Credit card required. No charge until Day 8.",
    "Cancel anytime. No annual contract.",
  ];

  return (
    <div className="relative min-h-[90svh] w-full flex flex-col items-center justify-center overflow-hidden px-5 sm:px-8 lg:px-12" aria-label="Hero">

      {/* PERFECTLY ISOLATED BACKGROUND STACK */}
      {/*
        We use z-0 to establish a solid ground layer stacking context.
        This prevents anything from falling 'behind' the body tag's white background.
      */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Layer 1: Parchment Gradient */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #F0EDE7 0%, #F7F5F0 70%)" }}
          aria-hidden="true"
        />
        {/* Layer 2: Texture Grain */}
        <div className="grain absolute inset-0 w-full h-full mix-blend-multiply opacity-50" aria-hidden="true" />

        {/* Layer 3: Interactive Canvas exactly filling the container */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block pointer-events-auto"
          style={{ willChange: 'contents', touchAction: 'pan-y' }}
        />
      </div>

      {/* Main Content Overlay: z-10 puts it solidly ON TOP of the background stack */}
      <div className="relative z-10 mx-auto max-w-7xl pt-28 pb-20 w-full pointer-events-auto">
        <div className="flex flex-col items-center text-center gap-12 lg:gap-16">
          <motion.div
            className="flex-1 max-w-3xl w-full flex flex-col items-center"
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div custom={0} variants={fadeUpVariants}>
              <span
                className="
                  inline-flex items-center gap-1.5
                  text-xs font-semibold tracking-widest uppercase
                  text-[#C9A84C] mb-6
                "
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse"
                  aria-hidden="true"
                />
                For Federal & State Contractors
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              custom={1}
              variants={fadeUpVariants}
              className="
                text-4xl sm:text-5xl lg:text-[4rem]
                text-[#1C1917] font-semibold leading-[1.1] mb-6 tracking-tight
              "
            >
              Your competitors are winning contracts.
              <br />
              Because they <span className="text-[#C9A84C]">found out</span> first.
            </motion.h1>

            {/* Subline */}
            <motion.p
              custom={2}
              variants={fadeUpVariants}
              className="
                text-lg sm:text-xl text-[#6B6560]
                leading-relaxed max-w-2xl mb-10
              "
            >
               Every matching federal contract, scored and ranked, in your dashboard every morning. SAM.gov, DLA DIBBS, and SBA SubNet. Scanned every night.
            </motion.p>

            {/* CTA group */}
            <motion.div
              custom={3}
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-8 w-full"
            >
              <Link
                href="/auth/signup"
                id="hero-cta"
                className="btn-gold text-base px-8 py-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-lg font-bold shadow-xl shadow-[#C9A84C]/20 hover:shadow-2xl hover:shadow-[#1C1917]/20 transition-all"
              >
                Start Your Contract Intelligence
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/how-it-works"
                className="
                  text-sm font-bold text-[#8A8580]
                  hover:text-[#1C1917] transition-colors
                  underline decoration-[#E2DDD6] underline-offset-4
                "
              >
                See exactly how it works &rarr;
              </Link>
            </motion.div>

            {/* Live counter */}
            {liveCount && (
              <motion.div
                custom={3.5}
                variants={fadeUpVariants}
                className="flex items-center gap-2 mb-4"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
                </span>
                <span className="text-xs font-semibold text-[#6B6560] tracking-wide" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                  <strong className="text-[#1C1917] font-bold">{liveCount.toLocaleString()}</strong> contracts scanned
                </span>
              </motion.div>
            )}

            {/* Trust signals */}
            <motion.ul
              custom={4}
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row flex-wrap justify-center gap-x-5 gap-y-2"
              role="list"
            >
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 text-xs text-[#A8A29E]"
                >
                  <CheckCircle
                    size={13}
                    className="text-[#C9A84C] flex-shrink-0"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
