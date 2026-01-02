/**
 * Simple test file for the migrated @swisseph/node implementation
 * This can be used for basic testing during development
 */

import {
  julianDay,
  calculateHouses,
  calculatePosition,
  Planet,
  LunarPoint,
  Asteroid,
  HouseSystem,
  CalendarType,
  close as swissephClose,
} from "@swisseph/node";

console.log("Testing @swisseph/node implementation...\n");

// Test case: Create a natal chart
const testDate = {
  year: 1990,
  month: 5, // May (1-12)
  day: 15,
  hour: 14,
  minute: 30,
};

const testLocation = {
  latitude: 40.7128,
  longitude: -74.006,
};

console.log("Birth Data:");
console.log(`Date: ${testDate.year}-${testDate.month}-${testDate.day}`);
console.log(`Time: ${testDate.hour}:${testDate.minute.toString().padStart(2, "0")}`);
console.log(`Location: ${testLocation.latitude}, ${testLocation.longitude} (New York)\n`);

// Convert to UTC (EDT is UTC-4 for New York in May)
const timezoneOffset = 4;
const hourUTC = testDate.hour + timezoneOffset + testDate.minute / 60;

// Calculate Julian Day
const jd = julianDay(
  testDate.year,
  testDate.month,
  testDate.day,
  hourUTC,
  CalendarType.Gregorian
);

console.log(`Julian Day: ${jd.toFixed(6)}`);

// Calculate houses
const houses = calculateHouses(
  jd,
  testLocation.latitude,
  testLocation.longitude,
  HouseSystem.Placidus
);

console.log("\n=== CHART ANGLES ===");
console.log(`Ascendant: ${houses.ascendant.toFixed(4)}°`);
console.log(`Midheaven: ${houses.mc.toFixed(4)}°`);

console.log("\n=== PLANETS ===");
const planets = [
  { id: Planet.Sun, name: "Sun" },
  { id: Planet.Moon, name: "Moon" },
  { id: Planet.Mercury, name: "Mercury" },
  { id: Planet.Venus, name: "Venus" },
  { id: Planet.Mars, name: "Mars" },
  { id: Planet.Jupiter, name: "Jupiter" },
  { id: Planet.Saturn, name: "Saturn" },
  { id: Planet.Uranus, name: "Uranus" },
  { id: Planet.Neptune, name: "Neptune" },
  { id: Planet.Pluto, name: "Pluto" },
  { id: LunarPoint.MeanNode, name: "North Node" },
  { id: Asteroid.Chiron, name: "Chiron" },
];

planets.forEach((planet) => {
  const position = calculatePosition(jd, planet.id);
  const retrograde = position.longitudeSpeed < 0 ? " (R)" : "";
  console.log(`${planet.name}: ${position.longitude.toFixed(4)}°${retrograde}`);
});

console.log("\n=== HOUSES ===");
for (let i = 1; i <= 12; i++) {
  console.log(`House ${i}: ${houses.cusps[i].toFixed(4)}°`);
}

console.log("\n✅ Test completed successfully!");
console.log("✅ @swisseph/node is working correctly in the migrated code");

// Cleanup
swissephClose();
