/**
 * Tool registry
 */

import { natalChartTool, handleNatalChart } from "./natal-chart.js";
import { coordinatesTool, handleGetCoordinates } from "./coordinates.js";

export const tools = [natalChartTool, coordinatesTool];

export const toolHandlers: Record<string, (args: unknown) => Promise<any>> = {
  "astrology_calculate_natal_chart": handleNatalChart,
  "astrology_get_coordinates": handleGetCoordinates,
};
