/**
 * Geolocation service for converting location strings to coordinates
 */

import NodeGeocoder from "node-geocoder";
import type { Location } from "../schemas/index.js";
import type { CoordinatesResult } from "../types/index.js";

// Initialize geocoder
const geocoder = NodeGeocoder({
  provider: "openstreetmap",
});

/**
 * Convert location to coordinates
 * Accepts either coordinates object or location string
 */
export async function getCoordinates(location: Location): Promise<CoordinatesResult> {
  // Check if location is already coordinates
  if (typeof location === "object" && "latitude" in location) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  // Location is a string
  // First, check if it's a JSON string representing coordinates
  if (typeof location === "string" && location.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(location);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number"
      ) {
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          formattedAddress: parsed.formattedAddress,
        };
      }
    } catch (e) {
      // Not a valid JSON string, ignore and proceed to geocoding
    }
  }

  // Treat as address string (city-country format)
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
