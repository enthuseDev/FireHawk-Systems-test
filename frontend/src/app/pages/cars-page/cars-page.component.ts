import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { addCar, downloadCarsCsv, fetchCars } from '../../services/cars-api.service';
import { loadSavedFilters, saveFilters } from '../../services/filter-storage.service';
import { Car, CarOrigin, CarsListResponse, CarsQuery, NullableNumber, SortField, SortDirection } from '../../models/cars';

type FieldKeys =
  | 'mpgMin'
  | 'mpgMax'
  | 'cylindersMin'
  | 'cylindersMax'
  | 'displacementMin'
  | 'displacementMax'
  | 'horsepowerMin'
  | 'horsepowerMax'
  | 'weightMin'
  | 'weightMax'
  | 'accelerationMin'
  | 'accelerationMax'
  | 'modelYearMin'
  | 'modelYearMax';

const DEFAULTS: CarsQuery = {
  q: undefined,
  origin: undefined,
  mpgMin: undefined,
  mpgMax: undefined,
  cylindersMin: undefined,
  cylindersMax: undefined,
  displacementMin: undefined,
  displacementMax: undefined,
  horsepowerMin: undefined,
  horsepowerMax: undefined,
  weightMin: undefined,
  weightMax: undefined,
  accelerationMin: undefined,
  accelerationMax: undefined,
  modelYearMin: undefined,
  modelYearMax: undefined,
  sortBy: 'model_year',
  sortDir: 'asc',
  page: 1,
  pageSize: 20
};

function parseNullableNumber(value: unknown): NullableNumber | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseOrigin(value: unknown): CarsQuery['origin'] {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === '') return undefined;
  if (s === 'usa' || s === 'europe' || s === 'japan') return s as CarOrigin;
  return undefined;
}

function parseSortField(value: unknown): SortField | undefined {
  const s = String(value || '').trim().toLowerCase();
  if (
    s === 'name' ||
    s === 'mpg' ||
    s === 'cylinders' ||
    s === 'displacement' ||
    s === 'horsepower' ||
    s === 'weight' ||
    s === 'acceleration' ||
    s === 'model_year' ||
    s === 'origin'
  ) {
    return s as SortField;
  }
  return undefined;
}

function parseSortDir(value: unknown): SortDirection | undefined {
  const s = String(value || '').trim().toLowerCase();
  if (s === 'desc') return 'desc';
  if (s === 'asc') return 'asc';
  return undefined;
}

function buildQueryParamsFromFilters(filters: CarsQuery): Record<string, string> {
  const qp: Record<string, string> = {};
  if (filters.q) qp.q = filters.q;
  if (filters.origin) qp.origin = filters.origin;
  const setIf = (k: keyof CarsQuery) => {
    const v = filters[k] as unknown;
    const n = parseNullableNumber(v);
    if (n !== undefined && n !== null) qp[String(k)] = String(n);
  };
  setIf('mpgMin');
  setIf('mpgMax');
  setIf('cylindersMin');
  setIf('cylindersMax');
  setIf('displacementMin');
  setIf('displacementMax');
  setIf('horsepowerMin');
  setIf('horsepowerMax');
  setIf('weightMin');
  setIf('weightMax');
  setIf('accelerationMin');
  setIf('accelerationMax');
  setIf('modelYearMin');
  setIf('modelYearMax');

  if (filters.sortBy) qp.sortBy = String(filters.sortBy);
  if (filters.sortDir) qp.sortDir = String(filters.sortDir);
  if (filters.page) qp.page = String(filters.page);
  if (filters.pageSize) qp.pageSize = String(filters.pageSize);
  return qp;
}

