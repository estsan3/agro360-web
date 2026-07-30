import { Injectable, inject, signal } from '@angular/core';
import {
  AsyncState,
  asyncError,
  asyncLoading,
  asyncSuccess,
} from '../../../core/models/async-state';
import { LiquidacionesService } from './liquidaciones.service';
import {
  ActualizarMovimiento,
  CrearFlete,
  CrearMovimientoManual,
  CuentaResumen,
  ParametrosLiquidacion,
  ResumenCuenta,
} from './liquidaciones.model';

@Injectable({ providedIn: 'root' })
export class LiquidacionesStore {
  private readonly api = inject(LiquidacionesService);

  readonly cuentas = signal<AsyncState<CuentaResumen[]>>({ status: 'idle' });
  readonly resumen = signal<AsyncState<ResumenCuenta | null>>({ status: 'idle' });
  readonly parametros = signal<AsyncState<ParametrosLiquidacion | null>>({ status: 'idle' });

  cargarCuentas(): void {
    this.cuentas.set(asyncLoading());
    this.api.listarCuentas().subscribe({
      next: (data) => this.cuentas.set(asyncSuccess(data)),
      error: (err: Error) => this.cuentas.set(asyncError(err.message || 'Error al cargar cuentas')),
    });
  }

  cargarResumen(transportistaId: string, desde?: string, hasta?: string): void {
    this.resumen.set(asyncLoading());
    this.api.obtenerResumen(transportistaId, desde, hasta).subscribe({
      next: (data) => this.resumen.set(asyncSuccess(data)),
      error: (err: Error) => this.resumen.set(asyncError(err.message || 'Error al cargar resumen')),
    });
  }

  cargarParametros(): void {
    this.parametros.set(asyncLoading());
    this.api.obtenerParametros().subscribe({
      next: (data) => this.parametros.set(asyncSuccess(data)),
      error: (err: Error) =>
        this.parametros.set(asyncError(err.message || 'Error al cargar parámetros')),
    });
  }

  guardarParametros(datos: ParametrosLiquidacion): void {
    this.api.guardarParametros(datos).subscribe({
      next: (data) => this.parametros.set(asyncSuccess(data)),
    });
  }

  crearMovimiento(datos: CrearMovimientoManual, onOk?: () => void): void {
    this.api.crearMovimiento(datos).subscribe({
      next: () => {
        this.cargarCuentas();
        this.cargarResumen(datos.transportistaId);
        onOk?.();
      },
    });
  }

  crearFlete(datos: CrearFlete, onOk?: () => void): void {
    this.api.crearFlete(datos).subscribe({
      next: () => {
        this.cargarCuentas();
        this.cargarResumen(datos.transportistaId);
        onOk?.();
      },
    });
  }

  actualizarMovimiento(movimientoId: string, datos: ActualizarMovimiento, onOk?: () => void): void {
    this.api.actualizarMovimiento(movimientoId, datos).subscribe({
      next: () => {
        this.cargarCuentas();
        onOk?.();
      },
    });
  }

  eliminarMovimiento(movimientoId: string, onOk?: () => void): void {
    this.api.eliminarMovimiento(movimientoId).subscribe({
      next: () => {
        this.cargarCuentas();
        onOk?.();
      },
    });
  }
}
