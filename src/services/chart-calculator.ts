/**
 * Natal chart calculation service
 */

import {
  julianDay,
  calculateHouses,
  calculatePosition,
  Planet,
  LunarPoint,
  Asteroid,
  HouseSystem,
  CalendarType,
} from "@swisseph/node";
import { HOUSE_SYSTEM_MAP, CELESTIAL_BODIES } from "../constants/index.js";
import { degreeToZodiacSign, formatZodiacDegree, calculateHousePositionForPlanet } from "../utils/index.js";
import { convertLocalTimeToUTC } from "../utils/index.js";
import { calculateAspects } from "./aspect-calculator.js";
import type { DateTime } from "../schemas/index.js";

/**
 * Calculate natal chart using Swiss Ephemeris
 */
export async function calculateNatalChart(
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

    const selectedHouseSystem =
      HOUSE_SYSTEM_MAP[houseSystem] || HouseSystem.Placidus;

    // Calculate houses
    const houses = calculateHouses(jd, latitude, longitude, selectedHouseSystem);

    // Calculate planetary positions
    const planets = CELESTIAL_BODIES.map((body) => {
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

/**
 * Format natal chart data for output
 */
export function formatNatalChartData(chartData: {
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
