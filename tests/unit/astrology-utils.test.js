/**
 * Unit tests for astrology utilities
 * Run with: node tests/unit/astrology-utils.test.js
 */

import { degreeToZodiacSign, formatZodiacDegree, calculateHousePositionForPlanet } from "../../dist/utils/astrology.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Got: ${JSON.stringify(actual)}`);
  }
}

// Test degreeToZodiacSign
test("degreeToZodiacSign: 0° should be Aries 0°", () => {
  const result = degreeToZodiacSign(0);
  assertEqual(result.sign, "Aries", "Sign should be Aries");
  assertEqual(result.signKey, "aries", "Sign key should be aries");
  assertEqual(result.degreeInSign, 0, "Degree in sign should be 0");
});

test("degreeToZodiacSign: 30° should be Taurus 0°", () => {
  const result = degreeToZodiacSign(30);
  assertEqual(result.sign, "Taurus", "Sign should be Taurus");
  assertEqual(result.signKey, "taurus", "Sign key should be taurus");
  assertEqual(result.degreeInSign, 0, "Degree in sign should be 0");
});

test("degreeToZodiacSign: 45° should be Taurus 15°", () => {
  const result = degreeToZodiacSign(45);
  assertEqual(result.sign, "Taurus", "Sign should be Taurus");
  assertEqual(result.degreeInSign, 15, "Degree in sign should be 15");
});

test("degreeToZodiacSign: 360° should be Aries 0° (normalization)", () => {
  const result = degreeToZodiacSign(360);
  assertEqual(result.sign, "Aries", "Sign should be Aries");
  assertEqual(result.degreeInSign, 0, "Degree in sign should be 0");
});

test("degreeToZodiacSign: -30° should be Pisces 0° (negative normalization)", () => {
  const result = degreeToZodiacSign(-30);
  assertEqual(result.sign, "Pisces", "Sign should be Pisces");
  assertEqual(result.degreeInSign, 0, "Degree in sign should be 0");
});

// Test formatZodiacDegree
test("formatZodiacDegree: 15.5 should format correctly", () => {
  const result = formatZodiacDegree(15.5);
  assertEqual(result, "15° 30' 0\"", "Should format as 15° 30' 0\"");
});

test("formatZodiacDegree: 0 should format as 0° 0' 0\"", () => {
  const result = formatZodiacDegree(0);
  assertEqual(result, "0° 0' 0\"", "Should format as 0° 0' 0\"");
});

test("formatZodiacDegree: 29.999 should format correctly", () => {
  const result = formatZodiacDegree(29.999);
  // Should be approximately 29° 59' 56"
  const match = result.match(/(\d+)° (\d+)' (\d+)"/);
  if (!match) throw new Error("Invalid format");
  const deg = parseInt(match[1]);
  const min = parseInt(match[2]);
  assertEqual(deg, 29, "Degrees should be 29");
  assertEqual(min, 59, "Minutes should be 59");
});

// Test calculateHousePositionForPlanet
test("calculateHousePositionForPlanet: planet at house 1 cusp", () => {
  const cusps = [0, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const result = calculateHousePositionForPlanet(0, cusps);
  assertEqual(result, 1, "Should be in house 1");
});

test("calculateHousePositionForPlanet: planet in middle of house", () => {
  const cusps = [0, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const result = calculateHousePositionForPlanet(15, cusps);
  assertEqual(result, 1, "Should be in house 1");
});

test("calculateHousePositionForPlanet: planet at house 2 cusp", () => {
  const cusps = [0, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const result = calculateHousePositionForPlanet(30, cusps);
  assertEqual(result, 2, "Should be in house 2");
});

test("calculateHousePositionForPlanet: planet wrapping around (355°)", () => {
  const cusps = [0, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const result = calculateHousePositionForPlanet(355, cusps);
  assertEqual(result, 12, "Should be in house 12");
});

// Summary
console.log("\n" + "=".repeat(50));
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log("=".repeat(50));

if (failed > 0) {
  process.exit(1);
}
