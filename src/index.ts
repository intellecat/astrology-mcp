#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  julianDay,
  calculateHouses,
  calculatePosition,
  close as swissephClose,
  Planet,
  LunarPoint,
  Asteroid,
  HouseSystem,
  CalendarType,
} from "@swisseph/node";
import { DateTime as LuxonDateTime } from "luxon";
import { find as findTimezone } from "geo-tz";
import NodeGeocoder from "node-geocoder";

// Initialize geocoder
const geocoder = NodeGeocoder({
  provider: "openstreetmap",
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert decimal degrees to zodiac sign and position
 */
function degreeToZodiacSign(degree: number): {
  sign: string;
  signKey: string;
  degreeInSign: number;
} {
  const signs = [
    { label: "Aries", key: "aries" },
    { label: "Taurus", key: "taurus" },
    { label: "Gemini", key: "gemini" },
    { label: "Cancer", key: "cancer" },
    { label: "Leo", key: "leo" },
    { label: "Virgo", key: "virgo" },
    { label: "Libra", key: "libra" },
    { label: "Scorpio", key: "scorpio" },
    { label: "Sagittarius", key: "sagittarius" },
    { label: "Capricorn", key: "capricorn" },
    { label: "Aquarius", key: "aquarius" },
    { label: "Pisces", key: "pisces" },
  ];

  const normalizedDegree = ((degree % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedDegree / 30);
  const degreeInSign = normalizedDegree % 30;

  return {
    sign: signs[signIndex].label,
    signKey: signs[signIndex].key,
    degreeInSign: degreeInSign,
  };
}

/**
 * Format decimal degrees as zodiac notation (e.g., "24° 39' 24\"")
 */
function formatZodiacDegree(degreeInSign: number): string {
  const deg = Math.floor(degreeInSign);
  const min = Math.floor((degreeInSign - deg) * 60);
  const sec = Math.floor(((degreeInSign - deg) * 60 - min) * 60);
  return `${deg}° ${min}' ${sec}"`;
}

/**
 * Calculate which house a planet is in based on its longitude
 */
function calculateHousePositionForPlanet(
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

/**
 * Calculate aspects between planets
 */
function calculateAspects(planets: any[]): any[] {
  const aspects: any[] = [];

  // Define aspect types with their angles and orbs
  const aspectTypes = [
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
      for (const aspectType of aspectTypes) {
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

/**
 * Convert local time to UTC using timezone information from coordinates
 * Uses geo-tz to get IANA timezone and Luxon for accurate conversion
 * Handles historical DST rules automatically
 */
function convertLocalTimeToUTC(
  datetime: DateTime,
  latitude: number,
  longitude: number
): number {
  try {
    // Get IANA timezone from coordinates (e.g., "Asia/Shanghai", "America/New_York")
    const timezone = findTimezone(latitude, longitude)[0];

    if (!timezone) {
      throw new Error(
        `Could not determine timezone for coordinates: ${latitude}, ${longitude}`
      );
    }

    // Create datetime in local timezone
    const localTime = LuxonDateTime.fromObject(
      {
        year: datetime.year,
        month: datetime.month,
        day: datetime.day,
        hour: datetime.hour,
        minute: datetime.minute,
      },
      { zone: timezone }
    );

    // Validate the datetime
    if (!localTime.isValid) {
      throw new Error(
        `Invalid datetime: ${localTime.invalidReason}. Check that the date and time are valid for timezone ${timezone}.`
      );
    }

    // Convert to UTC
    const utcTime = localTime.toUTC();

    // Return hour as decimal for Swiss Ephemeris (e.g., 9:30 = 9.5)
    return utcTime.hour + utcTime.minute / 60;
  } catch (error) {
    throw new Error(
      `Failed to convert local time to UTC: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// =============================================================================
// Zod schemas for input validation
// =============================================================================
const DateTimeSchema = z.object({
  year: z.number().int().min(1800).max(2200).describe("Year (e.g., 1990)"),
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .describe("Month (1-12, where 1=January, 12=December)"),
  day: z.number().int().min(1).max(31).describe("Day of month (1-31)"),
  hour: z.number().int().min(0).max(23).describe("Hour in local time (0-23)"),
  minute: z.number().int().min(0).max(59).describe("Minute (0-59)"),
});

const CoordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe("Latitude in decimal degrees (-90 to 90)"),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Longitude in decimal degrees (-180 to 180)"),
});

const LocationSchema = z.union([
  CoordinatesSchema,
  z
    .string()
    .min(1)
    .describe("Location in format 'City, Country' (e.g., 'New York, USA')"),
]);

const CalculateNatalChartArgsSchema = z.object({
  datetime: DateTimeSchema,
  location: LocationSchema,
  houseSystem: z
    .string()
    .optional()
    .default("Placidus")
    .describe(
      "House system to use. Options: Placidus, Koch, Equal, Whole Sign, Campanus, Regiomontanus"
    ),
});

const GetCoordinatesArgsSchema = z.object({
  location: z
    .string()
    .min(1)
    .describe("Location in format 'City, Country' (e.g., 'London, UK')"),
});

// Output schemas for structured responses
const PlanetSchema = z.object({
  name: z.string(),
  sign: z.string(),
  degree: z.string(),
  longitude: z.number(),
  house: z.number(),
  isRetrograde: z.boolean(),
});

const HouseSchema = z.object({
  number: z.number(),
  sign: z.string(),
  degree: z.string(),
  cuspDegree: z.number(),
});

const AspectSchema = z.object({
  point1: z.string(),
  point2: z.string(),
  aspect: z.string(),
  aspectLevel: z.string(),
  orb: z.number(),
  orbUsed: z.number(),
});

const ChartAngleSchema = z.object({
  sign: z.string(),
  degree: z.string(),
  longitude: z.number(),
});

const NatalChartOutputSchema = z.object({
  planets: z.array(PlanetSchema),
  houses: z.array(HouseSchema),
  aspects: z.array(AspectSchema),
  chartAngles: z.object({
    ascendant: ChartAngleSchema,
    descendant: ChartAngleSchema,
    midheaven: ChartAngleSchema,
    imumCoeli: ChartAngleSchema,
  }),
  sunSign: z.string(),
  birthData: z.object({
    datetime: DateTimeSchema,
    location: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    houseSystem: z.string(),
  }),
});

const CoordinatesOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string().optional(),
});

// Type definitions
type DateTime = z.infer<typeof DateTimeSchema>;
type Coordinates = z.infer<typeof CoordinatesSchema>;
type Location = z.infer<typeof LocationSchema>;

interface CoordinatesResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

// Helper function to convert location to coordinates
async function getCoordinates(location: Location): Promise<CoordinatesResult> {
  // Check if location is already coordinates
  if (typeof location === "object" && "latitude" in location) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  // Location is a string (city-country format)
  try {
    const results = await geocoder.geocode(location);
    if (results && results.length > 0) {
      const result = results[0];
      if (result.latitude === undefined || result.longitude === undefined) {
        throw new Error(
          `Geocoding returned incomplete results for location: ${location}`
        );
      }
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress,
      };
    }
    throw new Error(
      `Could not find coordinates for location: ${location}. Please check the location format (e.g., 'City, Country') or try providing exact coordinates.`
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Geocoding failed for '${location}': ${error.message}. Try using exact coordinates instead: {latitude: number, longitude: number}`
      );
    }
    throw error;
  }
}

// Helper function to calculate natal chart using Swiss Ephemeris
async function calculateNatalChart(
  datetime: DateTime,
  latitude: number,
  longitude: number,
  houseSystem: string = "Placidus"
) {
  try {
    // Convert local time to UTC using geo-tz + Luxon
    // This automatically handles historical DST rules for accurate calculations
    const hourUTC = convertLocalTimeToUTC(datetime, latitude, longitude);

    // Calculate Julian Day
    // Note: datetime.month is now 1-12, Swiss Ephemeris also uses 1-12
    const jd = julianDay(
      datetime.year,
      datetime.month, // Now using 1-12 directly
      datetime.day,
      hourUTC,
      CalendarType.Gregorian
    );

    // Map house system string to HouseSystem enum
    const houseSystemMap: Record<string, HouseSystem> = {
      Placidus: HouseSystem.Placidus,
      Koch: HouseSystem.Koch,
      Equal: HouseSystem.Equal,
      "Whole Sign": HouseSystem.WholeSign,
      Campanus: HouseSystem.Campanus,
      Regiomontanus: HouseSystem.Regiomontanus,
    };

    const selectedHouseSystem =
      houseSystemMap[houseSystem] || HouseSystem.Placidus;

    // Calculate houses
    const houses = calculateHouses(jd, latitude, longitude, selectedHouseSystem);

    // Calculate planetary positions
    const celestialBodies = [
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

    const planets = celestialBodies.map((body) => {
      const position = calculatePosition(jd, body.id);
      const zodiacInfo = degreeToZodiacSign(position.longitude);
      const housePosition = calculateHousePositionForPlanet(
        position.longitude,
        houses.cusps
      );

      return {
        name: body.name,
        key: body.key,
        longitude: position.longitude,
        latitude: position.latitude,
        speed: position.longitudeSpeed,
        isRetrograde: position.longitudeSpeed < 0,
        zodiacSign: zodiacInfo.sign,
        zodiacSignKey: zodiacInfo.signKey,
        degreeInSign: zodiacInfo.degreeInSign,
        house: housePosition,
      };
    });

    return {
      julianDay: jd,
      houses: houses,
      planets: planets,
      houseSystem: selectedHouseSystem,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to calculate natal chart: ${error.message}. Please verify the date, time, and location are valid.`
      );
    }
    throw error;
  }
}

// Helper function to format natal chart data
function formatNatalChartData(chartData: {
  julianDay: number;
  houses: any;
  planets: any[];
  houseSystem: HouseSystem;
}) {
  try {
    // Format planets information
    const planets = chartData.planets.map((planet) => ({
      name: planet.name,
      sign: planet.zodiacSign,
      degree: formatZodiacDegree(planet.degreeInSign),
      longitude: parseFloat(planet.longitude.toFixed(6)),
      house: planet.house,
      isRetrograde: planet.isRetrograde,
    }));

    // Format houses information
    const houses = chartData.houses.cusps.slice(1, 13).map((cuspDegree: number, index: number) => {
      const houseNumber = index + 1;
      const zodiacInfo = degreeToZodiacSign(cuspDegree);
      return {
        number: houseNumber,
        sign: zodiacInfo.sign,
        degree: formatZodiacDegree(zodiacInfo.degreeInSign),
        cuspDegree: parseFloat(cuspDegree.toFixed(6)),
      };
    });

    // Calculate aspects between planets
    const aspects = calculateAspects(chartData.planets);

    // Extract chart angles
    const ascendantInfo = degreeToZodiacSign(chartData.houses.ascendant);
    const ascendant = {
      sign: ascendantInfo.sign,
      degree: formatZodiacDegree(ascendantInfo.degreeInSign),
      longitude: parseFloat(chartData.houses.ascendant.toFixed(6)),
    };

    const mcInfo = degreeToZodiacSign(chartData.houses.mc);
    const midheaven = {
      sign: mcInfo.sign,
      degree: formatZodiacDegree(mcInfo.degreeInSign),
      longitude: parseFloat(chartData.houses.mc.toFixed(6)),
    };

    const descendantDegree = (chartData.houses.ascendant + 180) % 360;
    const descendantInfo = degreeToZodiacSign(descendantDegree);
    const descendant = {
      sign: descendantInfo.sign,
      degree: formatZodiacDegree(descendantInfo.degreeInSign),
      longitude: parseFloat(descendantDegree.toFixed(6)),
    };

    const imumCoeliDegree = (chartData.houses.mc + 180) % 360;
    const imumCoeliInfo = degreeToZodiacSign(imumCoeliDegree);
    const imumCoeli = {
      sign: imumCoeliInfo.sign,
      degree: formatZodiacDegree(imumCoeliInfo.degreeInSign),
      longitude: parseFloat(imumCoeliDegree.toFixed(6)),
    };

    // Get Sun sign from planets data
    const sunPlanet = chartData.planets.find((p) => p.key === "sun");
    const sunSign = sunPlanet ? sunPlanet.zodiacSign : "Unknown";

    return {
      planets,
      houses,
      aspects,
      chartAngles: {
        ascendant,
        descendant,
        midheaven,
        imumCoeli,
      },
      sunSign,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to format natal chart data: ${error.message}. The horoscope calculation may have produced invalid data.`
      );
    }
    throw error;
  }
}

// Convert Zod schema to JSON Schema for MCP
function zodToJsonSchema(schema: z.ZodType): any {
  // This is a simplified converter - for production use zod-to-json-schema library
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value as z.ZodType);
      if (!(value as any).isOptional()) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  if (schema instanceof z.ZodString) {
    return {
      type: "string",
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodNumber) {
    return {
      type: "number",
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodBoolean) {
    return {
      type: "boolean",
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema(schema.element),
    };
  }

  if (schema instanceof z.ZodUnion) {
    return {
      anyOf: schema.options.map((option: any) => zodToJsonSchema(option)),
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
    return zodToJsonSchema(schema._def.innerType);
  }

  return { type: "string" };
}

// Create server instance
const server = new Server(
  {
    name: "astro-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: "astro_calculate_natal_chart",
      description:
        "Calculate a complete natal chart (birth chart) based on date, time, and location. Returns detailed astrological information including: planetary positions in zodiac signs and houses with exact degrees, all 12 houses with their cusps, chart angles (Ascendant/Rising, Midheaven, Descendant, Imum Coeli), and major aspects between planets with orbs. Supports multiple house systems.",
      inputSchema: zodToJsonSchema(CalculateNatalChartArgsSchema),
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    {
      name: "astro_get_coordinates",
      description:
        "Convert a location string (city, country) to geographic coordinates (latitude, longitude) using OpenStreetMap geocoding. Useful for obtaining coordinates before calculating a natal chart when only the city name is known.",
      inputSchema: zodToJsonSchema(GetCoordinatesArgsSchema),
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
  ];

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "astro_calculate_natal_chart") {
      // Validate input
      const validatedArgs = CalculateNatalChartArgsSchema.parse(args);
      const { datetime, location, houseSystem } = validatedArgs;

      // Get coordinates
      const coords = await getCoordinates(location);

      // Calculate natal chart
      const horoscope = await calculateNatalChart(
        datetime,
        coords.latitude,
        coords.longitude,
        houseSystem
      );

      // Format data
      const chartData = formatNatalChartData(horoscope);

      // Add location info
      const result = {
        ...chartData,
        birthData: {
          datetime: datetime,
          location: coords.formattedAddress || String(location),
          latitude: coords.latitude,
          longitude: coords.longitude,
          houseSystem: houseSystem,
        },
      };

      // Validate output
      NatalChartOutputSchema.parse(result);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "astro_get_coordinates") {
      // Validate input
      const validatedArgs = GetCoordinatesArgsSchema.parse(args);
      const { location } = validatedArgs;

      const coords = await getCoordinates(location);

      // Validate output
      CoordinatesOutputSchema.parse(coords);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(coords, null, 2),
          },
        ],
      };
    }

    throw new Error(
      `Unknown tool: ${name}. Available tools are: astro_calculate_natal_chart, astro_get_coordinates`
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      return {
        content: [
          {
            type: "text",
            text: `Input validation error:\n${issues}\n\nPlease check the input parameters and try again.`,
          },
        ],
        isError: true,
      };
    }

    if (error instanceof Error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `An unexpected error occurred. Please check your input and try again.`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Astro MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
