import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon, IconName } from '../icon/icon';
import { Logo } from '../logo/logo';

export interface SidebarItem {
  id: string;
  icon: IconName;
  label: string;
  section?: 'top' | 'bottom';
}

/**
 * Sidebar de navegación del kit Agro360 (Figma: UI Kit Gestión → Bars).
 * 80px de ancho, fondo verde suave, item activo en verde de marca.
 * Presentacional: el shell decide las rutas; acá solo se emite el id.
 */
@Component({
  selector: 'app-sidebar',
  imports: [Icon, Logo],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly items = input.required<SidebarItem[]>();
  readonly activeId = input('');

  readonly itemSelected = output<string>();

  protected itemsIn(section: 'top' | 'bottom'): SidebarItem[] {
    return this.items().filter((item) => (item.section ?? 'top') === section);
  }
}
