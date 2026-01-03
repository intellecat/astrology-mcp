/**
 * Aspect calculation service
 */

import { ASPECT_TYPES } from "../constants/index.js";

/**
 * Calculate aspects between planets
 */
export function calculateAspects(planets: any[]): any[] {
  const aspects: any[] = [];

  // Calculate aspects between all planet pairs
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];

      // Calculate the angular distance between two planets
      let diff = Math.abs(planet1.longitude - planet2.longitude);

      // Normalize to 0-180 degrees (aspects are symmetric)
      if (diff > 180) {
        diff = 360 - diff;
      }

      // Check each aspect type
      for (const aspectType of ASPECT_TYPES) {
        const orb = Math.abs(diff - aspectType.angle);

        if (orb <= aspectType.orb) {
          aspects.push({
            point1: planet1.name,
            point2: planet2.name,
            aspect: aspectType.name,
            aspectLevel: aspectType.level,
            orb: parseFloat(orb.toFixed(2)),
            orbUsed: aspectType.orb,
          });
        }
      }
    }
  }

  return aspects;
}
