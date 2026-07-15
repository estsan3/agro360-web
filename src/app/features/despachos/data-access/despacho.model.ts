/**
 * Modelo de dominio del front (camelCase, fechas como Date).
 */
export type EstadoViaje = 'borrador' | 'pendiente' | 'en-viaje' | 'retrasado' | 'completado';
export type EstadoDespacho = 'borrador' | 'activo';

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
  estado: EstadoDespacho;
  viajes: Viaje[];
}

export interface NuevoViaje {
  choferId: string;
  dominio: string;
  destino: string;
  toneladas: number;
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
  viajes: NuevoViaje[];
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

export interface Catalogos {
  productores: { id: string; nombre: string; campos: { id: string; nombre: string }[] }[];
  administradores: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[];
  materiales: string[];
  choferes: ChoferCatalogo[];
  transportistas: TransportistaCatalogo[];
}
