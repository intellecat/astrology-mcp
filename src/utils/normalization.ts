/**
 * Timezone and normalization utilities
 */

import { DateTime as LuxonDateTime } from "luxon";
import { find as findTimezone } from "geo-tz";
import type { DateTime } from "../schemas/index.js";

/**
 * Convert local time to UTC using timezone information from coordinates
 * Uses geo-tz to get IANA timezone and Luxon for accurate conversion
 * Handles historical DST rules automatically
 */
export function convertLocalTimeToUTC(
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
