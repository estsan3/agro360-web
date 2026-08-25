/**
 * Forma exacta que devuelve el backend Python (snake_case).
 * Si el backend cambia, solo se toca esto y el mapper.
 */
export interface ViajeDto {
  id: string;
  /** Nombre del chofer (wire del backend). */
  chofer_nombre?: string;
  /** Alias legacy del mock; preferir chofer_nombre. */
  chofer?: string;
  chofer_id?: string | null;
  dominio: string;
  destino: string;
  toneladas: number;
  cpe_codigo_turno?: string | null;
  cpe_dominio_acoplado?: string | null;
  checklist_gasoil?: boolean;
  checklist_efectivo?: boolean;
  estado:
    | 'borrador'
    | 'en_busqueda_transportistas'
    | 'pendiente'
    | 'en_viaje'
    | 'retrasado'
    | 'completado'
    | 'cancelado';
  progreso: number; // 0-100
  observaciones: string;
}

export type TipoAdjuntoViajeDto = 'ticket_gasoil' | 'cpe_escaneada' | 'otro';

export interface ViajeAdjuntoDto {
  id: string;
  viaje_id: string;
  tipo: TipoAdjuntoViajeDto;
  nombre: string;
  mime: string;
  creado_en: string;
  data_url?: string;
}

export interface SubirAdjuntoViajeDto {
  tipo: TipoAdjuntoViajeDto;
  nombre: string;
  mime: string;
  data_url: string;
}

export interface ActualizarViajeDto {
  chofer_id?: string | null;
  estado?: ViajeDto['estado'];
  progreso?: number;
  observaciones?: string;
}

export interface EmitirCartaPorteDto {
  despacho_id: string;
  viaje_id: string;
}

export type EstadoCartaPorteDto = 'pendiente' | 'error' | 'procesada' | 'autorizada' | 'anulada';

export interface CartaPorteDto {
  id: string;
  despacho_id: string;
  viaje_id: string;
  tipo_cpe: number;
  nro_carta_porte: string | null;
  nro_ctg: string | null;
  estado: EstadoCartaPorteDto;
  material: string;
  origen: string;
  destino: string;
  dominio: string;
  toneladas: number;
  payload_afip: Record<string, unknown>;
  intentos: number;
  error_detalle: string;
  tiene_documento: boolean;
  creada_en: string;
  actualizada_en?: string | null;
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
  observaciones?: string;
  estado: 'borrador' | 'activo' | 'cerrado';
  dador_viaje?: string;
  tarifa_llena?: boolean;
  tarifa_por_tn?: number | null;
  distancia_km?: number | null;
  cuando?: 'ahora' | 'manana' | 'fecha';
  cuando_fecha?: string | null;
  cpe_habilitada?: boolean;
  cpe_tipo?: number | null;
  cpe_sucursal?: number | null;
  cpe_cosecha?: number | null;
  cpe_cuit_solicitante?: string | null;
  cpe_origen_cod_provincia?: number | null;
  cpe_origen_cod_localidad?: number | null;
  cpe_origen_planta?: number | null;
  cpe_nro_renspa?: string | null;
  cpe_codigo_turno?: string | null;
  cpe_hora_partida?: string | null;
  cpe_corresponde_retiro_productor?: boolean;
  cpe_es_solicitante_campo?: boolean;
  cpe_destino_cuit?: string | null;
  cpe_destino_es_campo?: boolean;
  cpe_destino_cod_provincia?: number | null;
  cpe_destino_cod_localidad?: number | null;
  cpe_destino_planta?: number | null;
  cpe_peso_tara_kg_default?: number | null;
  cpe_mercaderia_fumigada?: boolean;
  cpe_cuit_pagador_flete?: string | null;
  cpe_cuit_intermediario_flete?: string | null;
  cpe_cuit_remitente_comercial_vp?: string | null;
  cpe_cuit_remitente_comercial_vs?: string | null;
  cpe_cuit_mercado_a_termino?: string | null;
  cpe_cuit_corredor_vp?: string | null;
  cpe_cuit_corredor_vs?: string | null;
  cpe_cuit_representante_entregador?: string | null;
  cpe_cuit_representante_recibidor?: string | null;
  cpe_cuit_remitente_comercial_vs2?: string | null;
  cpe_cuit_remitente_comercial_productor?: string | null;
  viajes: ViajeDto[];
}

