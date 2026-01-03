/**
 * Input validation schemas
 */

import { z } from "zod";

export const DateTimeSchema = z.object({
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

export const CoordinatesSchema = z.object({
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

export const LocationSchema = z.union([
  CoordinatesSchema,
  z
    .string()
    .min(1)
    .describe("Location in format 'City, Country' (e.g., 'New York, USA')"),
]);

export const CalculateNatalChartArgsSchema = z.object({
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

export const GetCoordinatesArgsSchema = z.object({
  location: z
    .string()
    .min(1)
    .describe("Location in format 'City, Country' (e.g., 'London, UK')"),
});

// Inferred types
export type DateTime = z.infer<typeof DateTimeSchema>;
export type Coordinates = z.infer<typeof CoordinatesSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type CalculateNatalChartArgs = z.infer<typeof CalculateNatalChartArgsSchema>;
export type GetCoordinatesArgs = z.infer<typeof GetCoordinatesArgsSchema>;
