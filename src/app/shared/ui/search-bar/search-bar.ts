import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Barra de búsqueda del kit Agro360 (Figma: Componentes → Barra busqueda).
 */
@Component({
  selector: 'app-search-bar',
  imports: [Icon],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBar {
  readonly placeholder = input('Buscar...');
  readonly value = input('');

  readonly valueChange = output<string>();

  protected handleInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
