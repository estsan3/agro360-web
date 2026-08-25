import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CartaPorteDto } from '../../despachos/data-access/despacho.dto';
import { CartaPorte } from './cartas-porte.model';

function toModel(dto: CartaPorteDto): CartaPorte {
  return {
    id: dto.id,
    despachoId: dto.despacho_id,
    viajeId: dto.viaje_id,
    tipoCpe: dto.tipo_cpe,
    nroCartaPorte: dto.nro_carta_porte,
    nroCtg: dto.nro_ctg,
    estado: dto.estado,
    material: dto.material,
    origen: dto.origen,
    destino: dto.destino,
    dominio: dto.dominio,
    toneladas: dto.toneladas,
    payloadAfip: dto.payload_afip ?? {},
    intentos: dto.intentos ?? 0,
    errorDetalle: dto.error_detalle ?? '',
    tieneDocumento: dto.tiene_documento ?? false,
    creadaEn: dto.creada_en,
    actualizadaEn: dto.actualizada_en ?? null,
  };
}

@Injectable({ providedIn: 'root' })
export class CartasPorteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/cartas-porte`;

  listar(): Observable<CartaPorte[]> {
    return this.http.get<CartaPorteDto[]>(this.base).pipe(map((items) => items.map(toModel)));
  }

  obtener(id: string): Observable<CartaPorte> {
    return this.http
      .get<CartaPorteDto>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map(toModel));
  }

  reintentar(id: string): Observable<CartaPorte> {
    return this.http
      .post<CartaPorteDto>(`${this.base}/${encodeURIComponent(id)}/reintentar`, {})
      .pipe(map(toModel));
  }

  enviar(id: string): Observable<CartaPorte> {
    return this.http
      .post<CartaPorteDto>(`${this.base}/${encodeURIComponent(id)}/enviar`, {})
      .pipe(map(toModel));
  }

  anular(id: string): Observable<CartaPorte> {
    return this.http
      .post<CartaPorteDto>(`${this.base}/${encodeURIComponent(id)}/anular`, {})
      .pipe(map(toModel));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }

  /** PDF de una CPE procesada (blob listo para ver/descargar). */
  documento(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${encodeURIComponent(id)}/documento`, {
      responseType: 'blob',
    });
  }
}
