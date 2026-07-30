import {
  CuentaResumen,
  MovimientoCtacte,
  ParametrosLiquidacion,
  ResumenCuenta,
} from './liquidaciones.model';
import {
  CuentaResumenDto,
  MovimientoDto,
  ParametrosLiquidacionDto,
  ResumenCuentaDto,
} from './liquidaciones.dto';

export function mapParametros(dto: ParametrosLiquidacionDto): ParametrosLiquidacion {
  return {
    tarifaFletePorTn: dto.tarifa_flete_por_tn,
    comisionPorcentaje: dto.comision_porcentaje,
    ivaAlicuota: dto.iva_alicuota,
    ley25413Porcentaje: dto.ley_25413_porcentaje,
    nombreTransportadora: dto.nombre_transportadora || 'Transportadora',
  };
}

export function toParametrosDto(m: ParametrosLiquidacion): ParametrosLiquidacionDto {
  return {
    tarifa_flete_por_tn: m.tarifaFletePorTn,
    comision_porcentaje: m.comisionPorcentaje,
    iva_alicuota: m.ivaAlicuota,
    ley_25413_porcentaje: m.ley25413Porcentaje,
    nombre_transportadora: m.nombreTransportadora,
  };
}

export function mapMovimiento(dto: MovimientoDto): MovimientoCtacte {
  return {
    id: dto.id,
    transportistaId: dto.transportista_id,
    fecha: dto.fecha,
    concepto: dto.concepto,
    comprobante: dto.comprobante,
    detalle: dto.detalle,
    dadorViaje: dto.dador_viaje,
    toneladas: dto.toneladas,
    tarifa: dto.tarifa,
    debe: dto.debe,
    haber: dto.haber,
    saldo: dto.saldo,
    viajeId: dto.viaje_id,
    despachoId: dto.despacho_id,
  };
}

export function mapResumen(dto: ResumenCuentaDto): ResumenCuenta {
  return {
    transportistaId: dto.transportista_id,
    transportistaNombre: dto.transportista_nombre,
    desde: dto.desde,
    hasta: dto.hasta,
    saldoInicial: dto.saldo_inicial,
    saldoFinal: dto.saldo_final,
    totalesDebe: dto.totales_debe,
    totalesHaber: dto.totales_haber,
    movimientos: dto.movimientos.map(mapMovimiento),
  };
}

export function mapCuenta(dto: CuentaResumenDto): CuentaResumen {
  return {
    transportistaId: dto.transportista_id,
    transportistaNombre: dto.transportista_nombre,
    saldoActual: dto.saldo_actual,
    cantidadMovimientos: dto.cantidad_movimientos,
  };
}