export interface TarifaNacionalDto {
  id: string;
  km_desde: number;
  km_hasta: number;
  precio_por_tn: number;
  vigencia: string;
}

export interface CrearViajeDto {
  id?: string;
  chofer_id?: string | null;
  dominio?: string | null;
  destino: string;
  toneladas: number;
  observaciones?: string;
  cpe_codigo_turno?: string | null;
  cpe_dominio_acoplado?: string | null;
}

export interface ActualizarMetadatosDespachoDto {
  fecha_llegada_estimada: string;
  observaciones?: string;
}

export interface DuplicarDespachoDto {
  nombre?: string;
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
  observaciones?: string;
  estado: 'borrador' | 'activo';
  dador_viaje?: string;
  tarifa_llena?: boolean;
  tarifa_por_tn?: number | null;
  distancia_km?: number | null;
  cuando?: 'ahora' | 'manana' | 'fecha';
  cuando_fecha?: string | null;
  cpe_habilitada?: boolean;
  cpe_tipo?: number | null;
  cpe_sucursal?: number | null;
  cpe_cosecha?: number | null;
  cpe_cuit_solicitante?: string | null;
  cpe_origen_cod_provincia?: number | null;
  cpe_origen_cod_localidad?: number | null;
  cpe_origen_planta?: number | null;
  cpe_nro_renspa?: string | null;
  cpe_codigo_turno?: string | null;
  cpe_hora_partida?: string | null;
  cpe_corresponde_retiro_productor?: boolean;
  cpe_es_solicitante_campo?: boolean;
  cpe_destino_cuit?: string | null;
  cpe_destino_es_campo?: boolean;
  cpe_destino_cod_provincia?: number | null;
  cpe_destino_cod_localidad?: number | null;
  cpe_destino_planta?: number | null;
  cpe_peso_tara_kg_default?: number | null;
  cpe_mercaderia_fumigada?: boolean;
  cpe_cuit_pagador_flete?: string | null;
  cpe_cuit_intermediario_flete?: string | null;
  cpe_cuit_remitente_comercial_vp?: string | null;
  cpe_cuit_remitente_comercial_vs?: string | null;
  cpe_cuit_mercado_a_termino?: string | null;
  cpe_cuit_corredor_vp?: string | null;
  cpe_cuit_corredor_vs?: string | null;
  cpe_cuit_representante_entregador?: string | null;
  cpe_cuit_representante_recibidor?: string | null;
  cpe_cuit_remitente_comercial_vs2?: string | null;
  cpe_cuit_remitente_comercial_productor?: string | null;
  viajes: {
    id?: string;
    chofer_id?: string | null;
    dominio?: string;
    destino: string;
    toneladas: number;
    cpe_codigo_turno?: string | null;
    cpe_dominio_acoplado?: string | null;
  }[];
}

export interface CatalogosDto {
  productores: {
    id: string;
    nombre: string;
    campos: {
      id: string;
      nombre: string;
      nro_renspa?: string | null;
      puntos_entrada?: {
        id: string;
        nombre: string;
        orden: number;
        latitud: number;
        longitud: number;
        observacion: string;
      }[];
    }[];
  }[];
  administradores: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[];
  materiales: string[];
  choferes: ChoferCatalogoDto[];
  transportistas?: TransportistaCatalogoDto[];
}

export interface CamionCatalogoDto {
  id: string;
  dominio: string;
  modelo: string;
  tipo?: string;
  acoplado_dominio?: string;
}

export interface ChoferCatalogoDto {
  id: string;
  nombre: string;
  transportista_id?: string | null;
  camion_id?: string | null;
  dominio: string;
  modelo: string;
  camiones?: CamionCatalogoDto[];
}

export interface TransportistaCatalogoDto {
  id: string;
  nombre: string;
  camiones: CamionCatalogoDto[];
  choferes?: ChoferCatalogoDto[];
}
