const { z } = require('zod');

const SORT_FIELDS = [
  'name',
  'mpg',
  'cylinders',
  'displacement',
  'horsepower',
  'weight',
  'acceleration',
  'model_year',
  'origin'
];

function parseNullableNumber(value) {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (str === '') return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

const querySchema = z.object({
  q: z
    .string()
    .trim()
    .max(120)
    .optional(),
  origin: z
    .string()
    .trim()
    .toLowerCase()
    .optional(),

  mpgMin: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  mpgMax: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  cylindersMin: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  cylindersMax: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  displacementMin: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  displacementMax: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  horsepowerMin: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  horsepowerMax: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  weightMin: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  weightMax: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  accelerationMin: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  accelerationMax: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  modelYearMin: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),
  modelYearMax: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().finite().optional()
  ),

  sortBy: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.toLowerCase() : v)),
  sortDir: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.toLowerCase() : v)),

  page: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : Number(v)),
    z.number().int().min(1).optional().default(1)
  ),
  pageSize: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : Number(v)),
    z.number().int().min(1).max(100).optional().default(20)
  )
});

function normalizeQuery(rawQuery) {
  const parsed = querySchema.safeParse(rawQuery);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join('.') || 'query'}: ${i.message}`)
      .slice(0, 5)
      .join('; ');
    throw new Error(`Invalid query params: ${msg}`);
  }

  const q = parsed.data;

  const origin = q.origin ? String(q.origin).toLowerCase() : undefined;
  const allowedOrigins = new Set(['usa', 'europe', 'japan']);
  const originNormalized = origin && allowedOrigins.has(origin) ? origin : undefined;

  const sortBy = q.sortBy && SORT_FIELDS.includes(q.sortBy) ? q.sortBy : 'model_year';
  const sortDir = q.sortDir === 'desc' ? 'desc' : 'asc';

  return {
    q: q.q ? q.q.toLowerCase() : undefined,
    origin: originNormalized,
    filters: {
      mpgMin: q.mpgMin,
      mpgMax: q.mpgMax,
      cylindersMin: q.cylindersMin,
      cylindersMax: q.cylindersMax,
      displacementMin: q.displacementMin,
      displacementMax: q.displacementMax,
      horsepowerMin: q.horsepowerMin,
      horsepowerMax: q.horsepowerMax,
      weightMin: q.weightMin,
      weightMax: q.weightMax,
      accelerationMin: q.accelerationMin,
      accelerationMax: q.accelerationMax,
      modelYearMin: q.modelYearMin,
      modelYearMax: q.modelYearMax
    },
    sortBy,
    sortDir,
    page: q.page,
    pageSize: q.pageSize
  };
}

function applyFilters(cars, query) {
  const { q, origin, filters } = query;
  return cars.filter((car) => {
    if (q) {
      const name = (car.name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (origin) {
      if ((car.origin || '').toLowerCase() !== origin) return false;
    }

    // Numeric filter helper: if the car field is null, it fails numeric range filters.
    function withinRange(fieldValue, min, max) {
      const hasMin = min !== undefined;
      const hasMax = max !== undefined;
      if (!hasMin && !hasMax) return true; // no numeric filtering requested
      if (fieldValue === null || fieldValue === undefined) return false;
      if (hasMin && fieldValue < min) return false;
      if (hasMax && fieldValue > max) return false;
      return true;
    }

    if (
      !withinRange(
        parseNullableNumber(car.mpg),
        filters.mpgMin,
        filters.mpgMax
      )
    )
      return false;
    if (
      !withinRange(
        parseNullableNumber(car.cylinders),
        filters.cylindersMin,
        filters.cylindersMax
      )
    )
      return false;
    if (
      !withinRange(
        parseNullableNumber(car.displacement),
        filters.displacementMin,
        filters.displacementMax
      )
    )
      return false;
    if (
      !withinRange(
        parseNullableNumber(car.horsepower),
        filters.horsepowerMin,
        filters.horsepowerMax
      )
    )
      return false;
    if (
      !withinRange(
        parseNullableNumber(car.weight),
        filters.weightMin,
        filters.weightMax
      )
    )
      return false;
    if (
      !withinRange(
        parseNullableNumber(car.acceleration),
        filters.accelerationMin,
        filters.accelerationMax
      )
    )
      return false;
    if (
      !withinRange(
        parseNullableNumber(car.model_year),
        filters.modelYearMin,
        filters.modelYearMax
      )
    )
      return false;

    return true;
  });
}

function sortCars(cars, sortBy, sortDir) {
  const dir = sortDir === 'desc' ? -1 : 1;
  const key = sortBy;

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  return [...cars].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    const aNull = aVal === null || aVal === undefined;
    const bNull = bVal === null || bVal === undefined;

    if (aNull && bNull) return 0;
    if (aNull) return 1; // nulls last
    if (bNull) return -1;

    // Numbers come from Firestore; still guard with typeof.
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir * (aVal - bVal);
    }

    // Strings: case-insensitive.
    return dir * collator.compare(String(aVal).toLowerCase(), String(bVal).toLowerCase());
  });
}

function paginateCars(cars, page, pageSize) {
  const total = cars.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: cars.slice(start, end),
    total,
    page,
    pageSize
  };
}

module.exports = {
  normalizeQuery,
  applyFilters,
  sortCars,
  paginateCars
};

