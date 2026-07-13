import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationStore } from '../../notifications/state/notification.store';
import { Icon } from '../../shared/ui/icon/icon';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { EstadoViajeChat, Mensaje } from './data-access/mensaje.model';
import { MensajeriaStore } from './data-access/mensajeria.store';

const ESTADO_CHAT_LABEL: Record<EstadoViajeChat, string> = {
  pendiente: 'Pendiente',
  'en-transito': 'En tránsito',
  detenido: 'Detenido',
  entregado: 'Entregado',
};

interface GrupoMensajes {
  etiqueta: string;
  mensajes: Mensaje[];
}

/**
 * Mensajería v2 (Figma): conversaciones atadas a un viaje — chofer,
 * ID de viaje, origen-destino, dominio y estado del viaje en vivo.
 */
@Component({
  selector: 'app-mensajeria-page',
  imports: [DatePipe, FormsModule, Icon, StateWrapper],
  templateUrl: './mensajeria-page.html',
  styleUrl: './mensajeria-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensajeriaPage {
  protected readonly store = inject(MensajeriaStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationStore);
  private contextoAplicado = false;

  protected readonly busqueda = signal('');
  protected borrador = '';

  private readonly mensajesPanel = viewChild<ElementRef<HTMLElement>>('mensajesPanel');

  protected readonly filtradas = computed(() => {
    const filtro = this.busqueda().toLowerCase();
    return (this.store.conversaciones().data ?? []).filter(
      (c) =>
        !filtro ||
        c.chofer.toLowerCase().includes(filtro) ||
        c.viajeId.toLowerCase().includes(filtro) ||
        c.destino.toLowerCase().includes(filtro),
    );
  });

  /** Mensajes de la conversación activa agrupados por día (HOY / dd/MM) */
  protected readonly grupos = computed<GrupoMensajes[]>(() => {
    const mensajes = this.store.seleccionada()?.mensajes ?? [];
    const hoy = new Date().toDateString();
    const grupos: GrupoMensajes[] = [];
    for (const mensaje of mensajes) {
      const clave = mensaje.fecha.toDateString();
      const etiqueta =
        clave === hoy
          ? 'HOY'
          : mensaje.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      const ultimo = grupos[grupos.length - 1];
      if (ultimo?.etiqueta === etiqueta) {
        ultimo.mensajes.push(mensaje);
      } else {
        grupos.push({ etiqueta, mensajes: [mensaje] });
      }
    }
    return grupos;
  });

  constructor() {
    this.store.cargarConversaciones();

    // Contexto desde Gestión operativa (?chofer=...&viaje=...): prioriza
    // la conversación de ese viaje; si no existe, la del chofer
    effect(() => {
      const conversaciones = this.store.conversaciones().data;
      if (this.contextoAplicado || !conversaciones) {
        return;
      }
      const params = this.route.snapshot.queryParamMap;
      const chofer = params.get('chofer');
      const viaje = params.get('viaje');
      if (!chofer && !viaje) {
        return;
      }
      this.contextoAplicado = true;
      const conversacion =
        conversaciones.find((c) => c.viajeId === viaje) ??
        conversaciones.find((c) => c.chofer === chofer);
      if (conversacion) {
        this.store.seleccionar(conversacion.id);
        if (viaje && conversacion.viajeId !== viaje) {
          this.borrador = `Sobre el viaje ${viaje}: `;
        }
      } else {
        this.notifications.warning(
          'Sin conversación',
          `${chofer} todavía no tiene chat iniciado desde la app`,
        );
      }
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    });

    // Auto-scroll al último mensaje
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

  protected estadoLabel(estado: EstadoViajeChat): string {
    return ESTADO_CHAT_LABEL[estado];
  }

  protected verUbicacion(): void {
    this.notifications.warning('Ver ubicación', 'Mapa del viaje disponible próximamente');
  }

  protected reportarProblema(): void {
    this.notifications.warning('Reportar problema', 'Disponible próximamente');
  }

  protected enviar(): void {
    if (!this.borrador.trim()) {
      return;
    }
    this.store.enviarMensaje(this.borrador);
    this.borrador = '';
  }
}
