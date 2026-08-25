import {
  CatalogosDto,
  CrearDespachoDto,
  DespachoDto,
  ViajeAdjuntoDto,
  ViajeDto,
} from './despacho.dto';
import {
  CamionCatalogo,
  CampoCatalogo,
  Catalogos,
  ChoferCatalogo,
  Despacho,
  EstadoViaje,
  NuevoDespacho,
  TransportistaCatalogo,
  Viaje,
  ViajeAdjunto,
} from './despacho.model';

const ESTADO_VIAJE_MAP: Record<ViajeDto['estado'], EstadoViaje> = {
  borrador: 'borrador',
  en_busqueda_transportistas: 'en-busqueda-transportistas',
  pendiente: 'pendiente',
  en_viaje: 'en-viaje',
  retrasado: 'retrasado',
  completado: 'completado',
  cancelado: 'cancelado',
};

export function toViajeAdjunto(dto: ViajeAdjuntoDto): ViajeAdjunto {
  return {
    id: dto.id,
    viajeId: dto.viaje_id,
    tipo: dto.tipo,
    nombre: dto.nombre,
    mime: dto.mime,
    creadoEn: dto.creado_en,
    dataUrl: dto.data_url,
  };
}

export function toViaje(dto: ViajeDto): Viaje {
  return {
    id: dto.id,
    choferId: dto.chofer_id ?? null,
    chofer: dto.chofer_nombre ?? dto.chofer ?? '',
    dominio: dto.dominio,
    destino: dto.destino,
    toneladas: dto.toneladas,
    estado: ESTADO_VIAJE_MAP[dto.estado],
    progreso: dto.progreso,
    observaciones: dto.observaciones,
    cpeCodigoTurno: dto.cpe_codigo_turno ?? null,
    cpeDominioAcoplado: dto.cpe_dominio_acoplado ?? null,
  };
}

/** Parsea fechas date-only como locales (new Date('YYYY-MM-DD') asume UTC) */
function parseFecha(iso: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
}

export function toDespacho(dto: DespachoDto): Despacho {
  return {
    id: dto.id,
    nombre: dto.nombre,
    productorId: dto.productor_id,
    campoId: dto.campo_id,
    origen: dto.origen,
    entradaCampo: dto.entrada_campo,
    material: dto.material,
    administradorId: dto.administrador_id,
    vendedorId: dto.vendedor_id,
    fechaInicio: parseFecha(dto.fecha_inicio),
    fechaLlegadaEstimada: parseFecha(dto.fecha_llegada_estimada),
    observaciones: dto.observaciones ?? '',
    estado: dto.estado,
    dadorViaje: dto.dador_viaje ?? '',
    tarifaLlena: dto.tarifa_llena ?? false,
    tarifaPorTn: dto.tarifa_por_tn ?? null,
    distanciaKm: dto.distancia_km ?? null,
    cuando: dto.cuando ?? 'ahora',
    cuandoFecha: dto.cuando_fecha ?? null,
    cpeHabilitada: dto.cpe_habilitada ?? false,
    cpeTipo: dto.cpe_tipo ?? null,
    cpeSucursal: dto.cpe_sucursal ?? null,
    cpeCosecha: dto.cpe_cosecha ?? null,
    cpeCuitSolicitante: dto.cpe_cuit_solicitante ?? null,
    cpeOrigenCodProvincia: dto.cpe_origen_cod_provincia ?? null,
    cpeOrigenCodLocalidad: dto.cpe_origen_cod_localidad ?? null,
    cpeOrigenPlanta: dto.cpe_origen_planta ?? null,
    cpeNroRenspa: dto.cpe_nro_renspa ?? null,
    cpeCodigoTurno: dto.cpe_codigo_turno ?? null,
    cpeHoraPartida: dto.cpe_hora_partida ?? null,
    cpeCorrespondeRetiroProductor: dto.cpe_corresponde_retiro_productor ?? true,
    cpeEsSolicitanteCampo: dto.cpe_es_solicitante_campo ?? true,
    cpeDestinoCuit: dto.cpe_destino_cuit ?? null,
    cpeDestinoEsCampo: dto.cpe_destino_es_campo ?? false,
    cpeDestinoCodProvincia: dto.cpe_destino_cod_provincia ?? null,
    cpeDestinoCodLocalidad: dto.cpe_destino_cod_localidad ?? null,
    cpeDestinoPlanta: dto.cpe_destino_planta ?? null,
    cpePesoTaraKgDefault: dto.cpe_peso_tara_kg_default ?? null,
    cpeMercaderiaFumigada: dto.cpe_mercaderia_fumigada ?? false,
    cpeCuitPagadorFlete: dto.cpe_cuit_pagador_flete ?? null,
    cpeCuitIntermediarioFlete: dto.cpe_cuit_intermediario_flete ?? null,
    cpeCuitRemitenteComercialVp: dto.cpe_cuit_remitente_comercial_vp ?? null,
    cpeCuitRemitenteComercialVs: dto.cpe_cuit_remitente_comercial_vs ?? null,
    cpeCuitMercadoATermino: dto.cpe_cuit_mercado_a_termino ?? null,
    cpeCuitCorredorVp: dto.cpe_cuit_corredor_vp ?? null,
    cpeCuitCorredorVs: dto.cpe_cuit_corredor_vs ?? null,
    cpeCuitRepresentanteEntregador: dto.cpe_cuit_representante_entregador ?? null,
    cpeCuitRepresentanteRecibidor: dto.cpe_cuit_representante_recibidor ?? null,
    cpeCuitRemitenteComercialVs2: dto.cpe_cuit_remitente_comercial_vs2 ?? null,
    cpeCuitRemitenteComercialProductor: dto.cpe_cuit_remitente_comercial_productor ?? null,
    viajes: dto.viajes.map(toViaje),
  };
}

