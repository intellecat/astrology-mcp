/**
 * House system mappings
 */

import { HouseSystem } from "@swisseph/node";

export const HOUSE_SYSTEM_MAP: Record<string, HouseSystem> = {
  Placidus: HouseSystem.Placidus,
  Koch: HouseSystem.Koch,
  Equal: HouseSystem.Equal,
  "Whole Sign": HouseSystem.WholeSign,
  Campanus: HouseSystem.Campanus,
  Regiomontanus: HouseSystem.Regiomontanus,
};
