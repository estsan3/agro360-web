export interface ParametrosLiquidacion {
  tarifaFletePorTn: number;
  comisionPorcentaje: number;
  ivaAlicuota: number;
  ley25413Porcentaje: number;
  nombreTransportadora: string;
}

export interface MovimientoCtacte {
  id: string;
  transportistaId: string;
  fecha: string;
  concepto: string;
  comprobante: string;
  detalle: string;
  dadorViaje: string;
  toneladas: number | null;
  tarifa: number | null;
  debe: number;
  haber: number;
  saldo: number;
  viajeId: string | null;
  despachoId: string | null;
}

export interface ResumenCuenta {
  transportistaId: string;
  transportistaNombre: string;
  desde: string | null;
  hasta: string | null;
  saldoInicial: number;
  saldoFinal: number;
  totalesDebe: number;
  totalesHaber: number;
  movimientos: MovimientoCtacte[];
}

export interface CuentaResumen {
  transportistaId: string;
  transportistaNombre: string;
  saldoActual: number;
  cantidadMovimientos: number;
}

export interface CrearMovimientoManual {
  transportistaId: string;
  concepto: 'gasoil' | 'transferencia' | 'cheque' | 'anticipo' | 'ajuste';
  detalle: string;
  debe: number;
  haber: number;
  fecha?: string;
  toneladas?: number | null;
  dadorViaje?: string;
}

/** Alta de flete: el backend genera IVA flete, comisión, IVA comisión e Imp. Ley. */
export interface CrearFlete {
  transportistaId: string;
  detalle: string;
  toneladas: number;
  tarifa?: number;
  dadorViaje?: string;
  fecha?: string;
}

export interface ActualizarMovimiento {
  fecha: string;
  detalle: string;
  dadorViaje?: string;
  comprobante?: string;
  toneladas?: number | null;
  tarifa?: number | null;
  debe: number;
  haber: number;
}
