const { z } = require('zod');
const crypto = require('crypto');

const allowedOrigins = ['usa', 'europe', 'japan'];

function toNullableNumber(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === '') return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function toNumber(value) {
  const str = String(value).trim();
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

const carBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'name is required')
    .max(200),

  mpg: z.preprocess((v) => toNumber(v), z.number().finite()),

  cylinders: z.preprocess((v) => toNumber(v), z.number().int().finite()),

  displacement: z.preprocess((v) => toNumber(v), z.number().finite()),

  horsepower: z.preprocess((v) => toNullableNumber(v), z.number().finite().nullable()),

  weight: z.preprocess((v) => toNumber(v), z.number().finite()),

  acceleration: z.preprocess((v) => toNumber(v), z.number().finite()),

  model_year: z.preprocess((v) => toNumber(v), z.number().int().finite()),

  origin: z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v).trim().toLowerCase()),
    z.enum(allowedOrigins)
  )
});

function normalizeCar(car) {
  // Ensure null horsepower stays null (not NaN).
  return {
    name: car.name.trim(),
    mpg: car.mpg,
    cylinders: car.cylinders,
    displacement: car.displacement,
    horsepower: car.horsepower === null ? null : car.horsepower,
    weight: car.weight,
    acceleration: car.acceleration,
    model_year: car.model_year,
    origin: car.origin
  };
}

function getCarDocId(car) {
  const normalized = normalizeCar(car);
  const payload = JSON.stringify(normalized);
  return crypto.createHash('sha1').update(payload).digest('hex');
}

module.exports = {
  carBaseSchema,
  getCarDocId,
  normalizeCar
};

