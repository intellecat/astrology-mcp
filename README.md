# Astro MCP Server

A Model Context Protocol (MCP) server that provides astrological natal chart calculations. Built with TypeScript and the latest MCP SDK (v1.25.1), this server enables AI assistants to calculate and interpret astrological birth charts based on date, time, and location.

**🌟 Now powered by @swisseph/node** - Using the Swiss Ephemeris calculation engine for highly accurate astronomical calculations.

## Features

- **TypeScript Implementation** - Full type safety with Zod schemas
- **Latest MCP SDK (v1.25.1)** - Uses modern MCP best practices
- **Input Validation** - Comprehensive validation with actionable error messages
- **Complete Natal Charts** - Calculate detailed birth charts with:
  - Planet positions in zodiac signs and degrees
  - House placements for all planets
  - Chart angles (Ascendant, Midheaven, Descendant, Imum Coeli)
  - Major and minor aspects between planets with orbs
  - Retrograde indicators
- **Flexible Location Input** - Support for both coordinate input and city/country geocoding
- **Multiple House Systems** - Placidus, Koch, Equal, Whole Sign, and more
- **Free Geocoding** - Using OpenStreetMap (no API key required)
- **Tool Annotations** - Proper readOnlyHint and idempotentHint annotations

## Installation

```bash
npm install
npm run build
```

## Dependencies

### Runtime
- `@modelcontextprotocol/sdk` (^1.25.1) - Latest MCP SDK
- `@swisseph/node` - Swiss Ephemeris calculation engine (high precision)
- `luxon` - Timezone and date handling
- `node-geocoder` - Location to coordinate conversion
- `zod` - Schema validation

### Development
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `@types/node-geocoder` - node-geocoder type definitions
- `@types/luxon` - Luxon type definitions

## Usage

### Building

```bash
npm run build
```

### Running the Server

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Testing

Run the test script to verify the horoscope calculations:

```bash
npm test
```

## MCP Tools

### 1. astro_calculate_natal_chart

Calculate a complete natal chart based on birth data.

**Parameters:**
- `datetime` (object, required): Birth date and time
  - `year` (number): Year (e.g., 1990)
  - `month` (number): Month (1-12, where 1=January, 12=December)
  - `day` (number): Day of month (1-31)
  - `hour` (number): Hour in local time (0-23)
  - `minute` (number): Minute (0-59)
- `location` (object or string, required):
  - As object: `{latitude: 40.7128, longitude: -74.0060}`
  - As string: `"New York, USA"`
- `houseSystem` (string, optional): House system to use (default: "Placidus")

**Returns:**
```json
{
  "planets": [
    {
      "name": "Sun",
      "key": "sun",
      "zodiacSign": "Taurus",
      "zodiacSignKey": "taurus",
      "degree": 84.6567,
      "degreeFormatted": "84° 39' 24''",
      "degreeInSign": "24° 39' 24''",
      "house": 9,
      "isRetrograde": false
    }
  ],
  "houses": [
    {
      "number": 1,
      "label": "1st House",
      "sign": "Virgo",
      "signKey": "virgo",
      "cuspDegree": 169.4606,
      "cuspDegreeFormatted": "169° 27' 38''"
    }
  ],
  "aspects": [
    {
      "point1": "Sun",
      "point1Key": "sun",
      "point2": "Moon",
      "point2Key": "moon",
      "aspect": "Trine",
      "aspectKey": "trine",
      "aspectLevel": "Major",
      "orb": 5.85,
      "orbUsed": 7
    }
  ],
  "chartAngles": {
    "ascendant": {
      "degree": 169.4606,
      "degreeFormatted": "169° 27' 38''",
      "sign": "Virgo",
      "signKey": "virgo"
    },
    "midheaven": {
      "degree": 77.7759,
      "degreeFormatted": "77° 46' 33''",
      "sign": "Gemini",
      "signKey": "gemini"
    },
    "descendant": {
      "degree": 349.4606,
      "sign": "Pisces"
    },
    "imumCoeli": {
      "degree": 257.7759,
      "sign": "Sagittarius"
    }
  },
  "sunSign": "Taurus",
  "birthData": {
    "datetime": {...},
    "location": "New York, NY, USA",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "houseSystem": "Placidus"
  }
}
```

### 2. astro_get_coordinates

Convert a location string to geographic coordinates.

**Parameters:**
- `location` (string, required): Location in format "City, Country" (e.g., "London, UK")

**Returns:**
```json
{
  "latitude": 51.5074,
  "longitude": -0.1278,
  "formattedAddress": "London, Greater London, England, UK"
}
```

## Example Usage with MCP Client

### Example 1: Calculate natal chart with coordinates

```javascript
{
  "tool": "astro_calculate_natal_chart",
  "arguments": {
    "datetime": {
      "year": 1990,
      "month": 5,
      "day": 15,
      "hour": 14,
      "minute": 30
    },
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

### Example 2: Calculate natal chart with city name

```javascript
{
  "tool": "astro_calculate_natal_chart",
  "arguments": {
    "datetime": {
      "year": 1995,
      "month": 12,
      "day": 25,
      "hour": 8,
      "minute": 0
    },
    "location": "Paris, France",
    "houseSystem": "Whole Sign"
  }
}
```

### Example 3: Get coordinates for a location

```javascript
{
  "tool": "astro_get_coordinates",
  "arguments": {
    "location": "Tokyo, Japan"
  }
}
```

## Configuring with Claude Desktop

Add to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "astro": {
      "command": "node",
      "args": ["/absolute/path/to/astro-mcp/dist/index.js"]
    }
  }
}
```

**Note**: Make sure to run `npm run build` first to compile the TypeScript code to the `dist/` directory.

## House Systems Supported

The server supports various house systems including:
- Placidus (default)
- Koch
- Equal
- Whole Sign
- Campanus
- Regiomontanus
- And more supported by the Swiss Ephemeris library

## Technical Details

### Date Format
- Month is 1-12 (1 = January, 12 = December)
- Hour is in 24-hour format (0-23)
- All times are in local time for the birth location

### Coordinate Format
- Latitude: -90 to 90 (negative for South)
- Longitude: -180 to 180 (negative for West)

### Zodiac System
- Uses tropical zodiac (aligned with seasons)
- Degrees are measured from 0° Aries

## Astrological Information Provided

### Planets
Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, North Node (Mean Node), Chiron

### Chart Points
- Ascendant (AS) - Rising sign
- Midheaven (MC) - Medium Coeli
- Descendant (DS) - Opposite Ascendant
- Imum Coeli (IC) - Opposite Midheaven

### Aspects
Aspect calculation is available as an enhancement. The current implementation provides all planetary positions, allowing for custom aspect calculation based on your preferred orbs and aspect types.

## License

MIT

## Migration to Swiss Ephemeris

This server has been migrated from `circular-natal-horoscope-js` to `@swisseph/node` for improved accuracy. The Swiss Ephemeris is the industry standard for astronomical calculations in astrology, providing:

- Higher precision planetary positions (accurate to arcminutes)
- Reliable retrograde detection
- Extensive support for asteroids and minor bodies
- Industry-standard calculations used by professional astrologers

See `MIGRATION_NOTES.md` and `compare-libraries.ts` for migration details and accuracy comparisons.

## Credits

Built with:
- [Swiss Ephemeris (@swisseph/node)](https://github.com/swisseph-js/swisseph) - High-precision astronomical calculations
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) - MCP framework
- [node-geocoder](https://github.com/nchaulet/node-geocoder) - Geocoding service
- [Luxon](https://moment.github.io/luxon/) - Date and timezone handling
