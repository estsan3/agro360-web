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
        path: 'gestion-operativa/viajes/:despachoId/:viajeId',
        loadComponent: () =>
          import('./features/gestion-operativa/viaje-detalle-page').then((m) => m.ViajeDetallePage),
      },
      {
        path: 'gestion-operativa',
        pathMatch: 'full',
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
        path: 'lista-espera',
        loadComponent: () =>
          import('./features/lista-espera/lista-espera-page').then((m) => m.ListaEsperaPage),
      },
      {
        path: 'cartas-porte',
        loadComponent: () =>
          import('./features/cartas-porte/cartas-porte-page').then((m) => m.CartasPortePage),
      },
      {
        path: 'transportistas',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/transportistas/transportistas-page').then((m) => m.TransportistasPage),
      },
      {
        path: 'liquidaciones',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/liquidaciones/liquidaciones-page').then((m) => m.LiquidacionesPage),
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
