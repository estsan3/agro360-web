import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CuentaResumenDto,
  MovimientoDto,
  ParametrosLiquidacionDto,
  ResumenCuentaDto,
} from './liquidaciones.dto';
import {
  mapCuenta,
  mapMovimiento,
  mapParametros,
  mapResumen,
  toParametrosDto,
} from './liquidaciones.mapper';
import {
  ActualizarMovimiento,
  CrearFlete,
  CrearMovimientoManual,
  CuentaResumen,
  MovimientoCtacte,
  ParametrosLiquidacion,
  ResumenCuenta,
} from './liquidaciones.model';

@Injectable({ providedIn: 'root' })
export class LiquidacionesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/liquidaciones`;

  obtenerParametros(): Observable<ParametrosLiquidacion> {
    return this.http
      .get<ParametrosLiquidacionDto>(`${this.base}/parametros`)
      .pipe(map(mapParametros));
  }

  guardarParametros(datos: ParametrosLiquidacion): Observable<ParametrosLiquidacion> {
    return this.http
      .put<ParametrosLiquidacionDto>(`${this.base}/parametros`, toParametrosDto(datos))
      .pipe(map(mapParametros));
  }

  listarCuentas(): Observable<CuentaResumen[]> {
    return this.http
      .get<CuentaResumenDto[]>(`${this.base}/cuentas`)
      .pipe(map((items) => items.map(mapCuenta)));
  }

  obtenerResumen(
    transportistaId: string,
    desde?: string,
    hasta?: string,
  ): Observable<ResumenCuenta> {
    let params = new HttpParams();
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http
      .get<ResumenCuentaDto>(`${this.base}/cuentas/${transportistaId}`, { params })
      .pipe(map(mapResumen));
  }

  crearMovimiento(body: CrearMovimientoManual): Observable<MovimientoCtacte> {
    return this.http
      .post<MovimientoDto>(`${this.base}/movimientos`, {
        transportista_id: body.transportistaId,
        concepto: body.concepto,
        detalle: body.detalle,
        debe: body.debe,
        haber: body.haber,
        fecha: body.fecha || null,
        toneladas: body.toneladas ?? null,
        dador_viaje: body.dadorViaje ?? '',
      })
      .pipe(map(mapMovimiento));
  }

  crearFlete(body: CrearFlete): Observable<MovimientoCtacte[]> {
    return this.http
      .post<MovimientoDto[]>(`${this.base}/fletes`, {
        transportista_id: body.transportistaId,
        detalle: body.detalle,
        toneladas: body.toneladas,
        tarifa: body.tarifa ?? null,
        dador_viaje: body.dadorViaje ?? '',
        fecha: body.fecha || null,
      })
      .pipe(map((items) => items.map(mapMovimiento)));
  }

  actualizarMovimiento(
    movimientoId: string,
    body: ActualizarMovimiento,
  ): Observable<MovimientoCtacte> {
    return this.http
      .put<MovimientoDto>(`${this.base}/movimientos/${movimientoId}`, {
        fecha: body.fecha,
        detalle: body.detalle,
        dador_viaje: body.dadorViaje ?? '',
        comprobante: body.comprobante ?? '',
        toneladas: body.toneladas ?? null,
        tarifa: body.tarifa ?? null,
        debe: body.debe,
        haber: body.haber,
      })
      .pipe(map(mapMovimiento));
  }

  eliminarMovimiento(movimientoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/movimientos/${movimientoId}`);
  }
}
