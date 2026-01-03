/**
 * Coordinates tool handler
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  GetCoordinatesArgsSchema,
  CoordinatesOutputSchema,
  zodToJsonSchema,
} from "../schemas/index.js";
import { getCoordinates } from "../services/geolocation.js";

export const coordinatesTool: Tool = {
  name: "astro_get_coordinates",
  description:
    "Convert a location string (city, country) to geographic coordinates (latitude, longitude) using OpenStreetMap geocoding. Useful for obtaining coordinates before calculating a natal chart when only the city name is known.",
  inputSchema: zodToJsonSchema(GetCoordinatesArgsSchema),
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export async function handleGetCoordinates(args: unknown) {
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
