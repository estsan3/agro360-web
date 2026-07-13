import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const placeholder = () =>
  import('./shared/ui/page-placeholder/page-placeholder').then((m) => m.PagePlaceholder);

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
      // Placeholders: se reemplazan por las rutas reales del feature en los pasos 10-12
      {
        path: 'gestion-operativa',
        loadComponent: placeholder,
        data: { title: 'Gestión operativa' },
      },
      { path: 'reportes', loadComponent: placeholder, data: { title: 'Reportería' } },
      { path: 'mensajeria', loadComponent: placeholder, data: { title: 'Mensajería' } },
      { path: 'configuracion', loadComponent: placeholder, data: { title: 'Configuración' } },
      { path: '', redirectTo: 'despachos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
