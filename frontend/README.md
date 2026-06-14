# artisan-marketplace frontend

Vite React UI for the Artisan Handicraft Marketplace.

## Run locally

Start the backend from `Backend`, then run:

```bash
npm install
npm run dev
```

The app talks to the Express API at `VITE_API_BASE_URL` (see `.env.example`),
defaulting to `http://localhost:5000` for local development. For deployment,
set `VITE_API_BASE_URL` to your Render backend URL in Vercel's project
environment variables.
