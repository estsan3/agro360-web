/**
 * Modelo de dominio del front (camelCase, fechas como Date).
 */
export type EstadoViaje =
  | 'borrador'
  | 'en-busqueda-transportistas'
  | 'pendiente'
  | 'en-viaje'
  | 'retrasado'
  | 'completado'
  | 'cancelado';
export type EstadoDespacho = 'borrador' | 'activo' | 'cerrado';
export type CuandoDespacho = 'ahora' | 'manana' | 'fecha';
export type TipoAdjuntoViaje = 'ticket_gasoil' | 'cpe_escaneada' | 'otro';

export interface Viaje {
  id: string;
  choferId: string | null;
  chofer: string;
  dominio: string;
  destino: string;
  toneladas: number;
  estado: EstadoViaje;
  progreso: number; // 0-100
  observaciones: string;
}

export interface ViajeAdjunto {
  id: string;
  viajeId: string;
  tipo: TipoAdjuntoViaje;
  nombre: string;
  mime: string;
  creadoEn: string;
  dataUrl?: string;
}

export interface Despacho {
  id: string;
  nombre: string;
  productorId: string;
  campoId: string;
  origen: string;
  entradaCampo: string;
  material: string;
  administradorId: string;
  vendedorId: string;
  fechaInicio: Date;
  fechaLlegadaEstimada: Date;
  observaciones: string;
  estado: EstadoDespacho;
  dadorViaje: string;
  tarifaLlena: boolean;
  tarifaPorTn: number | null;
  distanciaKm: number | null;
  cuando: CuandoDespacho;
  cuandoFecha: string | null;
  viajes: Viaje[];
}

export interface NuevoViaje {
  choferId: string;
  dominio: string;
  destino: string;
  toneladas: number;
}

/** Alta de un viaje en campaña ya activa (chofer opcional). */
export interface AgregarViajeInput {
  choferId?: string;
  dominio?: string;
  destino: string;
  toneladas: number;
  observaciones?: string;
}

export interface ActualizarMetadatosDespachoInput {
  fechaLlegadaEstimada: string;
  observaciones?: string;
}

export interface NuevoDespacho {
  nombre: string;
  productorId: string;
  campoId: string;
  origen: string;
  entradaCampo: string;
  material: string;
  administradorId: string;
  vendedorId: string;
  fechaInicio: string;
  fechaLlegadaEstimada: string;
  estado: EstadoDespacho;
  dadorViaje?: string;
  tarifaLlena?: boolean;
  tarifaPorTn?: number | null;
  distanciaKm?: number | null;
  cuando?: CuandoDespacho;
  cuandoFecha?: string | null;
  viajes: NuevoViaje[];
}

export interface TarifaNacional {
  id: string;
  kmDesde: number;
  kmHasta: number;
  precioPorTn: number;
  vigencia: string;
}

export interface CamionCatalogo {
  id: string;
  dominio: string;
  modelo: string;
}

export interface ChoferCatalogo {
  id: string;
  nombre: string;
  transportistaId: string | null;
  dominio: string;
  modelo: string;
  camiones: CamionCatalogo[];
}

export interface TransportistaCatalogo {
  id: string;
  nombre: string;
  camiones: CamionCatalogo[];
  choferes: ChoferCatalogo[];
}

export interface PuntoEntradaCatalogo {
  id: string;
  nombre: string;
  orden: number;
  latitud: number;
  longitud: number;
  observacion: string;
}

export interface CampoCatalogo {
  id: string;
  nombre: string;
  puntosEntrada?: PuntoEntradaCatalogo[];
  /** Alias snake_case del mock API */
  puntos_entrada?: PuntoEntradaCatalogo[];
}

export interface Catalogos {
  productores: { id: string; nombre: string; campos: CampoCatalogo[] }[];
  administradores: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[];
  materiales: string[];
  choferes: ChoferCatalogo[];
  transportistas: TransportistaCatalogo[];
}
