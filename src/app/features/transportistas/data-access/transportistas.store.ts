import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AsyncState,
  asyncError,
  asyncIdle,
  asyncLoading,
  asyncSuccess,
} from '../../../core/models/async-state';
import { FiltroActivo, Transportista, TransportistaDetalle } from './transportistas.model';
import { TransportistasService } from './transportistas.service';

@Injectable({ providedIn: 'root' })
export class TransportistasStore {
  private readonly api = inject(TransportistasService);

  private readonly _empresas = signal<AsyncState<Transportista[]>>(asyncIdle());
  private readonly _detalle = signal<AsyncState<TransportistaDetalle | null>>(asyncIdle());
  private readonly _tiposVehiculo = signal<string[]>([]);
  private readonly _tiposLicencia = signal<string[]>([]);

  readonly empresas = this._empresas.asReadonly();
  readonly detalle = this._detalle.asReadonly();
  readonly tiposVehiculo = this._tiposVehiculo.asReadonly();
  readonly tiposLicencia = this._tiposLicencia.asReadonly();

  cargarEmpresas(filtro: FiltroActivo, busqueda: string): void {
    const prev = this._empresas().data;
    this._empresas.set({ ...asyncLoading(), data: prev });
    this.api.listar(filtro, busqueda).subscribe({
      next: (items) => this._empresas.set(asyncSuccess(items)),
      error: (error: Error) => this._empresas.set({ ...asyncError(error.message), data: prev }),
    });
  }

  cargarDetalle(id: string): void {
    this._detalle.set(asyncLoading());
    this.api.obtener(id).subscribe({
      next: (detalle) => this._detalle.set(asyncSuccess(detalle)),
      error: (error: Error) => this._detalle.set(asyncError(error.message)),
    });
  }

  cargarParametria(): void {
    this.api.listarTiposVehiculo().subscribe((items) => this._tiposVehiculo.set(items));
    this.api.listarTiposLicencia().subscribe((items) => this._tiposLicencia.set(items));
  }

  refrescarDetalle(id: string): Observable<TransportistaDetalle> {
    return this.api.obtener(id).pipe(tap((detalle) => this.actualizarDetalle(detalle)));
  }

  /** Sincroniza el detalle en memoria (p. ej. tras POST que devuelve el detalle completo). */
  actualizarDetalle(detalle: TransportistaDetalle): void {
    this._detalle.set(asyncSuccess(detalle));
    this._empresas.update((state) => {
      if (!state.data) {
        return state;
      }
      return asyncSuccess(
        state.data.map((e) =>
          e.id === detalle.id
            ? {
                ...e,
                activo: detalle.activo,
                nombreFantasia: detalle.nombreFantasia,
                razonSocial: detalle.razonSocial,
              }
            : e,
        ),
      );
    });
  }
}
