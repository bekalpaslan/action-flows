import { useEffect, useRef } from 'react';
import '../../styles/cosmic-tokens.css';

interface CosmicBackgroundProps {
  width: number;
  height: number;
  /** Seed for deterministic nebula generation (e.g., sessionId) */
  seed?: string;
  /** Enable subtle twinkle animation */
  enableAnimation?: boolean;
}

/**
 * CosmicBackground Component
 *
 * Pure presentational component rendering a cosmic space background with:
 * - Dark gradient from void to deep space
 * - Procedural nebula clouds (deterministic from seed)
 * - Particle starfield (~200 distant stars)
 * - Subtle twinkle animation
 *
 * Uses HTML5 Canvas for performance.
 * Pattern: Renders once on mount, redraws only when dimensions change.
 */
export function CosmicBackground({
  width,
  height,
  seed = 'default',
  enableAnimation = true,
}: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Seeded random number generator (simple hash-based)
    const seededRandom = (s: string, index: number): number => {
      const hash = s.split('').reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0);
      const x = Math.sin(hash + index) * 10000;
      return x - Math.floor(x);
    };

    // Draw background gradient
    const drawBackground = () => {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      gradient.addColorStop(0, '#050510'); // Deep space at center
      gradient.addColorStop(1, '#000000'); // Void at edges
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    // Draw procedural nebulae
    const drawNebulae = () => {
      const nebulaCount = 5;
      const nebulae = [
        'rgba(30, 60, 180, 0.12)',   // Blue
        'rgba(120, 40, 180, 0.10)',  // Purple
        'rgba(180, 40, 120, 0.08)',  // Pink
        'rgba(40, 180, 180, 0.10)',  // Teal
        'rgba(60, 40, 160, 0.09)',   // Indigo
      ];

      for (let i = 0; i < nebulaCount; i++) {
        const x = seededRandom(seed, i * 2) * width;
        const y = seededRandom(seed, i * 2 + 1) * height;
        const radius = 150 + seededRandom(seed, i * 3) * 200;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, nebulae[i % nebulae.length]);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
    };

    // Generate particles (deterministic from seed)
    interface Particle {
      x: number;
      y: number;
      radius: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }

    const generateParticles = (): Particle[] => {
      const particleCount = 200;
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: seededRandom(seed, i * 5) * width,
          y: seededRandom(seed, i * 5 + 1) * height,
          radius: seededRandom(seed, i * 5 + 2) < 0.8 ? 0.5 : 1,
          opacity: 0.3 + seededRandom(seed, i * 5 + 3) * 0.4,
          twinkleSpeed: 0.5 + seededRandom(seed, i * 5 + 4) * 1.5,
          twinklePhase: seededRandom(seed, i * 5 + 5) * Math.PI * 2,
        });
      }

      return particles;
    };

    const particles = generateParticles();

    // Draw particles
    const drawParticles = (time: number) => {
      particles.forEach((particle) => {
        let opacity = particle.opacity;

        // Apply twinkle effect if animation enabled
        if (enableAnimation) {
          const twinkle = Math.sin(time * 0.001 * particle.twinkleSpeed + particle.twinklePhase);
          opacity = particle.opacity + twinkle * 0.15;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      });
    };

    // Main render loop
    const render = (time: number) => {
      // Clear and redraw
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawNebulae();
      drawParticles(time);

      // Continue animation loop
      if (enableAnimation) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    // Initial render
    render(0);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, seed, enableAnimation]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
