import { itemsChecklistIniciar } from './checklist-iniciar';
import { Despacho, Viaje } from './despacho.model';

function viaje(parcial: Partial<Viaje> = {}): Viaje {
  return {
    id: 'v-1',
    choferId: 'ch-1',
    chofer: 'Ana',
    dominio: 'AA123BB',
    destino: 'Puerto',
    toneladas: 28,
    estado: 'pendiente',
    progreso: 0,
    observaciones: '',
    cpeCodigoTurno: null,
    cpeDominioAcoplado: null,
    ...parcial,
  };
}

function despacho(parcial: Partial<Despacho> = {}): Despacho {
  return {
    id: 'd-1',
    nombre: 'Campaña',
    productorId: 'p-1',
    campoId: 'c-1',
    origen: 'Rosario',
    entradaCampo: '',
    material: 'Soja',
    administradorId: 'a-1',
    vendedorId: 'v-1',
    fechaInicio: new Date('2026-08-01T00:00:00'),
    fechaLlegadaEstimada: new Date('2026-08-15T00:00:00'),
    observaciones: '',
    estado: 'activo',
    dadorViaje: '',
    tarifaLlena: false,
    tarifaPorTn: null,
    distanciaKm: null,
    cuando: 'ahora',
    cuandoFecha: null,
    cpeHabilitada: false,
    cpeTipo: null,
    cpeSucursal: null,
    cpeCosecha: null,
    cpeCuitSolicitante: null,
    cpeOrigenCodProvincia: null,
    cpeOrigenCodLocalidad: null,
    cpeOrigenPlanta: null,
    cpeNroRenspa: null,
    cpeCodigoTurno: null,
    cpeHoraPartida: null,
    cpeCorrespondeRetiroProductor: true,
    cpeEsSolicitanteCampo: true,
    cpeDestinoCuit: null,
    cpeDestinoEsCampo: false,
    cpeDestinoCodProvincia: null,
    cpeDestinoCodLocalidad: null,
    cpeDestinoPlanta: null,
    cpePesoTaraKgDefault: null,
    cpeMercaderiaFumigada: false,
    cpeCuitPagadorFlete: null,
    cpeCuitIntermediarioFlete: null,
    cpeCuitRemitenteComercialVp: null,
    cpeCuitRemitenteComercialVs: null,
    cpeCuitMercadoATermino: null,
    cpeCuitCorredorVp: null,
    cpeCuitCorredorVs: null,
    cpeCuitRepresentanteEntregador: null,
    cpeCuitRepresentanteRecibidor: null,
    cpeCuitRemitenteComercialVs2: null,
    cpeCuitRemitenteComercialProductor: null,
    viajes: [],
    ...parcial,
  };
}

describe('itemsChecklistIniciar', () => {
  it('exige chofer/dominio y omite CPE si no está habilitada', () => {
    const items = itemsChecklistIniciar(despacho(), [viaje({ choferId: null, dominio: '-' })]);
    expect(items.find((i) => i.id === 'unidad')?.ok).toBe(false);
    expect(items.find((i) => i.id === 'cpe')).toBeUndefined();
    expect(items.some((i) => i.id === 'gasoil' && i.required)).toBe(true);
    expect(items.some((i) => i.id === 'efectivo' && i.required)).toBe(true);
  });

  it('bloquea inicio si la CPE habilitada no está autorizada', () => {
    const items = itemsChecklistIniciar(
      despacho({ cpeHabilitada: true }),
      [viaje()],
      [
        {
          id: 'c-1',
          despacho_id: 'd-1',
          viaje_id: 'v-1',
          tipo_cpe: 74,
          nro_carta_porte: null,
          nro_ctg: null,
          estado: 'pendiente',
          material: 'Soja',
          origen: '',
          destino: '',
          dominio: '',
          toneladas: 28,
          payload_afip: {},
          intentos: 0,
          error_detalle: '',
          tiene_documento: false,
          creada_en: '',
        },
      ],
    );
    expect(items.find((i) => i.id === 'cpe')?.ok).toBe(false);
  });

  it('marca CPE ok cuando está autorizada', () => {
    const items = itemsChecklistIniciar(
      despacho({ cpeHabilitada: true }),
      [viaje()],
      [
        {
          id: 'c-1',
          despacho_id: 'd-1',
          viaje_id: 'v-1',
          tipo_cpe: 74,
          nro_carta_porte: '1',
          nro_ctg: '1',
          estado: 'autorizada',
          material: 'Soja',
          origen: '',
          destino: '',
          dominio: '',
          toneladas: 28,
          payload_afip: {},
          intentos: 1,
          error_detalle: '',
          tiene_documento: true,
          creada_en: '',
        },
      ],
    );
    expect(items.find((i) => i.id === 'cpe')?.ok).toBe(true);
  });
});
