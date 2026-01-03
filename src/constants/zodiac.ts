/**
 * Zodiac sign definitions
 */

export interface ZodiacSign {
  label: string;
  key: string;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
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
