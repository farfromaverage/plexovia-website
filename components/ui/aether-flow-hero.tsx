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
    const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

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

      update() {
        if (!canvas) return;
        if (this.x > canvas.width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.directionY = -this.directionY;
        }

        // Mouse collision detection
        if (mouse.x !== null && mouse.y !== null) {
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
      let numberOfParticles = (canvas.height * canvas.width) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        let size = Math.random() * 2 + 1;
        let x = Math.random() * (innerWidth - size * 2 - size * 2) + size * 2;
        let y = Math.random() * (innerHeight - size * 2 - size * 2) + size * 2;
        let directionX = Math.random() * 0.4 - 0.2;
        let directionY = Math.random() * 0.4 - 0.2;
        // Rich Gold for background particles
        let color = 'rgba(201, 168, 76, 0.9)'; 
        particles.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const connect = () => {
      if (!canvas || !ctx) return;
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance =
            (particles[a].x - particles[b].x) * (particles[a].x - particles[b].x) +
            (particles[a].y - particles[b].y) * (particles[a].y - particles[b].y);

          if (distance < (canvas.width / 7) * (canvas.height / 7)) {
            opacityValue = 1 - distance / 20000;
            if (opacityValue < 0) opacityValue = 0;
            
            let dx_mouse_a = particles[a].x - (mouse.x || -9999);
            let dy_mouse_a = particles[a].y - (mouse.y || -9999);
            let distance_mouse_a = Math.sqrt(dx_mouse_a * dx_mouse_a + dy_mouse_a * dy_mouse_a);

            if (mouse.x && distance_mouse_a < mouse.radius) {
              // Mouse highlighted connections — Deep Black/Charcoal 
              ctx.strokeStyle = `rgba(30, 30, 30, ${opacityValue})`;
            } else {
              // Standard connecting lines — Smooth Dark Gold
              ctx.strokeStyle = `rgba(184, 146, 45, ${opacityValue * 0.7})`;
            }

            // Thicker line handles the lack of a black backdrop better
            ctx.lineWidth = 1.5; 
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      animationFrameId = requestAnimationFrame(animate);
      
      // Clear canvas fully to let the CSS gradients show through
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
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
    <div className="relative min-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden px-5 sm:px-8 lg:px-12" aria-label="Hero">
      {/* Background styling layers underneath the interactive canvas */}
      <div className="grain absolute inset-0 z-[-30]" aria-hidden="true" />
      <div
        className="absolute inset-0 z-[-40]"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, #F0EDE7 0%, #F7F5F0 70%)",
        }}
        aria-hidden="true"
      />

      {/* The canvas MUST have a z-index under the text but above the background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-[-10] w-full h-full pointer-events-none" 
      />

      {/* Main Content Overlay */}
      <div className="relative z-10 mx-auto max-w-7xl pt-28 pb-20 w-full">
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
              Plexovia’s AI monitors all 50 state portals and SAM.gov simultaneously. We filter the noise, score solicitations against your exact capabilities, and deliver only the highest-value opportunities you have an unfair advantage to win.
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
                className="btn-gold text-base px-8 py-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-lg font-bold shadow-xl shadow-[#C9A84C]/20 hover:shadow-2xl hover:shadow-[#1C1917]/20 transition-all z-20"
              >
                Start Free Trial
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              
              <Link
                href="/pricing"
                className="
                  text-sm font-bold text-[#8A8580]
                  hover:text-[#1C1917] transition-colors
                  underline decoration-[#E2DDD6] underline-offset-4 z-20
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
