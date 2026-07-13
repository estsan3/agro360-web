import { ConversacionDto, MensajeDto } from './mensaje.dto';
import { Conversacion, EstadoViajeChat, Mensaje } from './mensaje.model';

const ESTADO_CHAT_MAP: Record<ConversacionDto['estado_viaje'], EstadoViajeChat> = {
  pendiente: 'pendiente',
  en_viaje: 'en-transito',
  retrasado: 'detenido',
  completado: 'entregado',
};

export function toMensaje(dto: MensajeDto): Mensaje {
  return {
    id: dto.id,
    autor: dto.autor,
    texto: dto.texto,
    fecha: new Date(dto.fecha),
    leido: dto.leido,
  };
}

export function toConversacion(dto: ConversacionDto): Conversacion {
  return {
    id: dto.id,
    chofer: dto.chofer,
    dominio: dto.dominio,
    viajeId: dto.viaje_id,
    origen: dto.origen,
    destino: dto.destino,
    estadoViaje: ESTADO_CHAT_MAP[dto.estado_viaje],
    enLinea: dto.en_linea,
    noLeidos: dto.no_leidos,
    mensajes: dto.mensajes.map(toMensaje),
  };
}
