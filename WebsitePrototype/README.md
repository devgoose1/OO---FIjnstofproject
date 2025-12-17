# CSV Explorer

React + Express app for uploading CSV files, storing them in SQLite, and exploring them with interactive charts.

## Stack
- Frontend: Vite + React, Recharts, Axios
- Backend: Express, multer, csv-parse, better-sqlite3 (SQLite)

## Quick start
1. Install dependencies:
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
2. Start the API (port 4000): `npm run dev --prefix backend`
3. Start the web app (port 5173): `npm run dev --prefix frontend`
4. Open http://localhost:5173/ and upload a CSV. The app parses and persists the file so you can revisit it without re-uploading.

Environment override (optional): set `VITE_API_URL` to point the frontend to a different API host.

## API
- `POST /api/upload` — multipart form field `file`; optional field `name`. Parses CSV, saves rows to SQLite, returns dataset metadata.
- `GET /api/datasets` — list datasets with columns and row counts.
- `GET /api/datasets/:id` — dataset metadata.
- `GET /api/datasets/:id/rows` — all rows for the dataset.

## Notes
- Data is stored locally in `backend/data.sqlite`.
- The frontend build is available via `npm run build --prefix frontend`.
