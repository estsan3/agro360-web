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
      // Placeholders: cada uno se reemplaza por las rutas reales del feature
      // (features/<dominio>/<dominio>.routes.ts) en los pasos 8-12
      { path: 'despachos', loadComponent: placeholder, data: { title: 'Despachos' } },
      {
        path: 'gestion-operativa',
        loadComponent: placeholder,
        data: { title: 'Gestión operativa' },
      },
      { path: 'reportes', loadComponent: placeholder, data: { title: 'Reportería' } },
      { path: 'mensajeria', loadComponent: placeholder, data: { title: 'Mensajería' } },
      { path: 'borradores', loadComponent: placeholder, data: { title: 'Borrador despachos' } },
      { path: 'configuracion', loadComponent: placeholder, data: { title: 'Configuración' } },
      { path: '', redirectTo: 'despachos', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
