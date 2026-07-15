import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CatalogosDto,
  CrearViajeDto,
  DespachoDto,
  ActualizarMetadatosDespachoDto,
  DuplicarDespachoDto,
} from './despacho.dto';
import { toCatalogos, toCrearDespachoDto, toDespacho } from './despacho.mapper';
import {
  ActualizarMetadatosDespachoInput,
  AgregarViajeInput,
  Catalogos,
  Despacho,
  NuevoDespacho,
} from './despacho.model';

@Injectable({ providedIn: 'root' })
export class DespachoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/despachos`;

  getDespachos(): Observable<Despacho[]> {
    return this.http.get<DespachoDto[]>(this.base).pipe(map((dtos) => dtos.map(toDespacho)));
  }

  crearDespacho(input: NuevoDespacho): Observable<Despacho> {
    return this.http.post<DespachoDto>(this.base, toCrearDespachoDto(input)).pipe(map(toDespacho));
  }

  actualizarDespacho(id: string, input: NuevoDespacho): Observable<Despacho> {
    return this.http
      .put<DespachoDto>(`${this.base}/${id}`, toCrearDespachoDto(input))
      .pipe(map(toDespacho));
  }

  eliminarDespacho(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  iniciarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/iniciar`,
        {},
      )
      .pipe(map(toDespacho));
  }

  duplicarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(
        `${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}/duplicar`,
        {},
      )
      .pipe(map(toDespacho));
  }

  eliminarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.http
      .delete<DespachoDto>(`${this.base}/${despachoId}/viajes/${encodeURIComponent(viajeId)}`)
      .pipe(map(toDespacho));
  }

  agregarViaje(despachoId: string, input: AgregarViajeInput): Observable<Despacho> {
    const body: CrearViajeDto = {
      chofer_id: input.choferId || null,
      dominio: input.dominio || null,
      destino: input.destino,
      toneladas: input.toneladas,
      observaciones: input.observaciones ?? '',
    };
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/viajes`, body)
      .pipe(map(toDespacho));
  }

  cerrarDespacho(despachoId: string): Observable<Despacho> {
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/cerrar`, {})
      .pipe(map(toDespacho));
  }

  actualizarMetadatos(
    despachoId: string,
    input: ActualizarMetadatosDespachoInput,
  ): Observable<Despacho> {
    const body: ActualizarMetadatosDespachoDto = {
      fecha_llegada_estimada: input.fechaLlegadaEstimada,
      observaciones: input.observaciones ?? '',
    };
    return this.http
      .patch<DespachoDto>(`${this.base}/${despachoId}/metadatos`, body)
      .pipe(map(toDespacho));
  }

  duplicarDespacho(despachoId: string, nombre?: string): Observable<Despacho> {
    const body: DuplicarDespachoDto | Record<string, never> = nombre ? { nombre } : {};
    return this.http
      .post<DespachoDto>(`${this.base}/${despachoId}/duplicar`, body)
      .pipe(map(toDespacho));
  }

  getCatalogos(): Observable<Catalogos> {
    return this.http
      .get<CatalogosDto>(`${environment.apiBaseUrl}/catalogos`)
      .pipe(map(toCatalogos));
  }
}
