import {
  CampoProductorDto,
  ProductorDetalleDto,
  ProductorDto,
  PuntoEntradaDto,
  ResponsableProductorDto,
} from './productores.dto';
import {
  CampoProductor,
  Productor,
  ProductorDetalle,
  PuntoEntrada,
  ResponsableProductor,
} from './productores.model';

function mapPuntoEntrada(dto: PuntoEntradaDto): PuntoEntrada {
  return {
    id: dto.id,
    campoId: dto.campo_id,
    activo: dto.activo,
    eliminado: dto.eliminado,
    nombre: dto.nombre,
    orden: dto.orden,
    latitud: dto.latitud,
    longitud: dto.longitud,
    observacion: dto.observacion,
  };
}

function mapCampo(dto: CampoProductorDto): CampoProductor {
  return {
    id: dto.id,
    productorId: dto.productor_id,
    activo: dto.activo,
    eliminado: dto.eliminado,
    nombre: dto.nombre,
    codigo: dto.codigo,
    superficieHa: dto.superficie_ha,
    localidad: dto.localidad,
    provincia: dto.provincia,
    partido: dto.partido,
    direccion: dto.direccion,
    latitud: dto.latitud,
    longitud: dto.longitud,
    contactoNombre: dto.contacto_nombre,
    contactoTelefono: dto.contacto_telefono,
    puntosEntrada: dto.puntos_entrada.map(mapPuntoEntrada),
  };
}

function mapResponsable(dto: ResponsableProductorDto): ResponsableProductor {
  return {
    id: dto.id,
    productorId: dto.productor_id,
    activo: dto.activo,
    eliminado: dto.eliminado,
    nombre: dto.nombre,
    apellido: dto.apellido,
    telefono: dto.telefono,
    documento: dto.documento,
  };
}

export function mapProductor(dto: ProductorDto): Productor {
  return {
    id: dto.id,
    activo: dto.activo,
    eliminado: dto.eliminado,
    nombreFantasia: dto.nombre_fantasia,
    razonSocial: dto.razon_social,
    cuit: dto.cuit,
    direccionFiscal: dto.direccion_fiscal,
    email: dto.email,
    telefono: dto.telefono,
    vendedorId: dto.vendedor_id,
    notas: dto.notas,
  };
}

export function mapProductorDetalle(dto: ProductorDetalleDto): ProductorDetalle {
  return {
    ...mapProductor(dto),
    responsables: dto.responsables.map(mapResponsable),
    campos: dto.campos.map(mapCampo),
  };
}

export function toProductorDto(productor: Partial<Productor>): Record<string, unknown> {
  return {
    nombre_fantasia: productor.nombreFantasia ?? '',
    razon_social: productor.razonSocial ?? '',
    cuit: productor.cuit ?? '',
    direccion_fiscal: productor.direccionFiscal ?? '',
    email: productor.email ?? '',
    telefono: productor.telefono ?? '',
    vendedor_id: productor.vendedorId ?? '',
    notas: productor.notas ?? '',
  };
}

export function toResponsableDto(
  responsable: Partial<ResponsableProductor>,
): Record<string, unknown> {
  return {
    nombre: responsable.nombre ?? '',
    apellido: responsable.apellido ?? '',
    telefono: responsable.telefono ?? '',
    documento: responsable.documento ?? '',
  };
}

export function toCampoDto(campo: Partial<CampoProductor>): Record<string, unknown> {
  return {
    nombre: campo.nombre ?? '',
    codigo: campo.codigo ?? '',
    superficie_ha: campo.superficieHa ?? 0,
    localidad: campo.localidad ?? '',
    provincia: campo.provincia ?? '',
    partido: campo.partido ?? '',
    direccion: campo.direccion ?? '',
    latitud: campo.latitud ?? 0,
    longitud: campo.longitud ?? 0,
    contacto_nombre: campo.contactoNombre ?? '',
    contacto_telefono: campo.contactoTelefono ?? '',
    puntos_entrada: (campo.puntosEntrada ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      orden: p.orden,
      latitud: p.latitud,
      longitud: p.longitud,
      observacion: p.observacion,
    })),
  };
}
