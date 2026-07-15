import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: 'despachos',
        loadChildren: () =>
          import('./features/despachos/despachos.routes').then((m) => m.DESPACHOS_ROUTES),
      },
      {
        path: 'borradores',
        loadChildren: () =>
          import('./features/despachos/despachos.routes').then((m) => m.BORRADORES_ROUTES),
      },
      {
        path: 'gestion-operativa',
        loadComponent: () =>
          import('./features/gestion-operativa/gestion-operativa-page').then(
            (m) => m.GestionOperativaPage,
          ),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./features/despachos/despachos.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'mensajeria',
        loadComponent: () =>
          import('./features/mensajeria/mensajeria-page').then((m) => m.MensajeriaPage),
      },
      {
        path: 'transportistas',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/transportistas/transportistas-page').then((m) => m.TransportistasPage),
      },
      {
        path: 'productores',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/productores/productores-page').then((m) => m.ProductoresPage),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion-page').then((m) => m.ConfiguracionPage),
      },
      { path: '', redirectTo: 'gestion-operativa', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
