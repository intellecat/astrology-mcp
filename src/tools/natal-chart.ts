/**
 * Natal chart tool handler
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  CalculateNatalChartArgsSchema,
  NatalChartOutputSchema,
  zodToJsonSchema,
} from "../schemas/index.js";
import { getCoordinates } from "../services/geolocation.js";
import { calculateNatalChart, formatNatalChartData } from "../services/chart-calculator.js";

export const natalChartTool: Tool = {
  name: "astrology_calculate_natal_chart",
  description:
    "Calculate a complete natal chart (birth chart) based on date, time, and location. Returns detailed astrological information including: planetary positions in zodiac signs and houses with exact degrees, all 12 houses with their cusps, chart angles (Ascendant/Rising, Midheaven, Descendant, Imum Coeli), and major aspects between planets with orbs. Supports multiple house systems.",
  inputSchema: zodToJsonSchema(CalculateNatalChartArgsSchema),
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export async function handleNatalChart(args: unknown) {
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
