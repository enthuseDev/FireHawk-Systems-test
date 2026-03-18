# FireHawk Systems - Car Dataset Explorer

This is a small app for exploring the classic car dataset in a database.
You can filter, search, sort, add cars, and download your current view as CSV.

## Quick “John” start

1. Start the backend (Node/Express)
2. Import the dataset (one-time)
3. Start the frontend (Angular)
4. Open `http://localhost:4200`

## What you’ll find in the UI

* A Filters panel (search + numeric ranges + origin)
* A table you can sort by clicking column headers
* Pagination so you don’t have to scroll forever
* “Download CSV” to backup your current results
* “Add Car” form (so you can extend the dataset later)

## Backend API (what the frontend calls)

* `GET /api/cars` - returns cars based on filters/sort/search/page
* `GET /api/cars/export.csv` - downloads the same results as CSV
* `POST /api/cars` - adds one car (validated before writing)

For the full interaction guide, see `GUIDE.md`.
For the import steps/command, see `DATASET_IMPORT.md`.

# FireHawk Systems - Car Dataset Explorer

Simple web app (Angular + Tailwind UI) that lets John filter/search/sort a car dataset stored in Firestore, and export results to CSV.

## What you can do
- Filter and search cars by multiple fields (with numeric ranges).
- Sort by common fields (name, MPG, horsepower, year, origin, etc.).
- Paginate results.
- Persist your filter/sort settings so they’re restored when you reopen the browser.
- Download the currently-filtered/sorted results as a CSV file.
- Add new cars (server-side validation before writes).

## Local setup (quick start)

### 1. Configure Firestore Admin (backend)
The backend uses the Firebase Admin SDK, so you must provide a service account JSON.

1. Copy `backend/.env.example` to `backend/.env`
2. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON file.
3. Start the backend server.

### 2. Run backend
From the repo root:

```bash
cd backend
npm install
npm run start
```

Backend will expose:
- `GET /api/health`
- `GET /api/cars` (filtering/search/sorting/pagination)
- `GET /api/cars/export.csv` (CSV download)
- `POST /api/cars` (add car; validated)

### 3. Import the initial dataset into Firestore
See `DATASET_IMPORT.md` for the full step-by-step guide and exact command.

### 4. Run frontend
In another terminal:

```bash
cd frontend
npm install
npm start
```

Open:
- `http://localhost:4200`

## Notes on live deployment (bonus)
This assessment environment is offline, so a public live URL isn’t created here. The app is set up so you can deploy `frontend/` and `backend/` to your preferred hosting provider later.
