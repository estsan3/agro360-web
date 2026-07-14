import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Sidebar, SidebarItem } from '../../shared/ui/sidebar/sidebar';
import { Topbar } from './topbar';

const NAV_ITEMS: SidebarItem[] = [
  { id: 'gestion-operativa', icon: 'truck', label: 'Gestión operativa' },
  { id: 'despachos', icon: 'plus', label: 'Crear despacho' },
  { id: 'reportes', icon: 'dollar', label: 'Reportería' },
  { id: 'mensajeria', icon: 'message', label: 'Mensajería' },
  { id: 'borradores', icon: 'list', label: 'Borradores' },
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

  protected readonly items = NAV_ITEMS;
  protected readonly menuExpandido = signal(false);

  protected readonly activeId = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.currentSection()),
    ),
    { initialValue: this.currentSection() },
  );

  protected navigate(id: string): void {
    this.router.navigate(['/', id]);
  }

  private currentSection(): string {
    return this.router.url.split('/')[1]?.split('?')[0] ?? '';
  }
}
