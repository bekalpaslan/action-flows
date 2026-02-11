/**
 * Color Evolution System
 *
 * Handles HSL hue rotation for region color shifts. Regions used more often
 * shift toward warmer hues. Unused regions cool down (shift toward cooler hues).
 *
 * Hue rotation range: +/- 15 degrees maximum per 100 interactions
 * Temperature range: 0.0 (cool) to 1.0 (warm)
 */

import type { ColorShift } from '@afw/shared';

/**
 * Color shift delta
 */
export interface ColorShiftDelta {
  hueRotationDegrees: number;  // +15° = warmer, -15° = cooler
  saturationDelta: number;      // +/- 0.1 (0.0 to 1.0 range)
  temperatureDelta: number;     // +/- 0.1 (0.0 to 1.0 range)
}

/**
 * HSL color representation
 */
export interface HSLColor {
  hue: number;        // 0-360
  saturation: number; // 0-1
  lightness: number;  // 0-1
}

/**
 * RGB color representation
 */
export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Parse hex color to HSL.
 *
 * @param hex - Hex color string (e.g., "#4a90e2")
 * @returns HSL color
 */
export function hexToHSL(hex: string): HSLColor {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    hue: Math.round(h * 360),
    saturation: s,
    lightness: l,
  };
}

/**
 * Convert HSL to hex color.
 *
 * @param hsl - HSL color
 * @returns Hex color string
 */
export function hslToHex(hsl: HSLColor): string {
  const { hue, saturation, lightness } = hsl;
  const h = hue / 360;
  const s = saturation;
  const l = lightness;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Apply hue rotation to current color.
 *
 * @param currentColor - Current hex color (e.g., "#4a90e2")
 * @param deltaDegrees - Hue rotation in degrees (+/- 15° max)
 * @returns New hex color after applying rotation
 */
export function applyHueRotation(currentColor: string, deltaDegrees: number): string {
  const hsl = hexToHSL(currentColor);

  // Apply hue rotation (wrap around at 360°)
  hsl.hue = (hsl.hue + deltaDegrees + 360) % 360;

  // Clamp to +/- 15° from original hue (if needed for base color tracking)
  // Note: This requires tracking the base hue separately in production

  return hslToHex(hsl);
}

/**
 * Apply color shift delta to current color.
 *
 * @param currentColor - Current hex color (e.g., "#4a90e2")
 * @param delta - Color shift delta
 * @returns New hex color after applying delta
 */
export function applyColorShift(currentColor: string, delta: ColorShiftDelta): string {
  const hsl = hexToHSL(currentColor);

  // Apply hue rotation (wrap around at 360°)
  hsl.hue = (hsl.hue + delta.hueRotationDegrees + 360) % 360;

  // Apply saturation delta (clamp to 0-1)
  hsl.saturation = Math.max(0, Math.min(1, hsl.saturation + delta.saturationDelta));

  // Temperature affects lightness (warmer = brighter)
  hsl.lightness = Math.max(0, Math.min(1, hsl.lightness + delta.temperatureDelta * 0.1));

  return hslToHex(hsl);
}

/**
 * Calculate temperature based on interaction count.
 *
 * @param interactionCount - Total interactions involving this region
 * @returns Temperature (0.0 to 1.0)
 */
export function calculateTemperature(interactionCount: number): number {
  return Math.min(1.0, interactionCount / 100);
}

/**
 * Calculate color shift for a region based on interaction count.
 *
 * @param baseColor - Region's base color (from layer)
 * @param interactionCount - Total interactions involving this region
 * @param timeSinceLastActive - Time since last active (ms)
 * @returns Updated ColorShift
 */
export function calculateColorShift(
  baseColor: string,
  interactionCount: number,
  timeSinceLastActive: number
): ColorShift {
  const hsl = hexToHSL(baseColor);

  // Hue rotation: +0.15° per interaction, capped at +15°
  const hueRotation = Math.min(15, interactionCount * 0.15);

  // Cooling factor: -5° per hour of inactivity
  const coolingFactor = Math.min(5, (timeSinceLastActive / (1000 * 60 * 60)) * 5);

  const netHueRotation = hueRotation - coolingFactor;
  hsl.hue = (hsl.hue + netHueRotation + 360) % 360;

  // Temperature: 0.0 (cool) to 1.0 (warm)
  const temperature = Math.min(1.0, interactionCount / 100);

  // Saturation increases with usage
  hsl.saturation = Math.min(1.0, hsl.saturation + temperature * 0.2);

  return {
    baseColor,
    currentColor: hslToHex(hsl),
    saturation: hsl.saturation,
    temperature,
  };
}

/**
 * Get temperature-based glow intensity.
 * Warmer regions glow brighter.
 *
 * @param temperature - Temperature (0.0 to 1.0)
 * @returns Glow intensity multiplier (1.0 to 2.0)
 */
export function calculateGlowIntensity(temperature: number): number {
  return 1.0 + temperature; // 1.0x to 2.0x brightness
}
