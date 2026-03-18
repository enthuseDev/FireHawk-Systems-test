export type CarOrigin = 'usa' | 'europe' | 'japan';

export type NullableNumber = number | null;

export type SortDirection = 'asc' | 'desc';

export type SortField =
  | 'name'
  | 'mpg'
  | 'cylinders'
  | 'displacement'
  | 'horsepower'
  | 'weight'
  | 'acceleration'
  | 'model_year'
  | 'origin';

export type Car = {
  id?: string;
  name: string;
  mpg: NullableNumber;
  cylinders: NullableNumber;
  displacement: NullableNumber;
  horsepower: NullableNumber;
  weight: NullableNumber;
  acceleration: NullableNumber;
  model_year: NullableNumber;
  origin: NullableNumber | CarOrigin | string;
};

export type CarsQuery = {
  q?: string;
  origin?: CarOrigin | '';
  mpgMin?: NullableNumber;
  mpgMax?: NullableNumber;
  cylindersMin?: NullableNumber;
  cylindersMax?: NullableNumber;
  displacementMin?: NullableNumber;
  displacementMax?: NullableNumber;
  horsepowerMin?: NullableNumber;
  horsepowerMax?: NullableNumber;
  weightMin?: NullableNumber;
  weightMax?: NullableNumber;
  accelerationMin?: NullableNumber;
  accelerationMax?: NullableNumber;
  modelYearMin?: NullableNumber;
  modelYearMax?: NullableNumber;
  sortBy?: SortField;
  sortDir?: SortDirection;
  page?: number;
  pageSize?: number;
};

export type CarsListResponse = {
  items: Car[];
  total: number;
  page: number;
  pageSize: number;
};