export function toCrearDespachoDto(input: NuevoDespacho): CrearDespachoDto {
  return {
    nombre: input.nombre,
    productor_id: input.productorId,
    campo_id: input.campoId,
    origen: input.origen,
    entrada_campo: input.entradaCampo,
    material: input.material,
    administrador_id: input.administradorId,
    vendedor_id: input.vendedorId,
    fecha_inicio: input.fechaInicio,
    fecha_llegada_estimada: input.fechaLlegadaEstimada || input.fechaInicio,
    observaciones: input.observaciones,
    estado: input.estado === 'cerrado' ? 'activo' : input.estado,
    dador_viaje: input.dadorViaje ?? '',
    tarifa_llena: input.tarifaLlena ?? false,
    tarifa_por_tn: input.tarifaLlena ? null : (input.tarifaPorTn ?? null),
    distancia_km: input.distanciaKm ?? null,
    cuando: input.cuando ?? 'ahora',
    cuando_fecha: input.cuando === 'fecha' ? (input.cuandoFecha ?? null) : null,
    cpe_habilitada: input.cpeHabilitada ?? false,
    cpe_tipo: input.cpeTipo ?? null,
    cpe_sucursal: input.cpeSucursal ?? null,
    cpe_cosecha: input.cpeCosecha ?? null,
    cpe_cuit_solicitante: input.cpeCuitSolicitante ?? null,
    cpe_origen_cod_provincia: input.cpeOrigenCodProvincia ?? null,
    cpe_origen_cod_localidad: input.cpeOrigenCodLocalidad ?? null,
    cpe_origen_planta: input.cpeOrigenPlanta ?? null,
    cpe_nro_renspa: input.cpeNroRenspa ?? null,
    cpe_codigo_turno: input.cpeCodigoTurno ?? null,
    cpe_hora_partida: input.cpeHoraPartida ?? null,
    cpe_corresponde_retiro_productor: input.cpeCorrespondeRetiroProductor ?? true,
    cpe_es_solicitante_campo: input.cpeEsSolicitanteCampo ?? true,
    cpe_destino_cuit: input.cpeDestinoCuit ?? null,
    cpe_destino_es_campo: input.cpeDestinoEsCampo ?? false,
    cpe_destino_cod_provincia: input.cpeDestinoCodProvincia ?? null,
    cpe_destino_cod_localidad: input.cpeDestinoCodLocalidad ?? null,
    cpe_destino_planta: input.cpeDestinoPlanta ?? null,
    cpe_peso_tara_kg_default: input.cpePesoTaraKgDefault ?? null,
    cpe_mercaderia_fumigada: input.cpeMercaderiaFumigada ?? false,
    cpe_cuit_pagador_flete: input.cpeCuitPagadorFlete ?? null,
    cpe_cuit_intermediario_flete: input.cpeCuitIntermediarioFlete ?? null,
    cpe_cuit_remitente_comercial_vp: input.cpeCuitRemitenteComercialVp ?? null,
    cpe_cuit_remitente_comercial_vs: input.cpeCuitRemitenteComercialVs ?? null,
    cpe_cuit_mercado_a_termino: input.cpeCuitMercadoATermino ?? null,
    cpe_cuit_corredor_vp: input.cpeCuitCorredorVp ?? null,
    cpe_cuit_corredor_vs: input.cpeCuitCorredorVs ?? null,
    cpe_cuit_representante_entregador: input.cpeCuitRepresentanteEntregador ?? null,
    cpe_cuit_representante_recibidor: input.cpeCuitRepresentanteRecibidor ?? null,
    cpe_cuit_remitente_comercial_vs2: input.cpeCuitRemitenteComercialVs2 ?? null,
    cpe_cuit_remitente_comercial_productor: input.cpeCuitRemitenteComercialProductor ?? null,
    viajes: input.viajes.map((viaje) => ({
      ...(viaje.id ? { id: viaje.id } : {}),
      chofer_id: viaje.choferId || null,
      ...(viaje.dominio ? { dominio: viaje.dominio.trim().toUpperCase() } : {}),
      destino: viaje.destino,
      toneladas: viaje.toneladas,
      ...(viaje.codigoTurno ? { cpe_codigo_turno: viaje.codigoTurno } : {}),
      ...(viaje.dominioAcoplado
        ? { cpe_dominio_acoplado: viaje.dominioAcoplado.trim().toUpperCase() }
        : {}),
    })),
  };
}

