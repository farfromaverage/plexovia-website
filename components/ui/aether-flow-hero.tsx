"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function AetherFlowHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // ── Mobile detection (once, at mount) ──────────────────────────────
    const isMobile = window.innerWidth < 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x to avoid GPU overload

    // The fluid physics focal point
    const mouse = { x: null as number | null, y: null as number | null, radius: isMobile ? 150 : 250 };
    // The actual hardware cursor
    const targetMouse = { x: null as number | null, y: null as number | null };

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update(cw: number, ch: number) {
        if (!canvas) return;
        if (this.x > cw || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > ch || this.y < 0) {
          this.directionY = -this.directionY;
        }

        // Mouse collision detection (skip on touch-only devices — no cursor to react to)
        if (!isTouchDevice && mouse.x !== null && mouse.y !== null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= forceDirectionX * force * 5;
            this.y -= forceDirectionY * force * 5;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      if (!canvas) return;
      particles = [];
      // Use CSS dimensions (not canvas.width which includes DPR scaling)
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      // Mobile: fewer particles to preserve battery + CPU headroom
      // Desktop: ~230 at 1920×1080, Mobile: ~20 at 375×800
      const densityDivisor = isMobile ? 15000 : 9000;
      let numberOfParticles = (cw * ch) / densityDivisor;

      // Hard cap: mobile 30, desktop 200
      const maxParticles = isMobile ? 30 : 200;
      numberOfParticles = Math.min(numberOfParticles, maxParticles);

      for (let i = 0; i < numberOfParticles; i++) {
        let size = Math.random() * 2.5 + 1;
        let x = Math.random() * (cw - size * 2) + size;
        let y = Math.random() * (ch - size * 2) + size;
        // Mobile: slightly slower particles for smoother feel on lower FPS
        const speedMultiplier = isMobile ? 0.6 : 1.0;
        let directionX = (Math.random() * 1.0 - 0.5) * speedMultiplier;
        let directionY = (Math.random() * 1.0 - 0.5) * speedMultiplier;

        // DEPTH FIELD: Tie base opacity to size
        let baseAlpha = Math.max(0.15, (size - 1) / 2.5 * 0.85);
        let color = `rgba(28, 25, 23, ${baseAlpha.toFixed(2)})`;
        particles.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    const resizeCanvas = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      // Scale canvas buffer for sharp rendering on high-DPI screens
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // Keep CSS size at layout dimensions
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Scale context so drawing coords match CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      init();
    };

    // Defer resize slightly to ensure container dims are ready
    setTimeout(resizeCanvas, 50);
    window.addEventListener('resize', resizeCanvas);

    const connect = () => {
      if (!canvas || !ctx) return;
      let opacityValue = 1;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const now = Date.now();

      // Mobile: shorter connection distance (smaller screen = tighter web)
      const connectionArea = isMobile
        ? (cw / 5) * (ch / 5)
        : (cw / 7) * (ch / 7);

      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = dx * dx + dy * dy;

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

            if (!isTouchDevice && mouse.x !== null && mouse.y !== null) {
              let dx_mouse = particles[a].x - mouse.x;
              let dy_mouse = particles[a].y - mouse.y;
              let distance_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

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

    // ── Frame throttling for mobile (target ~30fps instead of 60fps) ──
    let lastFrameTime = 0;
    const targetInterval = isMobile ? 33 : 0; // 33ms ≈ 30fps on mobile, 0 = uncapped on desktop

    const animate = (timestamp: number = 0) => {
      if (!canvas || !ctx) return;
      animationFrameId = requestAnimationFrame(animate);

      // Skip frame if we're ahead of schedule (mobile throttle)
      if (targetInterval > 0 && timestamp - lastFrameTime < targetInterval) return;
      lastFrameTime = timestamp;

      // FLUID MOUSE LERP: Smoothly chase the target cursor
      if (!isTouchDevice && targetMouse.x !== null && targetMouse.y !== null) {
        if (mouse.x === null || mouse.y === null) {
          mouse.x = targetMouse.x;
          mouse.y = targetMouse.y;
        } else {
          mouse.x += (targetMouse.x - mouse.x) * 0.08;
          mouse.y += (targetMouse.y - mouse.y) * 0.08;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      // Clear using CSS dimensions (DPR handled by transform)
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(canvas.clientWidth, canvas.clientHeight);
      }
      connect();
    };

    // Only attach mouse listeners on non-touch devices
    const handleMouseMove = (event: MouseEvent) => {
      targetMouse.x = event.clientX;
      targetMouse.y = event.clientY;
    };

    const handleMouseOut = () => {
      targetMouse.x = null;
      targetMouse.y = null;
    };

    if (!isTouchDevice) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseout', handleMouseOut);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (!isTouchDevice) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseout', handleMouseOut);
      }
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
        ease: "easeInOut",
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
          className="absolute inset-0 w-full h-full block"
          style={{ willChange: 'contents' }}
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
                Government Contract Intelligence
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
              Stop searching.
              <br />
              Start <span className="text-[#C9A84C]">winning</span> contracts.
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
              Plexovia's AI monitors all 50 state portals and SAM.gov simultaneously. We filter the noise, score solicitations against your exact capabilities, and deliver only the highest-value opportunities you have an unfair advantage to win.
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
                Start Free Trial
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/pricing"
                className="
                  text-sm font-bold text-[#8A8580]
                  hover:text-[#1C1917] transition-colors
                  underline decoration-[#E2DDD6] underline-offset-4
                "
              >
                See pricing
              </Link>
            </motion.div>

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
