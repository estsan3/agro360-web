import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Despacho } from './despacho.model';
import { DespachoService } from './despacho.service';
import { DespachoStore } from './despacho.store';

function despachoFake(id: string, estado: 'activo' | 'borrador'): Despacho {
  return {
    id,
    nombre: `Campaña ${id}`,
    productorId: 'p-1',
    campoId: 'c-1',
    origen: 'Rosario',
    entradaCampo: '',
    material: 'Soja',
    administradorId: 'a-1',
    vendedorId: 'v-1',
    fechaInicio: new Date('2026-08-01T00:00:00'),
    fechaLlegadaEstimada: new Date('2026-08-15T00:00:00'),
    estado,
    viajes: [],
  };
}

describe('DespachoStore', () => {
  let store: DespachoStore;
  let apiMock: {
    getDespachos: ReturnType<typeof vi.fn>;
    crearDespacho: ReturnType<typeof vi.fn>;
    eliminarDespacho: ReturnType<typeof vi.fn>;
    getCatalogos: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiMock = {
      getDespachos: vi.fn(),
      crearDespacho: vi.fn(),
      eliminarDespacho: vi.fn(),
      getCatalogos: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: DespachoService, useValue: apiMock }],
    });
    store = TestBed.inject(DespachoStore);
  });

  it('cargarDespachos pasa por loading y llega a success', () => {
    apiMock.getDespachos.mockReturnValue(of([despachoFake('d-1', 'activo')]));

    store.cargarDespachos();

    expect(store.despachos().status).toBe('success');
    expect(store.despachos().data).toHaveLength(1);
  });

  it('cargarDespachos captura el error con su mensaje', () => {
    apiMock.getDespachos.mockReturnValue(throwError(() => new Error('sin conexión')));

    store.cargarDespachos();

    expect(store.despachos().status).toBe('error');
    expect(store.despachos().error).toBe('sin conexión');
  });

  it('separa borradores de activos con computeds', () => {
    apiMock.getDespachos.mockReturnValue(
      of([despachoFake('d-1', 'activo'), despachoFake('d-2', 'borrador')]),
    );

    store.cargarDespachos();

    expect(store.activos()).toHaveLength(1);
    expect(store.borradores()).toHaveLength(1);
    expect(store.borradores()[0].id).toBe('d-2');
  });

  it('crearDespacho agrega el nuevo al estado (una sola vez)', () => {
    apiMock.getDespachos.mockReturnValue(of([despachoFake('d-1', 'activo')]));
    apiMock.crearDespacho.mockReturnValue(of(despachoFake('d-9', 'borrador')));
    store.cargarDespachos();

    store
      .crearDespacho({
        nombre: 'x',
        productorId: 'p-1',
        campoId: 'c-1',
        origen: 'x',
        entradaCampo: '',
        material: 'Soja',
        administradorId: 'a-1',
        vendedorId: 'v-1',
        fechaInicio: '2026-09-01',
        fechaLlegadaEstimada: '',
        estado: 'borrador',
        viajes: [],
      })
      .subscribe();

    expect(store.despachos().data).toHaveLength(2);
    expect(store.borradores().map((d) => d.id)).toEqual(['d-9']);
  });

  it('eliminarDespacho lo quita del estado', () => {
    apiMock.getDespachos.mockReturnValue(
      of([despachoFake('d-1', 'activo'), despachoFake('d-2', 'borrador')]),
    );
    apiMock.eliminarDespacho.mockReturnValue(of(undefined));
    store.cargarDespachos();

    store.eliminarDespacho('d-2').subscribe();

    expect(store.despachos().data?.map((d) => d.id)).toEqual(['d-1']);
  });
});
