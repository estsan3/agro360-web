import { ConversacionDto, MensajeDto } from './mensaje.dto';
import { Conversacion, Mensaje } from './mensaje.model';

export function toMensaje(dto: MensajeDto): Mensaje {
  return {
    id: dto.id,
    autor: dto.autor,
    texto: dto.texto,
    fecha: new Date(dto.fecha),
  };
}

export function toConversacion(dto: ConversacionDto): Conversacion {
  return {
    id: dto.id,
    chofer: dto.chofer,
    dominio: dto.dominio,
    noLeidos: dto.no_leidos,
    mensajes: dto.mensajes.map(toMensaje),
  };
}
