/**
 * Astrology calculation utilities
 */

import { ZODIAC_SIGNS } from "../constants/index.js";

/**
 * Convert decimal degrees to zodiac sign and position
 */
export function degreeToZodiacSign(degree: number): {
  sign: string;
  signKey: string;
  degreeInSign: number;
} {
  const normalizedDegree = ((degree % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedDegree / 30);
  const degreeInSign = normalizedDegree % 30;

  return {
    sign: ZODIAC_SIGNS[signIndex].label,
    signKey: ZODIAC_SIGNS[signIndex].key,
    degreeInSign: degreeInSign,
  };
}

/**
 * Format decimal degrees as zodiac notation (e.g., "24° 39' 24"")
 */
export function formatZodiacDegree(degreeInSign: number): string {
  const deg = Math.floor(degreeInSign);
  const min = Math.floor((degreeInSign - deg) * 60);
  const sec = Math.floor(((degreeInSign - deg) * 60 - min) * 60);
  return `${deg}° ${min}' ${sec}"`;
}

/**
 * Calculate which house a planet is in based on its longitude
 */
export function calculateHousePositionForPlanet(
  longitude: number,
  cusps: number[]
): number {
  const normalizedLong = ((longitude % 360) + 360) % 360;

  for (let i = 1; i <= 12; i++) {
    const currentCusp = cusps[i];
    const nextCusp = i === 12 ? cusps[1] : cusps[i + 1];

    // Handle wrap-around at 360/0 degrees
    if (nextCusp > currentCusp) {
      if (normalizedLong >= currentCusp && normalizedLong < nextCusp) {
        return i;
      }
    } else {
      // Cusp wraps around 0 degrees
      if (normalizedLong >= currentCusp || normalizedLong < nextCusp) {
        return i;
      }
    }
  }

  return 1; // Default to house 1
}
