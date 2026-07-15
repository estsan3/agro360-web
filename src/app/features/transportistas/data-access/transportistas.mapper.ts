import {
  ArchivoAdjuntoDto,
  CamionTransportistaDto,
  ChoferTransportistaDto,
  TransportistaDetalleDto,
  TransportistaDto,
} from './transportistas.dto';
import {
  ArchivoAdjunto,
  CamionTransportista,
  ChoferTransportista,
  Transportista,
  TransportistaDetalle,
} from './transportistas.model';

function mapArchivo(dto?: ArchivoAdjuntoDto): ArchivoAdjunto | undefined {
  if (!dto) {
    return undefined;
  }
  return { nombre: dto.nombre, tipo: dto.tipo, dataUrl: dto.data_url };
}

export function toArchivoDto(archivo?: ArchivoAdjunto): ArchivoAdjuntoDto | undefined {
  if (!archivo) {
    return undefined;
  }
  return { nombre: archivo.nombre, tipo: archivo.tipo, data_url: archivo.dataUrl };
}

function mapCamion(dto: CamionTransportistaDto): CamionTransportista {
  return {
    id: dto.id,
    transportistaId: dto.transportista_id,
    activo: dto.activo,
    eliminado: dto.eliminado,
    dominio: dto.dominio,
    marca: dto.marca,
    modelo: dto.modelo,
    tipo: dto.tipo,
    nroChasis: dto.nro_chasis,
    nroMotor: dto.nro_motor,
    fotoTarjetaVerde: mapArchivo(dto.foto_tarjeta_verde),
  };
}

function mapChofer(dto: ChoferTransportistaDto): ChoferTransportista {
  return {
    id: dto.id,
    transportistaId: dto.transportista_id,
    activo: dto.activo,
    eliminado: dto.eliminado,
    nombre: dto.nombre,
    apellido: dto.apellido,
    documento: dto.documento,
    direccion: dto.direccion,
    telefono: dto.telefono,
    edad: dto.edad,
    fechaNacimiento: dto.fecha_nacimiento,
    licenciaTipo: dto.licencia_tipo,
    licenciaVencimiento: dto.licencia_vencimiento,
    camionId: dto.camion_id,
    fotoLicencia: mapArchivo(dto.foto_licencia),
    fotoDniFrente: mapArchivo(dto.foto_dni_frente),
    fotoDniDorso: mapArchivo(dto.foto_dni_dorso),
  };
}

export function mapTransportista(dto: TransportistaDto): Transportista {
  return {
    id: dto.id,
    activo: dto.activo,
    eliminado: dto.eliminado,
    nombreFantasia: dto.nombre_fantasia,
    razonSocial: dto.razon_social,
    cuit: dto.cuit,
    direccion: dto.direccion,
    email: dto.email,
    telefono: dto.telefono,
    paginaWeb: dto.pagina_web,
  };
}

export function mapTransportistaDetalle(dto: TransportistaDetalleDto): TransportistaDetalle {
  return {
    ...mapTransportista(dto),
    choferes: dto.choferes.map(mapChofer),
    camiones: dto.camiones.map(mapCamion),
  };
}

export function toCamionDto(camion: Partial<CamionTransportista>): Record<string, unknown> {
  return {
    dominio: camion.dominio ?? '',
    marca: camion.marca ?? '',
    modelo: camion.modelo ?? '',
    tipo: camion.tipo ?? '',
    nro_chasis: camion.nroChasis ?? '',
    nro_motor: camion.nroMotor ?? '',
    foto_tarjeta_verde: toArchivoDto(camion.fotoTarjetaVerde),
  };
}

export function toChoferDto(chofer: Partial<ChoferTransportista>): Record<string, unknown> {
  return {
    nombre: chofer.nombre ?? '',
    apellido: chofer.apellido ?? '',
    documento: chofer.documento ?? '',
    direccion: chofer.direccion ?? '',
    telefono: chofer.telefono ?? '',
    edad: chofer.edad ?? 0,
    fecha_nacimiento: chofer.fechaNacimiento ?? '',
    licencia_tipo: chofer.licenciaTipo ?? '',
    licencia_vencimiento: chofer.licenciaVencimiento ?? '',
    camion_id: chofer.camionId ?? null,
    foto_licencia: toArchivoDto(chofer.fotoLicencia),
    foto_dni_frente: toArchivoDto(chofer.fotoDniFrente),
    foto_dni_dorso: toArchivoDto(chofer.fotoDniDorso),
  };
}

export function toTransportistaDto(transportista: Partial<Transportista>): Record<string, unknown> {
  return {
    nombre_fantasia: transportista.nombreFantasia ?? '',
    razon_social: transportista.razonSocial ?? '',
    cuit: transportista.cuit ?? '',
    direccion: transportista.direccion ?? '',
    email: transportista.email ?? '',
    telefono: transportista.telefono ?? '',
    pagina_web: transportista.paginaWeb ?? '',
  };
}
