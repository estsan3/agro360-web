import { DespachoDto } from './despacho.dto';
import { toCrearDespachoDto, toDespacho } from './despacho.mapper';
import { NuevoDespacho } from './despacho.model';

const DTO_BASE: DespachoDto = {
  id: 'd-1',
  nombre: 'Campaña Test',
  productor_id: 'p-1',
  campo_id: 'c-1',
  origen: 'Rosario',
  entrada_campo: 'Entrada Norte',
  material: 'Soja',
  administrador_id: 'a-1',
  vendedor_id: 'v-1',
  fecha_inicio: '2026-08-01',
  fecha_llegada_estimada: '2026-08-15',
  estado: 'activo',
  viajes: [
    {
      id: '#1',
      chofer: 'Carlos Ruiz',
      dominio: 'AA123BB',
      destino: 'Puerto',
      toneladas: 28,
      estado: 'en_viaje',
      progreso: 65,
      observaciones: 'Viaje normal',
    },
  ],
};

describe('despacho.mapper', () => {
  describe('toDespacho', () => {
    it('convierte snake_case del backend a camelCase', () => {
      const despacho = toDespacho(DTO_BASE);
      expect(despacho.productorId).toBe('p-1');
      expect(despacho.entradaCampo).toBe('Entrada Norte');
      expect(despacho.administradorId).toBe('a-1');
    });

    it('parsea fechas date-only como locales (sin corrimiento de timezone)', () => {
      const despacho = toDespacho(DTO_BASE);
      // new Date('2026-08-01') asumiría UTC y en GMT-3 caería al 31/07
      expect(despacho.fechaInicio.getDate()).toBe(1);
      expect(despacho.fechaInicio.getMonth()).toBe(7); // agosto
    });

    it('mapea el estado en_viaje del backend a en-viaje', () => {
      const despacho = toDespacho(DTO_BASE);
      expect(despacho.viajes[0].estado).toBe('en-viaje');
    });
  });

  describe('toCrearDespachoDto', () => {
    const nuevo: NuevoDespacho = {
      nombre: 'Campaña Nueva',
      productorId: 'p-2',
      campoId: 'c-3',
      origen: 'Pergamino',
      entradaCampo: '',
      material: 'Maíz',
      administradorId: 'a-1',
      vendedorId: 'v-2',
      fechaInicio: '2026-09-01',
      fechaLlegadaEstimada: '',
      estado: 'borrador',
      viajes: [{ chofer: 'Miguel Torres', dominio: 'EF789GH', destino: 'Rosario', toneladas: 30 }],
    };

    it('convierte camelCase del front a snake_case del backend', () => {
      const dto = toCrearDespachoDto(nuevo);
      expect(dto.productor_id).toBe('p-2');
      expect(dto.fecha_inicio).toBe('2026-09-01');
      expect(dto.viajes[0]).toEqual({
        chofer: 'Miguel Torres',
        dominio: 'EF789GH',
        destino: 'Rosario',
        toneladas: 30,
      });
    });
  });
});
