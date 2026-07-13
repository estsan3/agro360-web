import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/ui/icon/icon';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { MensajeriaStore } from './data-access/mensajeria.store';

/**
 * Mensajería con choferes (Figma: Mensajeria 720:852 + Chat elements).
 * Canal de comunicación con la app móvil del chofer.
 */
@Component({
  selector: 'app-mensajeria-page',
  imports: [DatePipe, FormsModule, Icon, SearchBar, StateWrapper],
  templateUrl: './mensajeria-page.html',
  styleUrl: './mensajeria-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensajeriaPage {
  protected readonly store = inject(MensajeriaStore);

  protected readonly busqueda = signal('');
  protected borrador = '';

  private readonly mensajesPanel = viewChild<ElementRef<HTMLElement>>('mensajesPanel');

  protected filtradas() {
    const filtro = this.busqueda().toLowerCase();
    return (this.store.conversaciones().data ?? []).filter(
      (c) => !filtro || c.chofer.toLowerCase().includes(filtro),
    );
  }

  constructor() {
    this.store.cargarConversaciones();

    // Auto-scroll al último mensaje cuando cambia la conversación activa
    effect(() => {
      const totalMensajes = this.store.seleccionada()?.mensajes.length ?? 0;
      if (totalMensajes === 0) {
        return;
      }
      queueMicrotask(() => {
        const panel = this.mensajesPanel()?.nativeElement;
        if (panel) {
          panel.scrollTop = panel.scrollHeight;
        }
      });
    });
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map((parte) => parte[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  protected enviar(): void {
    if (!this.borrador.trim()) {
      return;
    }
    this.store.enviarMensaje(this.borrador);
    this.borrador = '';
  }
}
