import { CarsQuery, NullableNumber } from '../models/cars';

const STORAGE_KEY = 'firehawkCarsFiltersV1';

function parseNullableNumber(value: unknown): NullableNumber | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function coerceOrigin(value: unknown): CarsQuery['origin'] {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === '') return undefined;
  if (s === 'usa' || s === 'europe' || s === 'japan') return s;
  return undefined;
}

export function loadSavedFilters(): CarsQuery | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CarsQuery;
    const next: CarsQuery = {
      q: parsed.q || undefined,
      origin: coerceOrigin(parsed.origin),
      mpgMin: parseNullableNumber(parsed.mpgMin),
      mpgMax: parseNullableNumber(parsed.mpgMax),
      cylindersMin: parseNullableNumber(parsed.cylindersMin),
      cylindersMax: parseNullableNumber(parsed.cylindersMax),
      displacementMin: parseNullableNumber(parsed.displacementMin),
      displacementMax: parseNullableNumber(parsed.displacementMax),
      horsepowerMin: parseNullableNumber(parsed.horsepowerMin),
      horsepowerMax: parseNullableNumber(parsed.horsepowerMax),
      weightMin: parseNullableNumber(parsed.weightMin),
      weightMax: parseNullableNumber(parsed.weightMax),
      accelerationMin: parseNullableNumber(parsed.accelerationMin),
      accelerationMax: parseNullableNumber(parsed.accelerationMax),
      modelYearMin: parseNullableNumber(parsed.modelYearMin),
      modelYearMax: parseNullableNumber(parsed.modelYearMax),
      sortBy: parsed.sortBy,
      sortDir: parsed.sortDir,
      page: parsed.page ? Number(parsed.page) : undefined,
      pageSize: parsed.pageSize ? Number(parsed.pageSize) : undefined
    };
    if (!next.sortBy) next.sortBy = 'model_year';
    if (!next.sortDir) next.sortDir = 'asc';
    if (!next.page) next.page = 1;
    if (!next.pageSize) next.pageSize = 20;
    return next;
  } catch {
    return undefined;
  }
}

export function saveFilters(filters: CarsQuery) {
  const payload: CarsQuery = { ...filters };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

