export type EstadoViajeChat = 'pendiente' | 'en-transito' | 'detenido' | 'entregado';

export interface Mensaje {
  id: string;
  autor: 'admin' | 'chofer';
  texto: string;
  fecha: Date;
  leido: boolean;
}

export interface Conversacion {
  id: string;
  chofer: string;
  dominio: string;
  viajeId: string;
  origen: string;
  destino: string;
  estadoViaje: EstadoViajeChat;
  enLinea: boolean;
  noLeidos: number;
  mensajes: Mensaje[];
}
