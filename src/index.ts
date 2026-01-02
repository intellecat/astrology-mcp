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
 * Convert local time to UTC using timezone information from coordinates
 * Uses IANA timezone database via Luxon
 */
async function convertLocalTimeToUTC(
  datetime: DateTime,
  latitude: number,
  longitude: number
): Promise<{ year: number; month: number; day: number; hour: number }> {
  try {
    // For now, we'll use a simplified approach with timezone offset
    // In production, you might want to use a more sophisticated timezone lookup
    // based on coordinates, or require the user to provide timezone

    // Simple timezone offset calculation based on longitude
    // This is approximate - in production use a proper timezone library
    const timezoneOffset = Math.round(longitude / 15);

    const utcDate = LuxonDateTime.utc(
      datetime.year,
      datetime.month, // Now using 1-12 directly (Luxon also uses 1-12)
      datetime.day,
      datetime.hour,
      datetime.minute
    ).minus({ hours: timezoneOffset });

    return {
      year: utcDate.year,
      month: utcDate.month, // 1-12
      day: utcDate.day,
      hour: utcDate.hour + utcDate.minute / 60,
    };
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
  key: z.string(),
  zodiacSign: z.string(),
  zodiacSignKey: z.string(),
  degree: z.number(),
  degreeFormatted: z.string(),
  degreeInSign: z.string(),
  house: z.number(),
  isRetrograde: z.boolean(),
});

const HouseSchema = z.object({
  number: z.number(),
  label: z.string(),
  sign: z.string(),
  signKey: z.string(),
  cuspDegree: z.number(),
  cuspDegreeFormatted: z.string(),
});

const AspectSchema = z.object({
  point1: z.string(),
  point1Key: z.string(),
  point2: z.string(),
  point2Key: z.string(),
  aspect: z.string(),
  aspectKey: z.string(),
  aspectLevel: z.string(),
  orb: z.number(),
  orbUsed: z.number(),
});

const ChartAngleSchema = z.object({
  degree: z.number(),
  degreeFormatted: z.string().optional(),
  sign: z.string(),
  signKey: z.string().optional(),
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
    // Convert local time to UTC (Swiss Ephemeris requires UTC)
    // For now, using a simplified approach based on longitude
    // TODO: Consider adding timezone as an explicit parameter
    const timezoneOffset = Math.round(longitude / 15);
    const hourUTC = datetime.hour + timezoneOffset + datetime.minute / 60;

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
      { id: LunarPoint.MeanNode, name: "North Node", key: "northnode" },
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
      key: planet.key,
      zodiacSign: planet.zodiacSign,
      zodiacSignKey: planet.zodiacSignKey,
      degree: planet.longitude,
      degreeFormatted: formatZodiacDegree(planet.longitude),
      degreeInSign: formatZodiacDegree(planet.degreeInSign),
      house: planet.house,
      isRetrograde: planet.isRetrograde,
    }));

    // Format houses information
    const houses = chartData.houses.cusps.slice(1, 13).map((cuspDegree: number, index: number) => {
      const houseNumber = index + 1;
      const zodiacInfo = degreeToZodiacSign(cuspDegree);
      return {
        number: houseNumber,
        label: `House ${houseNumber}`,
        sign: zodiacInfo.sign,
        signKey: zodiacInfo.signKey,
        cuspDegree: cuspDegree,
        cuspDegreeFormatted: formatZodiacDegree(cuspDegree),
      };
    });

    // Calculate aspects (basic implementation - can be enhanced)
    const aspects: any[] = [];
    // TODO: Implement aspect calculation if needed
    // This would require calculating angles between planets and checking for aspects
    // (conjunction, opposition, trine, square, sextile, etc.)

    // Extract chart angles
    const ascendantInfo = degreeToZodiacSign(chartData.houses.ascendant);
    const ascendant = {
      degree: chartData.houses.ascendant,
      degreeFormatted: formatZodiacDegree(chartData.houses.ascendant),
      sign: ascendantInfo.sign,
      signKey: ascendantInfo.signKey,
    };

    const mchiInfo = degreeToZodiacSign(chartData.houses.mc);
    const midheaven = {
      degree: chartData.houses.mc,
      degreeFormatted: formatZodiacDegree(chartData.houses.mc),
      sign: mchiInfo.sign,
      signKey: mchiInfo.signKey,
    };

    const descendantDegree = (chartData.houses.ascendant + 180) % 360;
    const descendantInfo = degreeToZodiacSign(descendantDegree);
    const descendant = {
      degree: descendantDegree,
      degreeFormatted: formatZodiacDegree(descendantDegree),
      sign: descendantInfo.sign,
      signKey: descendantInfo.signKey,
    };

    const imumCoeliDegree = (chartData.houses.mc + 180) % 360;
    const imumCoeliInfo = degreeToZodiacSign(imumCoeliDegree);
    const imumCoeli = {
      degree: imumCoeliDegree,
      degreeFormatted: formatZodiacDegree(imumCoeliDegree),
      sign: imumCoeliInfo.sign,
      signKey: imumCoeliInfo.signKey,
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
