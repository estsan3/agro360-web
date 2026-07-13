import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AsyncState,
  asyncError,
  asyncIdle,
  asyncLoading,
  asyncSuccess,
} from '../../../core/models/async-state';
import { Catalogos, Despacho, NuevoDespacho } from './despacho.model';
import { DespachoService } from './despacho.service';

/**
 * Estado compartido del dominio Despachos. Crear despacho, Borradores,
 * Gestión operativa y Reportes leen de acá — nunca se hablan entre sí.
 */
@Injectable({ providedIn: 'root' })
export class DespachoStore {
  private readonly api = inject(DespachoService);

  private readonly _despachos = signal<AsyncState<Despacho[]>>(asyncIdle());
  private readonly _catalogos = signal<AsyncState<Catalogos>>(asyncIdle());

  readonly despachos = this._despachos.asReadonly();
  readonly catalogos = this._catalogos.asReadonly();

  readonly borradores = computed(() =>
    (this._despachos().data ?? []).filter((despacho) => despacho.estado === 'borrador'),
  );
  readonly activos = computed(() =>
    (this._despachos().data ?? []).filter((despacho) => despacho.estado === 'activo'),
  );

  /**
   * Despachos con operación en curso: activos + borradores cuyos viajes
   * ya iniciaron (los viajes en borrador se excluyen del detalle).
   * Es lo que muestran Gestión operativa y Reportería.
   */
  readonly enOperacion = computed(() =>
    (this._despachos().data ?? [])
      .map((despacho) => ({
        ...despacho,
        viajes: despacho.viajes.filter((viaje) => viaje.estado !== 'borrador'),
      }))
      .filter((despacho) => despacho.estado === 'activo' || despacho.viajes.length > 0),
  );

  cargarDespachos(): void {
    if (this._despachos().status === 'loading') {
      return;
    }
    this._despachos.set(asyncLoading());
    this.api.getDespachos().subscribe({
      next: (despachos) => this._despachos.set(asyncSuccess(despachos)),
      error: (error: Error) => this._despachos.set(asyncError(error.message)),
    });
  }

  cargarCatalogos(): void {
    if (this._catalogos().status !== 'idle') {
      return; // catálogos estables: se cargan una vez por sesión
    }
    this.recargarCatalogos();
  }

  /** Recarga forzada — la usa Configuración tras editar catálogos */
  recargarCatalogos(): void {
    this._catalogos.set(asyncLoading());
    this.api.getCatalogos().subscribe({
      next: (catalogos) => this._catalogos.set(asyncSuccess(catalogos)),
      error: (error: Error) => this._catalogos.set(asyncError(error.message)),
    });
  }

  crearDespacho(input: NuevoDespacho): Observable<Despacho> {
    return this.api.crearDespacho(input).pipe(
      tap((nuevo) => {
        const actual = this._despachos();
        if (actual.status === 'success') {
          this._despachos.set(asyncSuccess([...(actual.data ?? []), nuevo]));
        }
      }),
    );
  }

  iniciarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.api
      .iniciarViaje(despachoId, viajeId)
      .pipe(tap((actualizado) => this.reemplazar(actualizado)));
  }

  duplicarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.api
      .duplicarViaje(despachoId, viajeId)
      .pipe(tap((actualizado) => this.reemplazar(actualizado)));
  }

  eliminarViaje(despachoId: string, viajeId: string): Observable<Despacho> {
    return this.api
      .eliminarViaje(despachoId, viajeId)
      .pipe(tap((actualizado) => this.reemplazar(actualizado)));
  }

  private reemplazar(despacho: Despacho): void {
    const actual = this._despachos();
    if (actual.status === 'success') {
      this._despachos.set(
        asyncSuccess((actual.data ?? []).map((d) => (d.id === despacho.id ? despacho : d))),
      );
    }
  }

  eliminarDespacho(id: string): Observable<void> {
    return this.api.eliminarDespacho(id).pipe(
      tap(() => {
        const actual = this._despachos();
        if (actual.status === 'success') {
          this._despachos.set(
            asyncSuccess((actual.data ?? []).filter((despacho) => despacho.id !== id)),
          );
        }
      }),
    );
  }
}
