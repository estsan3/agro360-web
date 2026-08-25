export interface EntradaListaEsperaDto {
  id: string;
  empresa_id: string;
  transportista_id: string;
  camion_id: string;
  chofer_id: string;
  transportista_nombre: string;
  chofer_nombre: string;
  dominio: string;
  capacidad_tn: number | null;
  tipo_unidad: string;
  estado: string;
  anotado_en: string;
  viaje_ofertado_id: string | null;
  ofertado_en: string | null;
  viaje_asignado_id: string | null;
}

export interface EntradaListaEspera {
  id: string;
  empresaId: string;
  transportistaId: string;
  camionId: string;
  choferId: string;
  transportistaNombre: string;
  choferNombre: string;
  dominio: string;
  capacidadTn: number | null;
  tipoUnidad: string;
  estado: string;
  anotadoEn: string;
  viajeOfertadoId: string | null;
  ofertadoEn: string | null;
  viajeAsignadoId: string | null;
}

export function mapEntradaLista(dto: EntradaListaEsperaDto): EntradaListaEspera {
  return {
    id: dto.id,
    empresaId: dto.empresa_id,
    transportistaId: dto.transportista_id,
    camionId: dto.camion_id,
    choferId: dto.chofer_id,
    transportistaNombre: dto.transportista_nombre,
    choferNombre: dto.chofer_nombre,
    dominio: dto.dominio,
    capacidadTn: dto.capacidad_tn,
    tipoUnidad: dto.tipo_unidad,
    estado: dto.estado,
    anotadoEn: dto.anotado_en,
    viajeOfertadoId: dto.viaje_ofertado_id,
    ofertadoEn: dto.ofertado_en,
    viajeAsignadoId: dto.viaje_asignado_id,
  };
}
