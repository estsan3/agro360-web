export interface Mensaje {
  id: string;
  autor: 'admin' | 'chofer';
  texto: string;
  fecha: Date;
}

export interface Conversacion {
  id: string;
  chofer: string;
  dominio: string;
  noLeidos: number;
  mensajes: Mensaje[];
}
