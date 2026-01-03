/**
 * Celestial body definitions
 */

import { Planet, LunarPoint, Asteroid } from "@swisseph/node";

export interface CelestialBody {
  id: Planet | LunarPoint | Asteroid;
  name: string;
  key: string;
}

export const CELESTIAL_BODIES: CelestialBody[] = [
  { id: Planet.Sun, name: "Sun", key: "sun" },
  { id: Planet.Moon, name: "Moon", key: "moon" },
  { id: Planet.Mercury, name: "Mercury", key: "mercury" },
  { id: Planet.Venus, name: "Venus", key: "venus" },
  { id: Planet.Mars, name: "Mars", key: "mars" },
  { id: Planet.Jupiter, name: "Jupiter", key: "jupiter" },
  { id: Planet.Saturn, name: "Saturn", key: "saturn" },
  { id: Planet.Uranus, name: "Uranus", key: "uranus" },
  { id: Planet.Neptune, name: "Neptune", key: "neptune" },
  { id: Planet.Pluto, name: "Pluto", key: "pluto" },
  { id: LunarPoint.MeanNode, name: "Mean Node", key: "meannode" },
  { id: LunarPoint.TrueNode, name: "True Node", key: "truenode" },
  { id: Asteroid.Chiron, name: "Chiron", key: "chiron" },
];
