/**
 * BigBangAnimation - Full-screen canvas animation for first universe interaction
 *
 * Phases:
 * 1. Darkness (0-500ms): Black screen with cosmic noise
 * 2. Ignition (500-1000ms): White point growing at center
 * 3. Burst (1000-2000ms): Radial explosion with particle trails
 * 4. Stars Emerge (2000-2500ms): Work + Canvas regions fade in
 *
 * Performance optimizations:
 * - requestAnimationFrame for smooth 60fps
 * - Respect prefers-reduced-motion
 * - Canvas cleanup on unmount
 */

import React, { useEffect, useRef, useState } from 'react';
import './BigBangAnimation.css';

interface BigBangAnimationProps {
  onComplete: () => void;
  skipAnimation?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  lifetime: number;
  age: number;
}

const ANIMATION_DURATION = 2500; // 2.5 seconds total
const PARTICLE_COUNT = 75;

export const BigBangAnimation: React.FC<BigBangAnimationProps> = ({
  onComplete,
  skipAnimation = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [showSkip, setShowSkip] = useState(false);

  // Check for prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Skip animation if requested or motion reduced
  useEffect(() => {
    if (skipAnimation || prefersReducedMotion) {
      onComplete();
      return;
    }
  }, [skipAnimation, prefersReducedMotion, onComplete]);

  // Show skip button after 1 second
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize particles
  const initializeParticles = (centerX: number, centerY: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.2;
      const speed = 0.5 + Math.random() * 1.5;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2,
        opacity: 0.8 + Math.random() * 0.2,
        lifetime: 1000 + Math.random() * 500,
        age: 0,
      });
    }
    return particles;
  };

  // Animation loop
  useEffect(() => {
    if (skipAnimation || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initialize particles
    particlesRef.current = initializeParticles(centerX, centerY);

    // Start animation
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Phase 1: Darkness (0-500ms)
      if (elapsed < 500) {
        // Draw cosmic noise
        const noiseOpacity = 0.05;
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          ctx.fillStyle = `rgba(255, 255, 255, ${noiseOpacity})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Phase 2: Ignition (500-1000ms)
      if (elapsed >= 500 && elapsed < 1000) {
        const ignitionProgress = (elapsed - 500) / 500;
        const radius = ignitionProgress * 30;
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${ignitionProgress})`);
        gradient.addColorStop(0.5, `rgba(255, 240, 200, ${ignitionProgress * 0.7})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Phase 3: Burst (1000-2000ms)
      if (elapsed >= 1000 && elapsed < 2000) {
        // Draw expanding ring
        const burstProgress = (elapsed - 1000) / 1000;
        const ringRadius = burstProgress * Math.max(canvas.width, canvas.height);
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          ringRadius * 0.8,
          centerX,
          centerY,
          ringRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(
          0.5,
          `rgba(100, 200, 255, ${(1 - burstProgress) * 0.3})`
        );
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.fill();

        // Update and draw particles
        particlesRef.current.forEach((particle) => {
          particle.age += 16; // ~60fps
          particle.x += particle.vx;
          particle.y += particle.vy;

          const particleOpacity =
            particle.opacity * (1 - particle.age / particle.lifetime);

          if (particleOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${particleOpacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            // Draw trail
            ctx.strokeStyle = `rgba(100, 200, 255, ${particleOpacity * 0.3})`;
            ctx.lineWidth = particle.size * 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
            ctx.stroke();
          }
        });
      }

      // Phase 4: Stars Emerge (2000-2500ms)
      if (elapsed >= 2000) {
        const fadeProgress = (elapsed - 2000) / 500;
        // Fade to transparent (revealing CosmicMap underneath)
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeProgress})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Continue animation or complete
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [skipAnimation, prefersReducedMotion, onComplete]);

  // Skip if animation is disabled
  if (skipAnimation || prefersReducedMotion) {
    return null;
  }

  return (
    <div className="big-bang-animation">
      <canvas ref={canvasRef} className="big-bang-animation__canvas" />
      {showSkip && (
        <button
          className="big-bang-animation__skip"
          onClick={() => onComplete()}
          aria-label="Skip animation"
        >
          Skip
        </button>
      )}
    </div>
  );
};
