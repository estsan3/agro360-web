import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConversacionDto, MensajeDto } from './mensaje.dto';
import { toConversacion, toMensaje } from './mensaje.mapper';
import { Conversacion, Mensaje } from './mensaje.model';

/**
 * Transporte de mensajería. Hoy REST contra el mock; cuando exista el
 * backend Python, la entrada en tiempo real (mensajes del chofer desde
 * la app móvil) se suma acá vía WebSocket/SSE sin tocar el store ni la UI.
 */
@Injectable({ providedIn: 'root' })
export class MensajeriaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/conversaciones`;

  getConversaciones(): Observable<Conversacion[]> {
    return this.http
      .get<ConversacionDto[]>(this.base)
      .pipe(map((dtos) => dtos.map(toConversacion)));
  }

  enviarMensaje(conversacionId: string, texto: string): Observable<Mensaje> {
    return this.http
      .post<MensajeDto>(`${this.base}/${conversacionId}/mensajes`, { texto })
      .pipe(map(toMensaje));
  }
}
