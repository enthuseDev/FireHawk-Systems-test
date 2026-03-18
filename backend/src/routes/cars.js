const express = require('express');
const csv = require('fast-csv');

const { listCarsFromFirestore } = require('../services/carsService');
const {
  normalizeQuery,
  applyFilters,
  sortCars,
  paginateCars
} = require('../lib/carsQuery');

const router = express.Router();

function toCsvRow(car) {
  return {
    name: car.name ?? '',
    mpg: car.mpg ?? '',
    cylinders: car.cylinders ?? '',
    displacement: car.displacement ?? '',
    horsepower: car.horsepower ?? '',
    weight: car.weight ?? '',
    acceleration: car.acceleration ?? '',
    model_year: car.model_year ?? '',
    origin: car.origin ?? ''
  };
}

router.get('/', async (req, res) => {
  try {
    const query = normalizeQuery(req.query);
    const allCars = await listCarsFromFirestore();

    const filtered = applyFilters(allCars, query);
    const sorted = sortCars(filtered, query.sortBy, query.sortDir);
    const result = paginateCars(sorted, query.page, query.pageSize);

    res.json(result);
  } catch (err) {
    res.status(400).json({
      error: 'Bad Request',
      message: err?.message || 'Unknown error'
    });
  }
});

router.get('/export.csv', async (req, res) => {
  try {
    const query = normalizeQuery(req.query);
    const allCars = await listCarsFromFirestore();

    const filtered = applyFilters(allCars, query);
    const sorted = sortCars(filtered, query.sortBy, query.sortDir);

    const rows = sorted.map(toCsvRow);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cars.csv"');

    // Write headers from the first row's keys.
    csv.writeToStream(res, rows, { headers: true });
  } catch (err) {
    res.status(400).json({
      error: 'Bad Request',
      message: err?.message || 'Unknown error'
    });
  }
});

const carsRouter = router;

module.exports = { carsRouter };

