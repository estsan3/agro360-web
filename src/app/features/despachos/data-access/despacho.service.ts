import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CatalogosDto, DespachoDto } from './despacho.dto';
import { toCatalogos, toCrearDespachoDto, toDespacho } from './despacho.mapper';
import { Catalogos, Despacho, NuevoDespacho } from './despacho.model';

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

  getCatalogos(): Observable<Catalogos> {
    return this.http
      .get<CatalogosDto>(`${environment.apiBaseUrl}/catalogos`)
      .pipe(map(toCatalogos));
  }
}
