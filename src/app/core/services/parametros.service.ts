import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Contrato del backend (snake_case) */
export interface ParametrosDto {
  precio_por_tonelada: number;
  moneda: 'ARS' | 'USD';
}

export interface Parametros {
  precioPorTonelada: number;
  moneda: 'ARS' | 'USD';
}

export function toParametros(dto: ParametrosDto): Parametros {
  return { precioPorTonelada: dto.precio_por_tonelada, moneda: dto.moneda };
}

@Injectable({ providedIn: 'root' })
export class ParametrosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/parametros`;

  get(): Observable<ParametrosDto> {
    return this.http.get<ParametrosDto>(this.base);
  }

  update(parametros: Parametros): Observable<ParametrosDto> {
    return this.http.put<ParametrosDto>(this.base, {
      precio_por_tonelada: parametros.precioPorTonelada,
      moneda: parametros.moneda,
    });
  }
}
