require('dotenv').config();

const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

const { carsCollection } = require('../src/firestoreAdmin');
const { carBaseSchema, normalizeCar, getCarDocId } = require('../src/lib/carSchema');

function parseArg(name, defaultValue) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return defaultValue;
  const v = process.argv[idx + 1];
  return v === undefined ? defaultValue : v;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const limit = parseArg('--limit', undefined);

  const datasetPath = path.resolve(__dirname, '..', '..', 'Automobile.csv');
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`CSV not found at ${datasetPath}`);
  }

  let totalRows = 0;
  let validRows = 0;
  let invalidRows = 0;
  let duplicateIds = 0;
  const seenIds = new Set();

  const BATCH_SIZE = 500;
  let batch = null;
  let opCount = 0;
  const db = carsCollection().doc().firestore;

  let batchCommitCount = 0;

  function initBatch() {
    batch = db.batch();
    opCount = 0;
  }
  initBatch();

  const toCarRow = (row) => {
    // fast-csv produces header-based keys; they match the dataset columns.
    // Some numeric fields may be empty strings in the CSV (=> null).
    const origin = row.origin ? String(row.origin).trim().toLowerCase() : row.origin;

    return {
      name: row.name,
      mpg: row.mpg,
      cylinders: row.cylinders,
      displacement: row.displacement,
      horsepower: row.horsepower,
      weight: row.weight,
      acceleration: row.acceleration,
      model_year: row.model_year,
      origin
    };
  };

  const stream = fs.createReadStream(datasetPath);

  await new Promise((resolve, reject) => {
    csv
      .parseStream(stream, { headers: true, ignoreEmpty: false, trim: true })
      .on('error', reject)
      .on('data', (row) => {
        const idx = totalRows;
        totalRows += 1;

        if (limit !== undefined && Number.isFinite(Number(limit)) && idx >= Number(limit)) {
          return;
        }

        const rawCar = toCarRow(row);
        const parsed = carBaseSchema.safeParse(rawCar);
        if (!parsed.success) {
          invalidRows += 1;
          return;
        }

        const car = normalizeCar(parsed.data);
        const id = getCarDocId(car);

        if (seenIds.has(id)) {
          duplicateIds += 1;
          return;
        }
        seenIds.add(id);

        validRows += 1;

        if (!dryRun) {
          const ref = carsCollection().doc(id);
          batch.set(ref, car, { merge: false });
        }

        opCount += 1;
        if (!dryRun && opCount >= BATCH_SIZE) {
          batch.commit();
          batchCommitCount += 1;
          initBatch();
        }
      })
      .on('end', async () => {
        try {
          if (!dryRun && opCount > 0) {
            await batch.commit();
            batchCommitCount += 1;
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
  });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        datasetPath,
        dryRun,
        totalRows,
        validRows,
        invalidRows,
        duplicateIds,
        batchCommitCount
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

