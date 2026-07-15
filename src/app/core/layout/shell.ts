import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthStore } from '../state/auth.store';
import { Sidebar, SidebarItem } from '../../shared/ui/sidebar/sidebar';
import { Topbar } from './topbar';

const TITULOS: Record<string, string> = {
  despachos: 'Crear Despacho',
  borradores: 'Borradores de Despacho',
  'gestion-operativa': 'Gestión Operativa',
  reportes: 'Reportería',
  mensajeria: 'Mensajería',
  transportistas: 'Transportistas',
  configuracion: 'Configuración',
};

const NAV_ITEMS: SidebarItem[] = [
  { id: 'gestion-operativa', icon: 'truck', label: 'Gestión operativa' },
  { id: 'despachos', icon: 'plus', label: 'Crear despacho' },
  { id: 'reportes', icon: 'dollar', label: 'Reportería' },
  { id: 'mensajeria', icon: 'message', label: 'Mensajería' },
  { id: 'borradores', icon: 'list', label: 'Borradores' },
  { id: 'transportistas', icon: 'user', label: 'Transportistas', adminOnly: true },
  { id: 'configuracion', icon: 'settings', label: 'Configuración', section: 'bottom' },
];

/**
 * Layout principal autenticado: sidebar de navegación + contenido ruteado.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  protected readonly items = computed(() => {
    const esAdmin = this.authStore.user()?.rol === 'administrador';
    return NAV_ITEMS.filter((item) => !item.adminOnly || esAdmin);
  });

  protected readonly activeId = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.currentSection()),
    ),
    { initialValue: this.currentSection() },
  );

  protected readonly titulo = computed(() => TITULOS[this.activeId() ?? ''] ?? 'Agro360');

  protected navigate(id: string): void {
    this.router.navigate(['/', id]);
  }

  private currentSection(): string {
    return this.router.url.split('/')[1]?.split('?')[0] ?? '';
  }
}