@Component({
  selector: 'app-cars-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid gap-6 lg:grid-cols-[420px,1fr]">
      <section class="space-y-4">
        <div class="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 p-4">
          <h2 class="text-lg font-semibold">Filters</h2>

          <div class="mt-4">
            <label class="block text-sm text-slate-300">Search</label>
            <input
              type="text"
              class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
              placeholder="e.g. chevrolet"
              [(ngModel)]="filters.q"
              (ngModelChange)="onTextChange('q', $event)"
            />
          </div>

          <div class="mt-4">
            <label class="block text-sm text-slate-300">Origin</label>
            <select
              class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
              [(ngModel)]="filters.origin"
              (ngModelChange)="onOriginChange($event)"
            >
              <option [ngValue]="undefined">All origins</option>
              <option [ngValue]="'usa'">USA</option>
              <option [ngValue]="'europe'">Europe</option>
              <option [ngValue]="'japan'">Japan</option>
            </select>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400">MPG min</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.mpgMin ?? ''"
                (ngModelChange)="onNumberChange('mpgMin', $event)"
                placeholder="min"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400">MPG max</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.mpgMax ?? ''"
                (ngModelChange)="onNumberChange('mpgMax', $event)"
                placeholder="max"
              />
            </div>

            <div>
              <label class="block text-xs text-slate-400">Cylinders min</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.cylindersMin ?? ''"
                (ngModelChange)="onNumberChange('cylindersMin', $event)"
                placeholder="min"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400">Cylinders max</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.cylindersMax ?? ''"
                (ngModelChange)="onNumberChange('cylindersMax', $event)"
                placeholder="max"
              />
            </div>

            <div>
              <label class="block text-xs text-slate-400">Displacement min</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.displacementMin ?? ''"
                (ngModelChange)="onNumberChange('displacementMin', $event)"
                placeholder="min"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400">Displacement max</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.displacementMax ?? ''"
                (ngModelChange)="onNumberChange('displacementMax', $event)"
                placeholder="max"
              />
            </div>

            <div>
              <label class="block text-xs text-slate-400">Horsepower min</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.horsepowerMin ?? ''"
                (ngModelChange)="onNumberChange('horsepowerMin', $event)"
                placeholder="min"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400">Horsepower max</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.horsepowerMax ?? ''"
                (ngModelChange)="onNumberChange('horsepowerMax', $event)"
                placeholder="max"
              />
            </div>

            <div>
              <label class="block text-xs text-slate-400">Weight min</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.weightMin ?? ''"
                (ngModelChange)="onNumberChange('weightMin', $event)"
                placeholder="min"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400">Weight max</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.weightMax ?? ''"
                (ngModelChange)="onNumberChange('weightMax', $event)"
                placeholder="max"
              />
            </div>

            <div>
              <label class="block text-xs text-slate-400">Acceleration min</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.accelerationMin ?? ''"
                (ngModelChange)="onNumberChange('accelerationMin', $event)"
                placeholder="min"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400">Acceleration max</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.accelerationMax ?? ''"
                (ngModelChange)="onNumberChange('accelerationMax', $event)"
                placeholder="max"
              />
            </div>

            <div>
              <label class="block text-xs text-slate-400">Model year min</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.modelYearMin ?? ''"
                (ngModelChange)="onNumberChange('modelYearMin', $event)"
                placeholder="min"
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400">Model year max</label>
              <input
                type="number"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [ngModel]="filters.modelYearMax ?? ''"
                (ngModelChange)="onNumberChange('modelYearMax', $event)"
                placeholder="max"
              />
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/70"
              (click)="applyNow()"
              [disabled]="loading"
            >
              {{ loading ? 'Loading...' : 'Apply' }}
            </button>

            <button
              type="button"
              class="rounded-lg bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300/70"
              (click)="resetFilters()"
              [disabled]="loading"
            >
              Reset
            </button>

            <button
              type="button"
              class="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-300/20 hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-200/40"
              (click)="downloadCsv()"
              [disabled]="loading || total === 0"
            >
              Download CSV
            </button>
          </div>

          <div *ngIf="error" class="mt-4 rounded-lg bg-rose-500/10 ring-1 ring-rose-300/20 p-3 text-sm text-rose-200">
            {{ error }}
          </div>
        </div>

        <div class="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 p-4">
          <h2 class="text-lg font-semibold">Add Car</h2>
          <form class="mt-4 grid gap-3" (ngSubmit)="submitNewCar()">
            <div>
              <label class="block text-sm text-slate-300">Name</label>
              <input
                type="text"
                class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [(ngModel)]="newCar.name"
                name="name"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-400">MPG</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [ngModel]="newCar.mpg ?? ''"
                  (ngModelChange)="onNewCarNumber('mpg', $event)"
                  name="mpg"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-400">Cylinders</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [ngModel]="newCar.cylinders ?? ''"
                  (ngModelChange)="onNewCarNumber('cylinders', $event)"
                  name="cylinders"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-400">Displacement</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [ngModel]="newCar.displacement ?? ''"
                  (ngModelChange)="onNewCarNumber('displacement', $event)"
                  name="displacement"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-400">Horsepower</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [ngModel]="newCar.horsepower ?? ''"
                  (ngModelChange)="onNewCarNumber('horsepower', $event)"
                  name="horsepower"
                  placeholder="(optional)"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-400">Weight</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [ngModel]="newCar.weight ?? ''"
                  (ngModelChange)="onNewCarNumber('weight', $event)"
                  name="weight"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-400">Acceleration</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [ngModel]="newCar.acceleration ?? ''"
                  (ngModelChange)="onNewCarNumber('acceleration', $event)"
                  name="acceleration"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-400">Model year</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [ngModel]="newCar.model_year ?? ''"
                  (ngModelChange)="onNewCarNumber('model_year', $event)"
                  name="model_year"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-400">Origin</label>
                <select
                  class="mt-1 w-full rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                  [(ngModel)]="newCar.origin"
                  name="origin"
                >
                  <option [ngValue]="'usa'">USA</option>
                  <option [ngValue]="'europe'">Europe</option>
                  <option [ngValue]="'japan'">Japan</option>
                </select>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="submit"
                class="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/70"
                [disabled]="loading"
              >
                Add
              </button>

              <button
                type="button"
                class="rounded-lg bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300/70"
                (click)="resetNewCar()"
                [disabled]="loading"
              >
                Clear
              </button>
            </div>

            <div *ngIf="addError" class="rounded-lg bg-rose-500/10 ring-1 ring-rose-300/20 p-3 text-sm text-rose-200">
              {{ addError }}
            </div>

            <div *ngIf="addSuccess" class="rounded-lg bg-emerald-500/10 ring-1 ring-emerald-300/20 p-3 text-sm text-emerald-200">
              {{ addSuccess }}
            </div>
          </form>
        </div>
      </section>

      <section class="space-y-4">
        <div class="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Cars</h2>
              <div class="mt-1 text-sm text-slate-300">
                {{ total === 0 ? 'No results' : 'Showing ' + cars.length + ' of ' + total + ' cars' }}
              </div>
            </div>

            <div class="flex flex-wrap gap-2 items-center">
              <div class="text-sm text-slate-300">Rows:</div>
              <select
                class="rounded-lg bg-slate-950/40 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/60"
                [(ngModel)]="filters.pageSize"
                name="pageSize"
                (ngModelChange)="onPageSizeChange($event)"
              >
                <option [ngValue]="10">10</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="50">50</option>
              </select>
            </div>
          </div>

          <div class="mt-4 overflow-auto rounded-xl ring-1 ring-white/10">
            <table class="min-w-full bg-slate-950/30">
              <thead class="bg-slate-950/50 sticky top-0 z-10">
                <tr class="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('name')">
                      Name
                      <span class="ml-1" *ngIf="filters.sortBy === 'name'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('mpg')">
                      MPG
                      <span class="ml-1" *ngIf="filters.sortBy === 'mpg'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('cylinders')">
                      Cyl.
                      <span class="ml-1" *ngIf="filters.sortBy === 'cylinders'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('displacement')">
                      Displ.
                      <span class="ml-1" *ngIf="filters.sortBy === 'displacement'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('horsepower')">
                      HP
                      <span class="ml-1" *ngIf="filters.sortBy === 'horsepower'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('weight')">
                      Weight
                      <span class="ml-1" *ngIf="filters.sortBy === 'weight'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('acceleration')">
                      Accel.
                      <span class="ml-1" *ngIf="filters.sortBy === 'acceleration'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('model_year')">
                      Year
                      <span class="ml-1" *ngIf="filters.sortBy === 'model_year'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                  <th class="px-3 py-3 whitespace-nowrap">
                    <button type="button" class="hover:text-slate-200" (click)="setSort('origin')">
                      Origin
                      <span class="ml-1" *ngIf="filters.sortBy === 'origin'">{{ filters.sortDir === 'asc' ? '↑' : '↓' }}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="loading">
                  <td colspan="9" class="px-3 py-8 text-center text-slate-300">Loading...</td>
                </tr>
                <tr *ngIf="!loading && cars.length === 0">
                  <td colspan="9" class="px-3 py-8 text-center text-slate-300">No cars match your filters.</td>
                </tr>
                <tr
                  *ngFor="let car of cars"
                  class="border-t border-white/5 hover:bg-white/5"
                >
                  <td class="px-3 py-3 whitespace-nowrap">
                    <div class="font-medium text-slate-100">{{ car.name }}</div>
                  </td>
                  <td class="px-3 py-3 whitespace-nowrap text-slate-200">{{ car.mpg ?? '—' }}</td>
                  <td class="px-3 py-3 whitespace-nowrap text-slate-200">{{ car.cylinders ?? '—' }}</td>
                  <td class="px-3 py-3 whitespace-nowrap text-slate-200">{{ car.displacement ?? '—' }}</td>
                  <td class="px-3 py-3 whitespace-nowrap text-slate-200">{{ car.horsepower ?? '—' }}</td>
                  <td class="px-3 py-3 whitespace-nowrap text-slate-200">{{ car.weight ?? '—' }}</td>
                  <td class="px-3 py-3 whitespace-nowrap text-slate-200">{{ car.acceleration ?? '—' }}</td>
                  <td class="px-3 py-3 whitespace-nowrap text-slate-200">{{ car.model_year ?? '—' }}</td>
                  <td class="px-3 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-1 text-xs text-indigo-200 ring-1 ring-indigo-300/15">
                      {{ car.origin ?? '' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm text-slate-300">
              Page {{ filters.page }} of {{ totalPages }}
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                (click)="prevPage()"
                [disabled]="loading || (filters.page || 1) <= 1"
              >
                Prev
              </button>
              <button
                type="button"
                class="rounded-lg bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                (click)="nextPage()"
                [disabled]="loading || (filters.page || 1) >= totalPages"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class CarsPageComponent {
  filters: CarsQuery = { ...DEFAULTS };
  cars: Car[] = [];
  loading = false;
  error: string | null = null;
  total = 0;
  totalPages = 1;

  addError: string | null = null;
  addSuccess: string | null = null;

  newCar: Omit<Car, 'id'> = {
    name: '',
    mpg: null,
    cylinders: null,
    displacement: null,
    horsepower: null,
    weight: null,
    acceleration: null,
    model_year: null,
    origin: 'usa'
  };

  private applySubject = new Subject<void>();

  constructor(private readonly route: ActivatedRoute, private readonly router: Router) {
    const saved = loadSavedFilters();
    this.filters = saved ? { ...DEFAULTS, ...saved } : { ...DEFAULTS };

    const qp = this.route.snapshot.queryParams;
    this.filters = { ...this.filters, ...this.coerceQueryParams(qp) };
    this.filters.page = this.filters.page || 1;
    this.filters.pageSize = this.filters.pageSize || 20;

    this.applySubject.pipe(debounceTime(250)).subscribe(() => {
      this.loadCars();
    });
  }

  private coerceQueryParams(qp: Record<string, string>): CarsQuery {
    const next: CarsQuery = {};
    if (qp.q !== undefined && qp.q.trim() !== '') next.q = qp.q.trim();
    next.origin = parseOrigin(qp.origin);
    next.mpgMin = parseNullableNumber(qp.mpgMin);
    next.mpgMax = parseNullableNumber(qp.mpgMax);
    next.cylindersMin = parseNullableNumber(qp.cylindersMin);
    next.cylindersMax = parseNullableNumber(qp.cylindersMax);
    next.displacementMin = parseNullableNumber(qp.displacementMin);
    next.displacementMax = parseNullableNumber(qp.displacementMax);
    next.horsepowerMin = parseNullableNumber(qp.horsepowerMin);
    next.horsepowerMax = parseNullableNumber(qp.horsepowerMax);
    next.weightMin = parseNullableNumber(qp.weightMin);
    next.weightMax = parseNullableNumber(qp.weightMax);
    next.accelerationMin = parseNullableNumber(qp.accelerationMin);
    next.accelerationMax = parseNullableNumber(qp.accelerationMax);
    next.modelYearMin = parseNullableNumber(qp.modelYearMin);
    next.modelYearMax = parseNullableNumber(qp.modelYearMax);
    next.sortBy = parseSortField(qp.sortBy) || next.sortBy;
    next.sortDir = parseSortDir(qp.sortDir) || next.sortDir;
    next.page = parseNullableNumber(qp.page);
    next.pageSize = parseNullableNumber(qp.pageSize);
    if (!next.page) next.page = undefined;
    if (!next.pageSize) next.pageSize = undefined;
    return next;
  }

  ngOnInit() {
    this.updateSavedAndUrl();
    this.loadCars();
  }

  private updateSavedAndUrl() {
    saveFilters(this.filters);
    const params = buildQueryParamsFromFilters(this.filters);
    this.router.navigate([], { queryParams: params, replaceUrl: true });
  }

  private triggerApply() {
    this.applySubject.next();
  }

  onTextChange(key: 'q', value: string) {
    this.filters.page = 1;
    this.filters.q = value.trim() === '' ? undefined : value.trim();
    this.updateSavedAndUrl();
    this.triggerApply();
  }

  onOriginChange(value: unknown) {
    this.filters.page = 1;
    this.filters.origin = parseOrigin(value) as any;
    this.updateSavedAndUrl();
    this.triggerApply();
  }

  onNumberChange(key: FieldKeys, value: unknown) {
    this.filters.page = 1;
    const n = parseNullableNumber(value);
    (this.filters as any)[key] = n === undefined ? undefined : n;
    this.updateSavedAndUrl();
    this.triggerApply();
  }

  applyNow() {
    this.filters.page = 1;
    this.updateSavedAndUrl();
    this.loadCars();
  }

  resetFilters() {
    this.filters = { ...DEFAULTS, sortBy: this.filters.sortBy, sortDir: this.filters.sortDir, page: 1, pageSize: this.filters.pageSize };
    this.error = null;
    this.addError = null;
    this.updateSavedAndUrl();
    this.loadCars();
  }

  setSort(field: SortField) {
    if (this.filters.sortBy === field) {
      this.filters.sortDir = this.filters.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sortBy = field;
      this.filters.sortDir = 'asc';
    }
    this.filters.page = 1;
    this.updateSavedAndUrl();
    this.loadCars();
  }

  onPageSizeChange(value: unknown) {
    const n = parseNullableNumber(value);
    if (!n) return;
    this.filters.pageSize = n;
    this.filters.page = 1;
    this.updateSavedAndUrl();
    this.loadCars();
  }

  prevPage() {
    const p = (this.filters.page || 1) - 1;
    if (p < 1) return;
    this.filters.page = p;
    this.updateSavedAndUrl();
    this.loadCars();
  }

  nextPage() {
    const p = (this.filters.page || 1) + 1;
    if (p > this.totalPages) return;
    this.filters.page = p;
    this.updateSavedAndUrl();
    this.loadCars();
  }

  downloadCsv() {
    saveFilters(this.filters);
    downloadCarsCsv(this.filters);
  }

  resetNewCar() {
    this.addError = null;
    this.addSuccess = null;
    this.newCar = {
      name: '',
      mpg: null,
      cylinders: null,
      displacement: null,
      horsepower: null,
      weight: null,
      acceleration: null,
      model_year: null,
      origin: 'usa'
    };
  }

  onNewCarNumber<K extends keyof Omit<Car, 'id'>>(
    key: K,
    value: unknown
  ) {
    const n = parseNullableNumber(value);
    (this.newCar as any)[key] = n === undefined ? null : n;
  }

  async submitNewCar() {
    this.addError = null;
    this.addSuccess = null;
    const payload = {
      name: this.newCar.name.trim(),
      mpg: this.newCar.mpg,
      cylinders: this.newCar.cylinders,
      displacement: this.newCar.displacement,
      horsepower: this.newCar.horsepower,
      weight: this.newCar.weight,
      acceleration: this.newCar.acceleration,
      model_year: this.newCar.model_year,
      origin: this.newCar.origin
    };

    this.loading = true;
    try {
      await addCar(payload as any);
      this.addSuccess = 'Car added successfully.';
      this.resetNewCar();
      await this.loadCars();
    } catch (e: any) {
      this.addError = e?.message || 'Failed to add car.';
    } finally {
      this.loading = false;
    }
  }

  private async loadCars() {
    this.loading = true;
    this.error = null;
    try {
      const result: CarsListResponse = await fetchCars(this.filters);
      this.cars = result.items || [];
      this.total = Number(result.total || 0);
      const pageSize = Number(result.pageSize || this.filters.pageSize || 20);
      const page = Number(result.page || this.filters.page || 1);
      this.filters.page = page;
      this.filters.pageSize = pageSize;
      this.totalPages = Math.max(1, Math.ceil(this.total / pageSize));
    } catch (e: any) {
      this.error = e?.message || 'Failed to load cars.';
      this.cars = [];
      this.total = 0;
      this.totalPages = 1;
    } finally {
      this.loading = false;
    }
  }
}

