import { Routes } from '@angular/router';

export const DESPACHOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./crear-despacho/crear-despacho-page').then((m) => m.CrearDespachoPage),
  },
];

export const BORRADORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./borrador-despachos/borrador-despachos-page').then((m) => m.BorradorDespachosPage),
  },
];
