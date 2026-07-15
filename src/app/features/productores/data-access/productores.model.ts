export interface PuntoEntrada {
  id: string;
  campoId: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  orden: number;
  latitud: number;
  longitud: number;
  observacion: string;
}

export interface CampoProductor {
  id: string;
  productorId: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  codigo: string;
  superficieHa: number;
  localidad: string;
  provincia: string;
  partido: string;
  direccion: string;
  latitud: number;
  longitud: number;
  contactoNombre: string;
  contactoTelefono: string;
  puntosEntrada: PuntoEntrada[];
}

export interface ResponsableProductor {
  id: string;
  productorId: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  apellido: string;
  telefono: string;
  documento: string;
}

export interface Productor {
  id: string;
  activo: boolean;
  eliminado: boolean;
  nombreFantasia: string;
  razonSocial: string;
  cuit: string;
  direccionFiscal: string;
  email: string;
  telefono: string;
  vendedorId: string;
  notas: string;
}

export interface ProductorDetalle extends Productor {
  responsables: ResponsableProductor[];
  campos: CampoProductor[];
}

export interface VendedorOption {
  id: string;
  nombre: string;
}

export type FiltroActivo = 'activos' | 'inactivos' | 'todos';

export type DrawerEntidad = 'productor' | 'responsable' | 'campo';

export type DrawerModo = 'crear' | 'editar' | 'ver';

export interface Coordenadas {
  latitud: number;
  longitud: number;
}
