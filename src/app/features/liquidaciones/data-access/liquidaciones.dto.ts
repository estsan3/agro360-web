export interface ParametrosLiquidacionDto {
  tarifa_flete_por_tn: number;
  comision_porcentaje: number;
  iva_alicuota: number;
  ley_25413_porcentaje: number;
  nombre_transportadora: string;
}

export interface MovimientoDto {
  id: string;
  transportista_id: string;
  fecha: string;
  concepto: string;
  comprobante: string;
  detalle: string;
  dador_viaje: string;
  toneladas: number | null;
  tarifa: number | null;
  debe: number;
  haber: number;
  saldo: number;
  viaje_id: string | null;
  despacho_id: string | null;
  creado_en: string;
}

export interface ResumenCuentaDto {
  transportista_id: string;
  transportista_nombre: string;
  desde: string | null;
  hasta: string | null;
  saldo_inicial: number;
  saldo_final: number;
  totales_debe: number;
  totales_haber: number;
  movimientos: MovimientoDto[];
}

export interface CuentaResumenDto {
  transportista_id: string;
  transportista_nombre: string;
  saldo_actual: number;
  cantidad_movimientos: number;
}
