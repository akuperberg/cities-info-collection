# Cities Info Collection Backend

Next.js backend API for the Cities Info Collection application. The backend exposes REST endpoints that support the Angular frontend and performs server-side scraping for travel safety data sourced from [Travel Safe - Abroad](https://www.travelsafe-abroad.com).

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The API will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes (including scraping endpoints)
│   └── layout.tsx    # Minimal App Router layout
├── package.json
├── tsconfig.json
└── next.config.js
```

## API Routes

- `GET /api/test` — Simple health check for the backend service.

- `GET /api/travel-safe` — Scrapes the Travel Safe directory and returns a list of countries with their cities.
  - Optional query parameter `country`: `GET /api/travel-safe?country=italy` returns only the matching country entry.

- `GET /api/city` — Scrapes detailed information about a specific city from Travel Safe - Abroad.
  - Required query parameter `url`: The full URL of the city page (e.g., `https://www.travelsafe-abroad.com/italy/rome/`)
  - Returns: Safety index, user sentiment, description, risk level, and related cities
  - Example: `GET /api/city?url=https://www.travelsafe-abroad.com/italy/rome/`

Responses include the original source URL and `scrapedAt` timestamps. The scraping requests are cached for one hour to avoid excessive load on the upstream site.

## Configuration

The backend is configured to allow CORS requests from the Angular frontend running on `http://localhost:4200`. You can modify this in `next.config.js` if needed.

## Notes on Scraping

- The project uses `cheerio` to parse HTML from Travel Safe - Abroad.
- The scraper sets a custom user agent string; adjust it to match your deployment requirements.
- Respect the source website's terms of service and robots.txt before using this endpoint in production.

