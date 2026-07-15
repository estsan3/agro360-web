/** Archivo adjunto mock (base64 local hasta backend de storage). */
export interface ArchivoAdjunto {
  nombre: string;
  tipo: string;
  dataUrl: string;
}

export interface CamionTransportista {
  id: string;
  transportistaId: string;
  activo: boolean;
  eliminado: boolean;
  dominio: string;
  marca: string;
  modelo: string;
  tipo: string;
  nroChasis: string;
  nroMotor: string;
  fotoTarjetaVerde?: ArchivoAdjunto;
}

export interface ChoferTransportista {
  id: string;
  transportistaId: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  apellido: string;
  documento: string;
  direccion: string;
  telefono: string;
  edad: number;
  fechaNacimiento: string;
  licenciaTipo: string;
  licenciaVencimiento: string;
  camionId: string | null;
  fotoLicencia?: ArchivoAdjunto;
  fotoDniFrente?: ArchivoAdjunto;
  fotoDniDorso?: ArchivoAdjunto;
}

export interface Transportista {
  id: string;
  activo: boolean;
  eliminado: boolean;
  nombreFantasia: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
  email: string;
  telefono: string;
  paginaWeb: string;
}

export interface TransportistaDetalle extends Transportista {
  choferes: ChoferTransportista[];
  camiones: CamionTransportista[];
}

export type FiltroActivo = 'activos' | 'inactivos' | 'todos';

export type DrawerEntidad = 'empresa' | 'chofer' | 'camion';

export type DrawerModo = 'crear' | 'editar' | 'ver';
