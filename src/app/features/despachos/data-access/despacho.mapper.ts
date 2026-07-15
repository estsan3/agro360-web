import { CatalogosDto, CrearDespachoDto, DespachoDto, ViajeDto } from './despacho.dto';
import {
  CamionCatalogo,
  Catalogos,
  ChoferCatalogo,
  Despacho,
  EstadoViaje,
  NuevoDespacho,
  TransportistaCatalogo,
  Viaje,
} from './despacho.model';

const ESTADO_VIAJE_MAP: Record<ViajeDto['estado'], EstadoViaje> = {
  borrador: 'borrador',
  pendiente: 'pendiente',
  en_viaje: 'en-viaje',
  retrasado: 'retrasado',
  completado: 'completado',
};

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
    estado: dto.estado,
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
    estado: input.estado,
    viajes: input.viajes.map((viaje) => ({
      chofer_id: viaje.choferId,
      ...(viaje.dominio ? { dominio: viaje.dominio.trim().toUpperCase() } : {}),
      destino: viaje.destino,
      toneladas: viaje.toneladas,
    })),
  };
}

export function toCatalogos(dto: CatalogosDto): Catalogos {
  const mapCamion = (c: { id: string; dominio: string; modelo: string }): CamionCatalogo => ({
    id: c.id,
    dominio: c.dominio,
    modelo: c.modelo,
  });
  const mapChofer = (c: CatalogosDto['choferes'][number]): ChoferCatalogo => ({
    id: c.id,
    nombre: c.nombre,
    transportistaId: c.transportista_id ?? null,
    dominio: c.dominio,
    modelo: c.modelo,
    camiones: (c.camiones ?? []).map(mapCamion),
  });
  return {
    productores: dto.productores,
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
