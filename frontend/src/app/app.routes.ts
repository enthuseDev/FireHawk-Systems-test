import { Routes } from '@angular/router';
import { CarsPageComponent } from './pages/cars-page/cars-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: CarsPageComponent },
  { path: 'cars', component: CarsPageComponent }
];
