import { Routes } from '@angular/router';

export const DESPACHOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./crear-despacho/crear-despacho-page').then((m) => m.CrearDespachoPage),
  },
];

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reportes-despachos/reportes-page').then((m) => m.ReportesPage),
  },
];

export const BORRADORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./borrador-despachos/borrador-despachos-page').then((m) => m.BorradorDespachosPage),
  },
];
