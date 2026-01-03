/**
 * Aspect type definitions
 */

export interface AspectType {
  name: string;
  key: string;
  angle: number;
  orb: number;
  level: "major" | "minor";
}

export const ASPECT_TYPES: AspectType[] = [
  { name: "Conjunction", key: "conjunction", angle: 0, orb: 10, level: "major" },
  { name: "Sextile", key: "sextile", angle: 60, orb: 6, level: "major" },
  { name: "Square", key: "square", angle: 90, orb: 8, level: "major" },
  { name: "Trine", key: "trine", angle: 120, orb: 8, level: "major" },
  { name: "Opposition", key: "opposition", angle: 180, orb: 10, level: "major" },
  { name: "Semi-Sextile", key: "semisextile", angle: 30, orb: 3, level: "minor" },
  { name: "Semi-Square", key: "semisquare", angle: 45, orb: 3, level: "minor" },
  { name: "Sesquiquadrate", key: "sesquiquadrate", angle: 135, orb: 3, level: "minor" },
  { name: "Quincunx", key: "quincunx", angle: 150, orb: 3, level: "minor" },
];
