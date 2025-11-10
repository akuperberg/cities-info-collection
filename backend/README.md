# Cities Info Collection Backend

Next.js backend API for the Cities Info Collection application.

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
│   ├── api/          # API routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── package.json
├── tsconfig.json
└── next.config.js
```

## Configuration

The backend is configured to allow CORS requests from the Angular frontend running on `http://localhost:4200`. You can modify this in `next.config.js` if needed.

