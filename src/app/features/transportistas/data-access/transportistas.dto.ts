export interface ArchivoAdjuntoDto {
  nombre: string;
  tipo: string;
  data_url: string;
}

export interface CamionTransportistaDto {
  id: string;
  transportista_id: string;
  activo: boolean;
  eliminado: boolean;
  dominio: string;
  marca: string;
  modelo: string;
  tipo: string;
  nro_chasis: string;
  nro_motor: string;
  foto_tarjeta_verde?: ArchivoAdjuntoDto;
}

export interface ChoferTransportistaDto {
  id: string;
  transportista_id: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  apellido: string;
  documento: string;
  direccion: string;
  telefono: string;
  edad: number;
  fecha_nacimiento: string;
  licencia_tipo: string;
  licencia_vencimiento: string;
  camion_id: string | null;
  foto_licencia?: ArchivoAdjuntoDto;
  foto_dni_frente?: ArchivoAdjuntoDto;
  foto_dni_dorso?: ArchivoAdjuntoDto;
}

export interface TransportistaDto {
  id: string;
  activo: boolean;
  eliminado: boolean;
  nombre_fantasia: string;
  razon_social: string;
  cuit: string;
  direccion: string;
  email: string;
  telefono: string;
  pagina_web: string;
}

export interface TransportistaDetalleDto extends TransportistaDto {
  choferes: ChoferTransportistaDto[];
  camiones: CamionTransportistaDto[];
}
