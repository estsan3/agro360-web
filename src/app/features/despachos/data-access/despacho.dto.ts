/**
 * Forma exacta que devuelve el backend Python (snake_case).
 * Si el backend cambia, solo se toca esto y el mapper.
 */
export interface ViajeDto {
  id: string;
  chofer: string;
  dominio: string;
  destino: string;
  toneladas: number;
  estado: 'borrador' | 'pendiente' | 'en_viaje' | 'retrasado' | 'completado';
  progreso: number; // 0-100
  observaciones: string;
}

export interface DespachoDto {
  id: string;
  nombre: string;
  productor_id: string;
  campo_id: string;
  origen: string;
  entrada_campo: string;
  material: string;
  administrador_id: string;
  vendedor_id: string;
  fecha_inicio: string; // ISO date
  fecha_llegada_estimada: string; // ISO date
  estado: 'borrador' | 'activo';
  viajes: ViajeDto[];
}

export interface CrearDespachoDto {
  nombre: string;
  productor_id: string;
  campo_id: string;
  origen: string;
  entrada_campo: string;
  material: string;
  administrador_id: string;
  vendedor_id: string;
  fecha_inicio: string;
  fecha_llegada_estimada: string;
  estado: 'borrador' | 'activo';
  viajes: Omit<ViajeDto, 'id' | 'estado' | 'progreso' | 'observaciones'>[];
}

export interface CatalogosDto {
  productores: { id: string; nombre: string; campos: { id: string; nombre: string }[] }[];
  administradores: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[];
  materiales: string[];
  choferes: { id: string; nombre: string; dominio: string; modelo: string }[];
}
