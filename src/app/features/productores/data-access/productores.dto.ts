export interface PuntoEntradaDto {
  id: string;
  campo_id: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  orden: number;
  latitud: number;
  longitud: number;
  observacion: string;
}

export interface CampoProductorDto {
  id: string;
  productor_id: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  codigo: string;
  superficie_ha: number;
  localidad: string;
  provincia: string;
  partido: string;
  direccion: string;
  latitud: number;
  longitud: number;
  contacto_nombre: string;
  contacto_telefono: string;
  puntos_entrada: PuntoEntradaDto[];
}

export interface ResponsableProductorDto {
  id: string;
  productor_id: string;
  activo: boolean;
  eliminado: boolean;
  nombre: string;
  apellido: string;
  telefono: string;
  documento: string;
}

export interface ProductorDto {
  id: string;
  activo: boolean;
  eliminado: boolean;
  nombre_fantasia: string;
  razon_social: string;
  cuit: string;
  direccion_fiscal: string;
  email: string;
  telefono: string;
  vendedor_id: string;
  notas: string;
}

export interface ProductorDetalleDto extends ProductorDto {
  responsables: ResponsableProductorDto[];
  campos: CampoProductorDto[];
}

export interface CatalogoProductorDto {
  id: string;
  nombre: string;
  campos: {
    id: string;
    nombre: string;
    puntos_entrada: {
      id: string;
      nombre: string;
      orden: number;
      latitud: number;
      longitud: number;
      observacion: string;
    }[];
  }[];
}
