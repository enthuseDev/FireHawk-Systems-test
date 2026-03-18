import { environment } from '../../environments/environment';
import { Car, CarsListResponse, CarsQuery, NullableNumber, SortField, SortDirection } from '../models/cars';

function toParamValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  return s;
}

function appendNumberIfFinite(params: URLSearchParams, key: string, value: NullableNumber | undefined) {
  if (value === undefined || value === null) return;
  if (!Number.isFinite(value)) return;
  params.set(key, String(value));
}

export type CarsApiError = { message: string };

function buildCarsQueryParams(filters: CarsQuery): URLSearchParams {
  const params = new URLSearchParams();

  const q = toParamValue(filters.q);
  if (q) params.set('q', q);

  const origin = toParamValue(filters.origin);
  if (origin) params.set('origin', origin);

  appendNumberIfFinite(params, 'mpgMin', filters.mpgMin);
  appendNumberIfFinite(params, 'mpgMax', filters.mpgMax);
  appendNumberIfFinite(params, 'cylindersMin', filters.cylindersMin);
  appendNumberIfFinite(params, 'cylindersMax', filters.cylindersMax);
  appendNumberIfFinite(params, 'displacementMin', filters.displacementMin);
  appendNumberIfFinite(params, 'displacementMax', filters.displacementMax);
  appendNumberIfFinite(params, 'horsepowerMin', filters.horsepowerMin);
  appendNumberIfFinite(params, 'horsepowerMax', filters.horsepowerMax);
  appendNumberIfFinite(params, 'weightMin', filters.weightMin);
  appendNumberIfFinite(params, 'weightMax', filters.weightMax);
  appendNumberIfFinite(params, 'accelerationMin', filters.accelerationMin);
  appendNumberIfFinite(params, 'accelerationMax', filters.accelerationMax);
  appendNumberIfFinite(params, 'modelYearMin', filters.modelYearMin);
  appendNumberIfFinite(params, 'modelYearMax', filters.modelYearMax);

  const sortBy = (filters.sortBy || 'model_year') as SortField;
  if (sortBy) params.set('sortBy', sortBy);

  const sortDir = (filters.sortDir || 'asc') as SortDirection;
  if (sortDir) params.set('sortDir', sortDir);

  if (filters.page && Number.isFinite(filters.page)) params.set('page', String(filters.page));
  if (filters.pageSize && Number.isFinite(filters.pageSize))
    params.set('pageSize', String(filters.pageSize));

  return params;
}

export async function fetchCars(filters: CarsQuery): Promise<CarsListResponse> {
  const params = buildCarsQueryParams(filters);
  const url = `${environment.apiBaseUrl}/api/cars?${params.toString()}`;

  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Failed to load cars: ${resp.status} ${text}`.trim());
  }
  return (await resp.json()) as CarsListResponse;
}

export async function addCar(payload: Omit<Car, 'id'> & { horsepower: NullableNumber; mpg: NullableNumber }): Promise<Car> {
  const url = `${environment.apiBaseUrl}/api/cars`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    const message = data?.message || data?.error || `HTTP ${resp.status}`;
    throw new Error(message);
  }
  return (await resp.json()) as Car;
}

export function downloadCarsCsv(filters: CarsQuery) {
  const params = buildCarsQueryParams(filters);
  const url = `${environment.apiBaseUrl}/api/cars/export.csv?${params.toString()}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cars.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

