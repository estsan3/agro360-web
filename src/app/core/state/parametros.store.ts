import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Parametros, ParametrosService, toParametros } from '../services/parametros.service';

const DEFAULTS: Parametros = { precioPorTonelada: 1000, moneda: 'ARS' };

/**
 * Parámetros del negocio — vive en core porque cruza dominios:
 * Configuración los edita, Reportería los consume.
 */
@Injectable({ providedIn: 'root' })
export class ParametrosStore {
  private readonly api = inject(ParametrosService);

  private readonly _parametros = signal<Parametros>(DEFAULTS);
  private cargado = false;

  readonly parametros = this._parametros.asReadonly();

  cargar(): void {
    if (this.cargado) {
      return;
    }
    this.cargado = true;
    this.api.get().subscribe({
      next: (dto) => this._parametros.set(toParametros(dto)),
      error: () => (this.cargado = false),
    });
  }

  actualizar(parametros: Parametros): Observable<Parametros> {
    return this.api.update(parametros).pipe(
      map(toParametros),
      tap((actualizados) => this._parametros.set(actualizados)),
    );
  }
}
