import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

export interface SidebarItem {
  id: string;
  icon: IconName;
  label: string;
  section?: 'top' | 'bottom';
}

/**
 * Sidebar de navegación del kit Agro360 (Figma: UI Kit Gestión → Bars).
 * Colapsada muestra solo iconos; expandida (controlado por el topbar
 * vía la hamburguesa) suma los títulos.
 */
@Component({
  selector: 'app-sidebar',
  imports: [Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly items = input.required<SidebarItem[]>();
  readonly activeId = input('');
  readonly expanded = input(false);

  readonly itemSelected = output<string>();

  protected itemsIn(section: 'top' | 'bottom'): SidebarItem[] {
    return this.items().filter((item) => (item.section ?? 'top') === section);
  }
}
