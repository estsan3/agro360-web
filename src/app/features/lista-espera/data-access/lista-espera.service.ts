import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EntradaListaEspera, EntradaListaEsperaDto, mapEntradaLista } from './lista-espera.model';

@Injectable({ providedIn: 'root' })
export class ListaEsperaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/lista-espera`;

  listar(empresaId = 'default'): Observable<EntradaListaEspera[]> {
    return this.http
      .get<EntradaListaEsperaDto[]>(this.base, { params: { empresa_id: empresaId } })
      .pipe(map((items) => items.map(mapEntradaLista)));
  }

  anotar(
    choferId: string,
    camionId: string,
    empresaId = 'default',
  ): Observable<EntradaListaEspera> {
    return this.http
      .post<EntradaListaEsperaDto>(this.base, {
        chofer_id: choferId,
        camion_id: camionId,
        empresa_id: empresaId,
      })
      .pipe(map(mapEntradaLista));
  }

  quitar(entradaId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${entradaId}`);
  }

  rechazar(entradaId: string): Observable<EntradaListaEspera> {
    return this.http
      .post<EntradaListaEsperaDto>(`${this.base}/${entradaId}/rechazar`, {})
      .pipe(map(mapEntradaLista));
  }
}
