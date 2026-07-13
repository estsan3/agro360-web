/** Contrato del backend Python (snake_case) */
export interface MensajeDto {
  id: string;
  autor: 'admin' | 'chofer';
  texto: string;
  fecha: string; // ISO datetime
}

export interface ConversacionDto {
  id: string;
  chofer: string;
  dominio: string;
  no_leidos: number;
  mensajes: MensajeDto[];
}
