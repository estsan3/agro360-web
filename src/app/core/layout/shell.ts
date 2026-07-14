import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Sidebar, SidebarItem } from '../../shared/ui/sidebar/sidebar';
import { Topbar } from './topbar';

const TITULOS: Record<string, string> = {
  despachos: 'Crear Despacho',
  borradores: 'Borradores de Despacho',
  'gestion-operativa': 'Gestión Operativa',
  reportes: 'Reportería',
  mensajeria: 'Mensajería',
  configuracion: 'Configuración',
};

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

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

  protected readonly activeId = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.currentSection()),
    ),
    { initialValue: this.currentSection() },
  );

  protected readonly titulo = computed(() => TITULOS[this.activeId() ?? ''] ?? 'Agro360');

  protected readonly fecha = (() => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${DIAS[hoy.getDay()]}, ${dia} de ${MESES[hoy.getMonth()]} del ${hoy.getFullYear()}`;
  })();

  protected navigate(id: string): void {
    this.router.navigate(['/', id]);
  }

  private currentSection(): string {
    return this.router.url.split('/')[1]?.split('?')[0] ?? '';
  }
}
