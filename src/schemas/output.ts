/**
 * Output validation schemas
 */

import { z } from "zod";
import { DateTimeSchema } from "./input.js";

export const PlanetSchema = z.object({
  name: z.string(),
  sign: z.string(),
  degree: z.string(),
  longitude: z.number(),
  house: z.number(),
  isRetrograde: z.boolean(),
});

export const HouseSchema = z.object({
  number: z.number(),
  sign: z.string(),
  degree: z.string(),
  cuspDegree: z.number(),
});

export const AspectSchema = z.object({
  point1: z.string(),
  point2: z.string(),
  aspect: z.string(),
  aspectLevel: z.string(),
  orb: z.number(),
  orbUsed: z.number(),
});

export const ChartAngleSchema = z.object({
  sign: z.string(),
  degree: z.string(),
  longitude: z.number(),
});

export const NatalChartOutputSchema = z.object({
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

export const CoordinatesOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string().optional(),
});

// Inferred types
export type Planet = z.infer<typeof PlanetSchema>;
export type House = z.infer<typeof HouseSchema>;
export type Aspect = z.infer<typeof AspectSchema>;
export type ChartAngle = z.infer<typeof ChartAngleSchema>;
export type NatalChartOutput = z.infer<typeof NatalChartOutputSchema>;
export type CoordinatesOutput = z.infer<typeof CoordinatesOutputSchema>;
