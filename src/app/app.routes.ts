import { Routes } from '@angular/router';
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
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion-page').then((m) => m.ConfiguracionPage),
      },
      { path: '', redirectTo: 'despachos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
