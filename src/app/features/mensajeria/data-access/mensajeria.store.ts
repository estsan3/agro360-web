import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AsyncState,
  asyncError,
  asyncIdle,
  asyncLoading,
  asyncSuccess,
} from '../../../core/models/async-state';
import { NotificationStore } from '../../../notifications/state/notification.store';
import { Conversacion, Mensaje } from './mensaje.model';
import { MensajeriaService } from './mensajeria.service';

/**
 * Estado de mensajería con el chofer (app móvil).
 * TODO(backend): al conectar WebSocket, los mensajes entrantes reales
 * reemplazan la respuesta simulada de simularRespuestaChofer().
 */
@Injectable({ providedIn: 'root' })
export class MensajeriaStore {
  private readonly api = inject(MensajeriaService);
  private readonly notifications = inject(NotificationStore);

  private readonly _conversaciones = signal<AsyncState<Conversacion[]>>(asyncIdle());
  private readonly _seleccionadaId = signal<string>('');

  readonly conversaciones = this._conversaciones.asReadonly();
  readonly seleccionadaId = this._seleccionadaId.asReadonly();

  readonly seleccionada = computed(
    () => (this._conversaciones().data ?? []).find((c) => c.id === this._seleccionadaId()) ?? null,
  );

  readonly totalNoLeidos = computed(() =>
    (this._conversaciones().data ?? []).reduce((sum, c) => sum + c.noLeidos, 0),
  );

  cargarConversaciones(): void {
    if (this._conversaciones().status === 'loading') {
      return;
    }
    this._conversaciones.set(asyncLoading());
    this.api.getConversaciones().subscribe({
      next: (conversaciones) => {
        this._conversaciones.set(asyncSuccess(conversaciones));
        if (!this._seleccionadaId() && conversaciones.length > 0) {
          this.seleccionar(conversaciones[0].id);
        }
      },
      error: (error: Error) => this._conversaciones.set(asyncError(error.message)),
    });
  }

  seleccionar(id: string): void {
    this._seleccionadaId.set(id);
    // Al abrir la conversación se marca como leída
    this.actualizarConversacion(id, (c) => ({ ...c, noLeidos: 0 }));
  }

  enviarMensaje(texto: string): void {
    const conversacion = this.seleccionada();
    if (!conversacion || !texto.trim()) {
      return;
    }
    this.api.enviarMensaje(conversacion.id, texto.trim()).subscribe({
      next: (mensaje) => {
        this.agregarMensaje(conversacion.id, mensaje);
        this.simularRespuestaChofer(conversacion.id, conversacion.chofer);
      },
    });
  }

  /** Demo sin backend: el chofer "responde" a los 2,5s y notifica */
  private simularRespuestaChofer(conversacionId: string, chofer: string): void {
    setTimeout(() => {
      const respuesta: Mensaje = {
        id: `m-${Date.now()}`,
        autor: 'chofer',
        texto: 'Recibido, gracias 👍',
        fecha: new Date(),
      };
      this.agregarMensaje(conversacionId, respuesta);
      if (this._seleccionadaId() !== conversacionId) {
        this.actualizarConversacion(conversacionId, (c) => ({ ...c, noLeidos: c.noLeidos + 1 }));
      }
      this.notifications.success(`Nuevo mensaje de ${chofer}`, respuesta.texto);
    }, 2500);
  }

  private agregarMensaje(conversacionId: string, mensaje: Mensaje): void {
    this.actualizarConversacion(conversacionId, (c) => ({
      ...c,
      mensajes: [...c.mensajes, mensaje],
    }));
  }

  private actualizarConversacion(
    id: string,
    fn: (conversacion: Conversacion) => Conversacion,
  ): void {
    const actual = this._conversaciones();
    if (actual.status !== 'success') {
      return;
    }
    this._conversaciones.set(
      asyncSuccess((actual.data ?? []).map((c) => (c.id === id ? fn(c) : c))),
    );
  }
}
