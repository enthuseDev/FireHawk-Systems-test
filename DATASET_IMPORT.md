# Import the Initial Dataset into Firestore (Step-by-step)

This project ships with a ready-to-run import script.
It reads `Automobile.csv` and stores the cars in Firestore.

## Before you start

You need:
* A Firebase service account JSON file
* A Firestore database (the backend writes into a collection named `cars` by default)
* Node installed

## 1) Set up the backend configuration

1. Copy:
   * `backend/.env.example` -> `backend/.env`
2. Open `backend/.env` and set:
   * `GOOGLE_APPLICATION_CREDENTIALS` -> the path to your service account JSON

Optional:
* `FIRESTORE_COLLECTION` (defaults to `cars`)

[OK] Note: do NOT commit your real service account JSON file.

## 2) Run the import

From the repo root, run:

```bash
cd backend
npm run import:dataset
```

The script supports a couple of helpful options:
* `--dry-run` -> checks the CSV rows, but doesn’t write to Firestore
* `--limit <n>` -> imports only the first `<n>` valid rows

Examples:

```bash
npm run import:dataset -- --dry-run
npm run import:dataset -- --limit 50
```

## 3) What the script does (in plain English)

For every line in `Automobile.csv`, it will:
1. Validate the data
2. Convert numeric fields into numbers
3. Save the car into Firestore

It also uses a deterministic document id:
* If you run the import again, it won’t create duplicates.

## 4) Where the data ends up

* Firestore collection: `FIRESTORE_COLLECTION` (default: `cars`)
* Each car document contains:
  * `name`, `mpg`, `cylinders`, `displacement`, `horsepower`, `weight`, `acceleration`, `model_year`, `origin`

