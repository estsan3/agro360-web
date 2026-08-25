export type EstadoCartaPorte = 'pendiente' | 'error' | 'procesada' | 'autorizada' | 'anulada';

export interface CartaPorte {
  id: string;
  despachoId: string;
  viajeId: string;
  tipoCpe: number;
  nroCartaPorte: string | null;
  nroCtg: string | null;
  estado: EstadoCartaPorte;
  material: string;
  origen: string;
  destino: string;
  dominio: string;
  toneladas: number;
  payloadAfip: Record<string, unknown>;
  intentos: number;
  errorDetalle: string;
  tieneDocumento: boolean;
  creadaEn: string;
  actualizadaEn: string | null;
}
