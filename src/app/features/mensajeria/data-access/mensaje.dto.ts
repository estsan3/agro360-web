/** Contrato del backend Python (snake_case) */
export interface MensajeDto {
  id: string;
  autor: 'admin' | 'chofer';
  texto: string;
  fecha: string; // ISO datetime
  leido: boolean;
}

export interface ConversacionDto {
  id: string;
  chofer: string;
  dominio: string;
  viaje_id: string;
  origen: string;
  destino: string;
  estado_viaje: 'pendiente' | 'en_viaje' | 'retrasado' | 'completado';
  en_linea: boolean;
  no_leidos: number;
  mensajes: MensajeDto[];
}