export function toCatalogos(dto: CatalogosDto): Catalogos {
  const mapCamion = (c: {
    id: string;
    dominio: string;
    modelo: string;
    tipo?: string;
    acoplado_dominio?: string;
  }): CamionCatalogo => ({
    id: c.id,
    dominio: c.dominio,
    modelo: c.modelo,
    tipo: c.tipo ?? 'tolva',
    acopladoDominio: (c.acoplado_dominio ?? '').toUpperCase(),
  });
  const mapChofer = (c: CatalogosDto['choferes'][number]): ChoferCatalogo => ({
    id: c.id,
    nombre: c.nombre,
    transportistaId: c.transportista_id ?? null,
    camionId: c.camion_id ?? null,
    dominio: c.dominio,
    modelo: c.modelo,
    camiones: (c.camiones ?? []).map(mapCamion),
  });
  return {
    productores: dto.productores.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      campos: p.campos.map((c): CampoCatalogo => ({
        id: c.id,
        nombre: c.nombre,
        nroRenspa: c.nro_renspa ?? null,
        puntosEntrada: c.puntos_entrada,
        puntos_entrada: c.puntos_entrada,
      })),
    })),
    administradores: dto.administradores,
    vendedores: dto.vendedores,
    materiales: dto.materiales,
    choferes: dto.choferes.map(mapChofer),
    transportistas: (dto.transportistas ?? []).map((t): TransportistaCatalogo => ({
      id: t.id,
      nombre: t.nombre,
      camiones: t.camiones.map(mapCamion),
      choferes: (t.choferes ?? []).map(mapChofer),
    })),
  };
}
