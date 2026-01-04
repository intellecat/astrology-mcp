# Astrology MCP Server

A Model Context Protocol (MCP) server that provides astrological natal chart calculations. Built with TypeScript and the MCP SDK, this server enables AI assistants to calculate and interpret astrological birth charts based on date, time, and location.

**🌟 Now powered by @swisseph/node** - Using the Swiss Ephemeris calculation engine for highly accurate astronomical calculations.

## Features

- **TypeScript Implementation** - Full type safety with Zod schemas
- **Latest MCP SDK** - Uses modern MCP best practices
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

## Quick Start

You can run the server directly using `npx` without installing anything:

```bash
npx -y astrology-mcp
```

### Configuring with Claude Desktop

Add to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "astrology": {
      "command": "npx",
      "args": ["-y", "astrology-mcp"]
    }
  }
}
```

## Manual Installation (From Source)

If you want to modify the code or run from source:

```bash
git clone https://github.com/your-username/astrology-mcp.git
cd astrology-mcp
npm install
npm run build
```

## Dependencies

### Runtime
- `@modelcontextprotocol/sdk` - Latest MCP SDK
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

### 1. astrology_calculate_natal_chart

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
      "sign": "Taurus",
      "degree": "24° 39' 24\"",
      "longitude": 84.6567,
      "house": 9,
      "isRetrograde": false
    }
  ],
  "houses": [
    {
      "number": 1,
      "sign": "Virgo",
      "degree": "19° 27' 38\"",
      "cuspDegree": 169.4606
    }
  ],
  "aspects": [
    {
      "point1": "Sun",
      "point2": "Moon",
      "aspect": "Trine",
      "aspectLevel": "Major",
      "orb": 5.85,
      "orbUsed": 7
    }
  ],
  "chartAngles": {
    "ascendant": {
      "sign": "Virgo",
      "degree": "19° 27' 38\"",
      "longitude": 169.4606
    },
    "midheaven": {
      "sign": "Gemini",
      "degree": "17° 46' 33\"",
      "longitude": 77.7759
    },
    "descendant": {
      "sign": "Pisces",
      "degree": "19° 27' 38\"",
      "longitude": 349.4606
    },
    "imumCoeli": {
      "sign": "Sagittarius",
      "degree": "17° 46' 33\"",
      "longitude": 257.7759
    }
  },
  "sunSign": "Taurus",
  "birthData": {
    "datetime": {
      "year": 1990,
      "month": 5,
      "day": 15,
      "hour": 14,
      "minute": 30
    },
    "location": "New York, NY, USA",
    "latitude": 40.7128,
    "longitude": -74.006,
    "houseSystem": "Placidus"
  }
}
```

### 2. astrology_get_coordinates

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
  "tool": "astrology_calculate_natal_chart",
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
  "tool": "astrology_calculate_natal_chart",
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
  "tool": "astrology_get_coordinates",
  "arguments": {
    "location": "Tokyo, Japan"
  }
}
```



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
Automatically calculates aspects between all planets with configurable orbs:

**Major Aspects:**
- Conjunction (0°, orb: 10°)
- Sextile (60°, orb: 6°)
- Square (90°, orb: 8°)
- Trine (120°, orb: 8°)
- Opposition (180°, orb: 10°)

**Minor Aspects:**
- Semi-Sextile (30°, orb: 3°)
- Semi-Square (45°, orb: 3°)
- Sesquiquadrate (135°, orb: 3°)
- Quincunx (150°, orb: 3°)

## License

AGPL-3.0

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
