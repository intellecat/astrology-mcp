/**
 * Unit tests for aspect calculator
 * Run with: node tests/unit/aspect-calculator.test.js
 */

import { calculateAspects } from "../../dist/services/aspect-calculator.js";

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

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test: Conjunction (0° aspect with 10° orb)
test("calculateAspects: Exact conjunction should be detected", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 0 },
  ];
  const aspects = calculateAspects(planets);
  assertEqual(aspects.length, 1, "Should find one aspect");
  assertEqual(aspects[0].aspect, "Conjunction", "Should be a conjunction");
  assertEqual(aspects[0].orb, 0, "Orb should be 0");
});

test("calculateAspects: Conjunction within orb", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 8 }, // 8° away, within 10° orb
  ];
  const aspects = calculateAspects(planets);
  assertEqual(aspects.length, 1, "Should find one aspect");
  assertEqual(aspects[0].aspect, "Conjunction", "Should be a conjunction");
  assertEqual(aspects[0].orb, 8, "Orb should be 8");
});

test("calculateAspects: Conjunction outside orb", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 15 }, // 15° away, outside 10° orb
  ];
  const aspects = calculateAspects(planets);
  // Should not find conjunction, but might find other aspects
  const conjunctions = aspects.filter(a => a.aspect === "Conjunction");
  assertEqual(conjunctions.length, 0, "Should not find conjunction");
});

// Test: Square (90° aspect with 8° orb)
test("calculateAspects: Exact square should be detected", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 90 },
  ];
  const aspects = calculateAspects(planets);
  const squares = aspects.filter(a => a.aspect === "Square");
  assertEqual(squares.length, 1, "Should find one square");
  assertEqual(squares[0].orb, 0, "Orb should be 0");
});

test("calculateAspects: Square within orb", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 95 }, // 95°, within 8° orb of 90°
  ];
  const aspects = calculateAspects(planets);
  const squares = aspects.filter(a => a.aspect === "Square");
  assertEqual(squares.length, 1, "Should find one square");
  assertEqual(squares[0].orb, 5, "Orb should be 5");
});

// Test: Opposition (180° aspect with 10° orb)
test("calculateAspects: Exact opposition should be detected", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 180 },
  ];
  const aspects = calculateAspects(planets);
  const oppositions = aspects.filter(a => a.aspect === "Opposition");
  assertEqual(oppositions.length, 1, "Should find one opposition");
  assertEqual(oppositions[0].orb, 0, "Orb should be 0");
});

// Test: Trine (120° aspect with 8° orb)
test("calculateAspects: Exact trine should be detected", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 120 },
  ];
  const aspects = calculateAspects(planets);
  const trines = aspects.filter(a => a.aspect === "Trine");
  assertEqual(trines.length, 1, "Should find one trine");
  assertEqual(trines[0].orb, 0, "Orb should be 0");
});

// Test: Multiple planets
test("calculateAspects: Multiple planets should find multiple aspects", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 120 }, // Trine to Sun
    { name: "Mercury", longitude: 240 }, // Trine to Moon, trine to Sun
  ];
  const aspects = calculateAspects(planets);
  // All three planets are in a grand trine (120° apart)
  assertTrue(aspects.length >= 3, "Should find at least 3 aspects");

  const trines = aspects.filter(a => a.aspect === "Trine");
  assertEqual(trines.length, 3, "Should find 3 trines in grand trine");
});

// Test: Aspect level (major vs minor)
test("calculateAspects: Should identify major aspects", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 90 },
  ];
  const aspects = calculateAspects(planets);
  assertEqual(aspects[0].aspectLevel, "major", "Square should be major aspect");
});

test("calculateAspects: Should identify minor aspects", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 45 }, // Semi-square
  ];
  const aspects = calculateAspects(planets);
  const semiSquares = aspects.filter(a => a.aspect === "Semi-Square");
  if (semiSquares.length > 0) {
    assertEqual(semiSquares[0].aspectLevel, "minor", "Semi-square should be minor aspect");
  }
});

// Test: orbUsed field
test("calculateAspects: Should include orbUsed field", () => {
  const planets = [
    { name: "Sun", longitude: 0 },
    { name: "Moon", longitude: 90 },
  ];
  const aspects = calculateAspects(planets);
  assertEqual(aspects[0].orbUsed, 8, "Square should have orbUsed=8");
});

// Summary
console.log("\n" + "=".repeat(50));
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log("=".repeat(50));

if (failed > 0) {
  process.exit(1);
}
