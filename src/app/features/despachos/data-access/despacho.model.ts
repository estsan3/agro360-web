/**
 * Modelo de dominio del front (camelCase, fechas como Date).
 */
export type EstadoViaje = 'pendiente' | 'en-viaje' | 'retrasado' | 'completado';
export type EstadoDespacho = 'borrador' | 'activo';

export interface Viaje {
  id: string;
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
  chofer: string;
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

export interface Catalogos {
  productores: { id: string; nombre: string; campos: { id: string; nombre: string }[] }[];
  administradores: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[];
  materiales: string[];
  choferes: { id: string; nombre: string; dominio: string }[];
}
