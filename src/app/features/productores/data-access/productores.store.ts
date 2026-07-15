import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AsyncState,
  asyncError,
  asyncIdle,
  asyncLoading,
  asyncSuccess,
} from '../../../core/models/async-state';
import { FiltroActivo, Productor, ProductorDetalle } from './productores.model';
import { ProductoresService } from './productores.service';

@Injectable({ providedIn: 'root' })
export class ProductoresStore {
  private readonly api = inject(ProductoresService);

  private readonly _productores = signal<AsyncState<Productor[]>>(asyncIdle());
  private readonly _detalle = signal<AsyncState<ProductorDetalle | null>>(asyncIdle());
  private readonly _vendedores = signal<{ id: string; nombre: string }[]>([]);

  readonly productores = this._productores.asReadonly();
  readonly detalle = this._detalle.asReadonly();
  readonly vendedores = this._vendedores.asReadonly();

  cargarProductores(filtro: FiltroActivo, busqueda: string): void {
    const prev = this._productores().data;
    this._productores.set({ ...asyncLoading(), data: prev });
    this.api.listar(filtro, busqueda).subscribe({
      next: (items) => this._productores.set(asyncSuccess(items)),
      error: (error: Error) => this._productores.set({ ...asyncError(error.message), data: prev }),
    });
  }

  cargarDetalle(id: string): void {
    this._detalle.set(asyncLoading());
    this.api.obtener(id).subscribe({
      next: (detalle) => this._detalle.set(asyncSuccess(detalle)),
      error: (error: Error) => this._detalle.set(asyncError(error.message)),
    });
  }

  cargarVendedores(): void {
    this.api.listarVendedores().subscribe((items) => this._vendedores.set(items));
  }

  refrescarDetalle(id: string): Observable<ProductorDetalle> {
    return this.api.obtener(id).pipe(
      tap((detalle) => {
        this._detalle.set(asyncSuccess(detalle));
        this._productores.update((state) => {
          if (!state.data) {
            return state;
          }
          return asyncSuccess(
            state.data.map((p) => (p.id === id ? { ...p, activo: detalle.activo } : p)),
          );
        });
      }),
    );
  }
}
