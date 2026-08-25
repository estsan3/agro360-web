import type {
  ConfirmChecklistItem,
  ConfirmDialogService,
} from '../../../core/services/confirm-dialog.service';
import type { CartaPorteDto } from './despacho.dto';
import type { Despacho, Viaje } from './despacho.model';

const CPE_OK = new Set(['procesada', 'autorizada']);

export function itemsChecklistIniciar(
  despacho: Despacho,
  viajes: Viaje[],
  cartas: CartaPorteDto[] = [],
): ConfirmChecklistItem[] {
  const conChofer = viajes.every(
    (viaje) => !!viaje.choferId && !!viaje.dominio && viaje.dominio !== '-',
  );
  const conAcoplado = viajes.every((viaje) => !!viaje.cpeDominioAcoplado);
  const items: ConfirmChecklistItem[] = [
    {
      id: 'unidad',
      label: 'Chofer y dominio asignados',
      hint: conChofer ? 'Unidad lista para salir.' : 'Falta chofer o patente en al menos un viaje.',
      ok: conChofer,
      required: true,
    },
    {
      id: 'acoplado',
      label: 'Acoplado / segundo dominio',
      hint: conAcoplado ? 'Patente del semi cargada.' : 'Opcional si el viaje va sin acoplado.',
      required: false,
      checked: conAcoplado,
    },
  ];

  if (despacho.cpeHabilitada) {
    const cpeOk = viajes.every((viaje) =>
      cartas.some((carta) => carta.viaje_id === viaje.id && CPE_OK.has(carta.estado)),
    );
    items.push({
      id: 'cpe',
      label: 'Carta de porte emitida',
      hint: cpeOk ? 'CPE autorizada o procesada.' : 'Emití la CPE de cada viaje antes de iniciar.',
      ok: cpeOk,
      required: true,
    });
  }

  items.push(
    {
      id: 'gasoil',
      label: 'Ticket / control de gasoil',
      hint: 'Confirmá que el chofer tiene combustible o vale de gasoil.',
      required: true,
    },
    {
      id: 'efectivo',
      label: 'Entrega de efectivo',
      hint: 'Confirmá viático o efectivo de viaje, si aplica al flujo.',
      required: true,
    },
  );
  return items;
}

export const CHECKLIST_INICIO_OK = {
  checklistGasoil: true,
  checklistEfectivo: true,
} as const;

export function confirmarInicioViaje(
  confirm: ConfirmDialogService,
  despacho: Despacho,
  viajes: Viaje[],
  cartas: CartaPorteDto[],
  mensaje: string,
): Promise<boolean> {
  const varios = viajes.length > 1;
  return confirm.abrir({
    titulo: varios ? 'Iniciar viajes' : 'Iniciar viaje',
    mensaje,
    textoConfirmar: varios ? 'Iniciar viajes' : 'Iniciar viaje',
    items: itemsChecklistIniciar(despacho, viajes, cartas),
  });
}
