import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, from, switchMap, toArray } from 'rxjs';
import { NotificationStore } from '../../../notifications/state/notification.store';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { SelectInput, SelectOption } from '../../../shared/ui/select/select-input';
import { StateWrapper } from '../../../shared/ui/state-wrapper/state-wrapper';
import { TextInput } from '../../../shared/ui/input/text-input';
import { Toast } from '../../../shared/ui/toast/toast';
import { CartasPorteService } from '../../cartas-porte/data-access/cartas-porte.service';
import {
  CuandoDespacho,
  Despacho,
  EstadoDespacho,
  EstadoViaje,
  NuevoDespacho,
  PuntoEntradaCatalogo,
} from '../data-access/despacho.model';
import { DespachoService } from '../data-access/despacho.service';
import { DespachoStore } from '../data-access/despacho.store';
import {
  ARCA_PROVINCIAS,
  CANAL_OPTIONS,
  CanalAsignacion,
  CODIGO_GRANO_AFIP,
  localidadesDeProvincia,
  razonSocialCuit,
  TabDespacho,
  TABS_DESPACHO,
} from './arca-catalogo';

function puntosDeCampo(campo: {
  puntosEntrada?: PuntoEntradaCatalogo[];
  puntos_entrada?: PuntoEntradaCatalogo[];
}): PuntoEntradaCatalogo[] {
  return campo.puntosEntrada ?? campo.puntos_entrada ?? [];
}

type ViajeGroup = FormGroup<{
  id: FormControl<string>;
  transportistaId: FormControl<string>;
  choferId: FormControl<string>;
  camionId: FormControl<string>;
  dominio: FormControl<string>;
  acoplado: FormControl<string>;
  codigoTurno: FormControl<string>;
  canal: FormControl<CanalAsignacion>;
  destino: FormControl<string>;
  toneladas: FormControl<string>;
  estado: FormControl<EstadoViaje>;
}>;

/**
 * Pantalla Crear / editar pedido (despacho): tabs por dominio
 * (Origen → … → Transporte → Transportistas). Ver docs/crear-despacho.md.
 */
@Component({
  selector: 'app-crear-despacho-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    Badge,
    Button,
    Icon,
    SelectInput,
    StateWrapper,
    TextInput,
    Toast,
  ],
  templateUrl: './crear-despacho-page.html',
  styleUrl: './crear-despacho-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearDespachoPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(DespachoStore);
  private readonly api = inject(DespachoService);
  private readonly cartasApi = inject(CartasPorteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationStore);

  protected readonly catalogos = this.store.catalogos;
  protected readonly guardando = signal(false);
  protected readonly mensajeExito = signal('');
  // Une las entradas conocidas con la del borrador cargado (si difiere)
  private readonly entradaExtra = signal<string | null>(null);
  protected readonly entradaOptions = computed<SelectOption[]>(() => {
    const productor = (this.catalogos().data?.productores ?? []).find(
      (p) => p.id === this.productorSeleccionado(),
    );
    const campo = productor?.campos.find((c) => c.id === this.campoSeleccionado());
    const opciones = puntosDeCampo(campo ?? {})
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((p) => ({
        value: p.id,
        label: `${p.nombre} (Lat: ${p.latitud}, Lng: ${p.longitud})`,
      }));
    const extra = this.entradaExtra();
    if (extra && !opciones.some((opcion) => opcion.value === extra)) {
      return [{ value: extra, label: extra }, ...opciones];
    }
    return opciones;
  });

  /** Modo edición de borrador (?borrador=<id>) */
  protected readonly editando = signal<{ id: string; nombre: string } | null>(null);
  /** Modo corrección para regenerar intención CPE (?editar=&carta=&viaje=) */
  protected readonly modoIntencion = signal<{
    despachoId: string;
    cartaId: string;
    viajeId: string;
    nombre: string;
  } | null>(null);
  private precargado = false;

  protected readonly tab = signal<TabDespacho>('origen');
  protected readonly tabs = TABS_DESPACHO;
  protected readonly arcaProvincias = ARCA_PROVINCIAS;
  protected readonly canalOptions = CANAL_OPTIONS;
  /** Cantidad de viajes que el agente debe buscar / cubrir. */
  protected readonly viajesRequeridos = signal(30);
  protected readonly buscandoAgente = signal(false);

  protected readonly form = this.fb.group({
    nombre: ['', Validators.required],
    productorId: ['', Validators.required],
    campoId: [{ value: '', disabled: true }, Validators.required],
    origen: ['', Validators.required],
    entradaCampo: ['', Validators.required],
    material: ['', Validators.required],
    administradorId: ['', Validators.required],
    vendedorId: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaLlegadaEstimada: [''],
    observaciones: [''],
    dadorViaje: ['FEDEA', Validators.required],
    dadorOtro: [''],
    distanciaKm: [null as number | null],
    tarifaPorTn: [null as number | null],
    tarifaLlena: [false],
    cuando: ['ahora' as CuandoDespacho, Validators.required],
    cuandoFecha: [''],
    cpeHoraPartidaDefault: [''],
    /** Destino/tn del pedido (heredan los cupos). */
    destinoOferta: [''],
    toneladasOferta: [null as number | null],
    toneladasPedido: [null as number | null],
    // CPE / ARCA
    cpeHabilitada: [false],
    cpeTipo: ['74'],
    cpeSucursal: [null as number | null],
    cpeCosecha: [2526 as number | null],
    cpeCuitSolicitante: [''],
    /** Códigos ARCA como string para app-select-input; se parsean al guardar. */
    cpeOrigenCodProvincia: [''],
    cpeOrigenCodLocalidad: [''],
    cpeOrigenPlanta: [null as number | null],
    cpeNroRenspa: [''],
    cpeCorrespondeRetiroProductor: [true],
    cpeEsSolicitanteCampo: [true],
    cpeDestinoCuit: [''],
    cpeDestinoEsCampo: [false],
    cpeDestinoCodProvincia: [''],
    cpeDestinoCodLocalidad: [''],
    cpeDestinoPlanta: [null as number | null],
    cpePesoTaraKgDefault: [null as number | null],
    cpeMercaderiaFumigada: [false],
    cpeCuitPagadorFlete: [''],
    cpeCuitIntermediarioFlete: [''],
    cpeCuitRemitenteComercialVp: [''],
    cpeCuitRemitenteComercialVs: [''],
    cpeCuitRemitenteComercialVs2: [''],
    cpeCuitRemitenteComercialProductor: [''],
    cpeCuitMercadoATermino: [''],
    cpeCuitCorredorVp: [''],
    cpeCuitCorredorVs: [''],
    cpeCuitRepresentanteEntregador: [''],
    cpeCuitRepresentanteRecibidor: [''],
  });

  protected readonly dadorOptions: SelectOption[] = [
    { value: 'FEDEA', label: 'FEDEA' },
    { value: 'COFCO', label: 'COFCO' },
    { value: 'Otro', label: 'Otro' },
  ];

  protected readonly cuandoOptions: SelectOption[] = [
    { value: 'ahora', label: 'Ahora' },
    { value: 'manana', label: 'Mañana' },
    { value: 'fecha', label: 'Fecha específica' },
  ];

  protected readonly cpeTipoOptions: SelectOption[] = [
    { value: '74', label: '74 — Automotor' },
    { value: '274', label: '274 — Automotor flete corto' },
  ];

  protected readonly tarifaResuelta = signal<number | null>(null);

  // --- Viajes: FormArray editable (detalle del master) ---
  protected readonly viajes = this.fb.array<ViajeGroup>([]);
  protected readonly seleccionados = signal<Set<number>>(new Set());

  private readonly viajesValue = toSignal(this.viajes.valueChanges, {
    initialValue: [] as { toneladas?: string }[],
  });
  protected readonly totalViajes = computed(() => this.viajesValue().length);
  protected readonly totalToneladas = computed(() =>
    this.viajesValue().reduce((sum, viaje) => sum + (Number(viaje.toneladas) || 0), 0),
  );

  // --- Opciones de selects derivadas del catálogo ---
  protected readonly productorOptions = computed<SelectOption[]>(() =>
    (this.catalogos().data?.productores ?? []).map((p) => ({ value: p.id, label: p.nombre })),
  );
  protected readonly administradorOptions = computed<SelectOption[]>(() =>
    (this.catalogos().data?.administradores ?? []).map((a) => ({ value: a.id, label: a.nombre })),
  );
  protected readonly vendedorOptions = computed<SelectOption[]>(() =>
    (this.catalogos().data?.vendedores ?? []).map((v) => ({ value: v.id, label: v.nombre })),
  );
  protected readonly materialOptions = computed<SelectOption[]>(() =>
    (this.catalogos().data?.materiales ?? []).map((m) => {
      const cod = CODIGO_GRANO_AFIP[m];
      return { value: m, label: cod ? `${m} (AFIP ${cod})` : m };
    }),
  );

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly localidadesOrigenOptions = computed(() =>
    localidadesDeProvincia(this.numONull(this.formValue()?.cpeOrigenCodProvincia)),
  );
  protected readonly localidadesDestinoOptions = computed(() =>
    localidadesDeProvincia(this.numONull(this.formValue()?.cpeDestinoCodProvincia)),
  );

  private readonly productorSeleccionado = toSignal(this.form.controls.productorId.valueChanges, {
    initialValue: '',
  });
  private readonly campoSeleccionado = toSignal(this.form.controls.campoId.valueChanges, {
    initialValue: '',
  });
  protected readonly campoOptions = computed<SelectOption[]>(() => {
    const productor = (this.catalogos().data?.productores ?? []).find(
      (p) => p.id === this.productorSeleccionado(),
    );
    return (productor?.campos ?? []).map((c) => ({ value: c.id, label: c.nombre }));
  });

  constructor() {
    this.store.cargarCatalogos();
    this.store.cargarDespachos();

    this.form.controls.productorId.valueChanges.subscribe(() => {
      const campo = this.form.controls.campoId;
      campo.reset('');
      campo.enable();
      this.form.controls.entradaCampo.reset('');
    });

    this.form.controls.campoId.valueChanges.subscribe(() => {
      this.form.controls.entradaCampo.reset('');
    });

    this.form.controls.tarifaLlena.valueChanges.subscribe((llena) => {
      const ctrl = this.form.controls.tarifaPorTn;
      if (llena) {
        ctrl.disable({ emitEvent: false });
        this.actualizarTarifaLlena();
      } else {
        ctrl.enable({ emitEvent: false });
        this.tarifaResuelta.set(null);
      }
    });

    this.form.controls.distanciaKm.valueChanges.subscribe(() => {
      if (this.form.controls.tarifaLlena.value) {
        this.actualizarTarifaLlena();
      }
    });

    this.form.controls.cpeOrigenCodProvincia.valueChanges.subscribe(() => {
      this.form.controls.cpeOrigenCodLocalidad.setValue('');
    });
    this.form.controls.cpeDestinoCodProvincia.valueChanges.subscribe(() => {
      this.form.controls.cpeDestinoCodLocalidad.setValue('');
    });

    // Precarga del borrador a editar cuando llegan despachos + catálogos
    effect(() => {
      const borradorId = this.route.snapshot.queryParamMap.get('borrador');
      const despachos = this.store.despachos().data;
      const catalogos = this.catalogos().data;
      if (this.precargado || !borradorId || !despachos || !catalogos) {
        return;
      }
      const despacho = despachos.find((d) => d.id === borradorId);
      if (!despacho) {
        return;
      }
      this.precargado = true;
      this.precargarBorrador(despacho);
    });

    // Precarga desde una intención CPE no procesada
    effect(() => {
      const params = this.route.snapshot.queryParamMap;
      const editarId = params.get('editar');
      const cartaId = params.get('carta');
      const viajeId = params.get('viaje');
      const catalogos = this.catalogos().data;
      if (this.precargado || !editarId || !cartaId || !viajeId || !catalogos) {
        return;
      }
      this.precargado = true;
      this.api.getDespacho(editarId).subscribe({
        next: (despacho) => this.precargarParaIntencion(despacho, cartaId, viajeId),
        error: () => {
          this.precargado = false;
          this.notifications.error(
            'No se pudo cargar el despacho',
            'Revisá que la intención siga asociada a una campaña existente',
          );
          this.router.navigate(['/cartas-porte']);
        },
      });
    });
  }

  private precargarBorrador(despacho: Despacho): void {
    this.editando.set({ id: despacho.id, nombre: despacho.nombre });
    this.aplicarDespachoAlFormulario(
      despacho,
      despacho.viajes.filter(
        (v) => v.estado === 'borrador' || v.estado === 'en-busqueda-transportistas',
      ),
    );
  }

  private precargarParaIntencion(despacho: Despacho, cartaId: string, viajeId: string): void {
    const viaje = despacho.viajes.find((v) => v.id === viajeId);
    if (!viaje) {
      this.notifications.error(
        'Viaje no encontrado',
        'La intención apunta a un viaje que ya no existe en el despacho',
      );
      this.router.navigate(['/cartas-porte']);
      return;
    }
    this.modoIntencion.set({
      despachoId: despacho.id,
      cartaId,
      viajeId,
      nombre: despacho.nombre,
    });
    this.editando.set({ id: despacho.id, nombre: despacho.nombre });
    // Prioriza el viaje de la intención; mantiene el resto para no perder contexto.
    const ordenados = [viaje, ...despacho.viajes.filter((v) => v.id !== viajeId)];
    this.aplicarDespachoAlFormulario(despacho, ordenados);
    this.tab.set('transporte');
  }

  private aplicarDespachoAlFormulario(despacho: Despacho, viajes: Despacho['viajes']): void {
    this.entradaExtra.set(despacho.entradaCampo || null);

    const fecha = (valor: Date) =>
      `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`;

    const dadoresConocidos = ['FEDEA', 'COFCO'];
    const dador = despacho.dadorViaje || 'FEDEA';
    const dadorEsOtro = Boolean(dador && !dadoresConocidos.includes(dador));

    this.form.patchValue(
      {
        nombre: despacho.nombre,
        productorId: despacho.productorId,
        origen: despacho.origen,
        entradaCampo: despacho.entradaCampo,
        material: despacho.material,
        administradorId: despacho.administradorId,
        vendedorId: despacho.vendedorId,
        fechaInicio: fecha(despacho.fechaInicio),
        fechaLlegadaEstimada: despacho.fechaLlegadaEstimada
          ? fecha(despacho.fechaLlegadaEstimada)
          : '',
        dadorViaje: dadorEsOtro ? 'Otro' : dador,
        dadorOtro: dadorEsOtro ? dador : '',
        distanciaKm: despacho.distanciaKm,
        tarifaPorTn: despacho.tarifaPorTn,
        tarifaLlena: despacho.tarifaLlena,
        cuando: despacho.cuando,
        cuandoFecha: despacho.cuandoFecha ?? '',
        destinoOferta: viajes[0]?.destino ?? '',
        toneladasOferta: viajes[0]?.toneladas ?? null,
        toneladasPedido: viajes.reduce((s, v) => s + (v.toneladas || 0), 0) || null,
        observaciones: despacho.observaciones ?? '',
        cpeHabilitada: despacho.cpeHabilitada,
        cpeTipo: String(despacho.cpeTipo ?? 74),
        cpeSucursal: despacho.cpeSucursal,
        cpeCosecha: despacho.cpeCosecha ?? 2526,
        cpeCuitSolicitante: despacho.cpeCuitSolicitante ?? '',
        cpeOrigenCodProvincia: despacho.cpeOrigenCodProvincia
          ? String(despacho.cpeOrigenCodProvincia)
          : '',
        cpeOrigenCodLocalidad: despacho.cpeOrigenCodLocalidad
          ? String(despacho.cpeOrigenCodLocalidad)
          : '',
        cpeOrigenPlanta: despacho.cpeOrigenPlanta,
        cpeCorrespondeRetiroProductor: despacho.cpeCorrespondeRetiroProductor,
        cpeEsSolicitanteCampo: despacho.cpeEsSolicitanteCampo,
        cpeDestinoCuit: despacho.cpeDestinoCuit ?? '',
        cpeDestinoEsCampo: despacho.cpeDestinoEsCampo,
        cpeDestinoCodProvincia: despacho.cpeDestinoCodProvincia
          ? String(despacho.cpeDestinoCodProvincia)
          : '',
        cpeDestinoCodLocalidad: despacho.cpeDestinoCodLocalidad
          ? String(despacho.cpeDestinoCodLocalidad)
          : '',
        cpeDestinoPlanta: despacho.cpeDestinoPlanta,
        cpePesoTaraKgDefault: despacho.cpePesoTaraKgDefault,
        cpeMercaderiaFumigada: despacho.cpeMercaderiaFumigada,
        cpeCuitPagadorFlete: despacho.cpeCuitPagadorFlete ?? '',
        cpeCuitIntermediarioFlete: despacho.cpeCuitIntermediarioFlete ?? '',
        cpeCuitRemitenteComercialVp: despacho.cpeCuitRemitenteComercialVp ?? '',
        cpeCuitRemitenteComercialVs: despacho.cpeCuitRemitenteComercialVs ?? '',
        cpeCuitMercadoATermino: despacho.cpeCuitMercadoATermino ?? '',
        cpeCuitCorredorVp: despacho.cpeCuitCorredorVp ?? '',
        cpeCuitCorredorVs: despacho.cpeCuitCorredorVs ?? '',
        cpeCuitRepresentanteEntregador: despacho.cpeCuitRepresentanteEntregador ?? '',
        cpeCuitRepresentanteRecibidor: despacho.cpeCuitRepresentanteRecibidor ?? '',
      },
      { emitEvent: false },
    );
    this.form.controls.campoId.enable({ emitEvent: false });
    this.form.controls.campoId.setValue(despacho.campoId, { emitEvent: false });
    if (despacho.tarifaLlena) {
      this.form.controls.tarifaPorTn.disable({ emitEvent: false });
      this.tarifaResuelta.set(despacho.tarifaPorTn);
    }

    const choferes = this.catalogos().data?.choferes ?? [];
    this.viajes.clear();
    for (const viaje of viajes) {
      const choferId =
        viaje.choferId ??
        choferes.find((ch) => ch.dominio === viaje.dominio)?.id ??
        choferes.find((ch) => ch.nombre === viaje.chofer)?.id ??
        '';
      const choferCat = choferes.find((ch) => ch.id === choferId);
      const camionId =
        choferCat?.camionId ??
        choferCat?.camiones.find((c) => c.dominio === viaje.dominio)?.id ??
        choferCat?.camiones[0]?.id ??
        '';
      const camion = choferCat?.camiones.find((c) => c.id === camionId);
      this.viajes.push(
        this.crearFila({
          id: viaje.id,
          transportistaId: choferCat?.transportistaId ?? '',
          choferId,
          camionId,
          dominio: viaje.dominio || camion?.dominio || '',
          acoplado: camion?.acopladoDominio ?? '',
          destino: viaje.destino,
          toneladas: String(viaje.toneladas),
          estado: viaje.estado,
          canal: viaje.choferId ? 'directo' : '',
        }),
      );
    }
  }

  protected fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    return control.touched && control.hasError('required') ? 'Este campo es obligatorio' : '';
  }

  // --- Tabs ---
  protected irTab(id: TabDespacho): void {
    this.tab.set(id);
  }

  protected tabAnterior(): void {
    const i = TABS_DESPACHO.findIndex((t) => t.id === this.tab());
    if (i > 0) {
      this.tab.set(TABS_DESPACHO[i - 1].id);
    }
  }

  protected tabSiguiente(): void {
    const i = TABS_DESPACHO.findIndex((t) => t.id === this.tab());
    if (i >= 0 && i < TABS_DESPACHO.length - 1) {
      this.tab.set(TABS_DESPACHO[i + 1].id);
    }
  }

  protected razonSocial(cuit: string | null | undefined): string {
    return razonSocialCuit(cuit);
  }

  // --- Filas de viajes (carga manual o vía agente) ---
  protected agregarViaje(): void {
    const form = this.form.getRawValue();
    this.viajes.push(
      this.crearFila({
        transportistaId: '',
        choferId: '',
        camionId: '',
        dominio: '',
        acoplado: '',
        destino: form.destinoOferta || '',
        toneladas: form.toneladasOferta ? String(form.toneladasOferta) : '',
        canal: 'directo',
      }),
    );
    this.tab.set('transportistas');
  }

  /**
   * Solicita al agente IA buscar N transportistas y deja N filas en la tabla
   * (canal = ia). La asignación real del agente se conectará después.
   */
  protected buscarConAgente(): void {
    const n = Math.min(Math.max(1, Number(this.viajesRequeridos()) || 1), 200);
    const form = this.form.getRawValue();
    if (!(form.destinoOferta || '').trim()) {
      this.notifications.warning(
        'Destino requerido',
        'Completá el destino del pedido (tab Destino) antes de buscar transportistas',
      );
      this.tab.set('destino');
      return;
    }
    this.buscandoAgente.set(true);
    // Placeholder: genera N viajes en búsqueda con canal IA.
    // Cuando exista el agente, aquí se dispara la búsqueda y se rellenan chofer/dominio.
    this.viajes.clear();
    for (let i = 0; i < n; i++) {
      this.viajes.push(
        this.crearFila({
          transportistaId: '',
          choferId: '',
          camionId: '',
          dominio: '',
          acoplado: '',
          destino: form.destinoOferta || '',
          toneladas: form.toneladasOferta ? String(form.toneladasOferta) : '',
          canal: 'ia',
          estado: 'en-busqueda-transportistas',
        }),
      );
    }
    this.seleccionados.set(new Set());
    this.buscandoAgente.set(false);
    this.tab.set('transportistas');
    this.notifications.success(
      'Búsqueda con agente iniciada',
      `${n} viaje(s) en la tabla — el agente buscará transportistas (asignación automática pendiente de integrar)`,
    );
  }

  protected duplicarViaje(index: number): void {
    const original = this.viajes.at(index).getRawValue();
    this.viajes.insert(index + 1, this.crearFila(original));
    this.seleccionados.set(new Set());
  }

  protected eliminarViaje(index: number): void {
    this.viajes.removeAt(index);
    this.seleccionados.set(new Set());
  }

  protected transportistaOptions(): SelectOption[] {
    return (this.catalogos().data?.transportistas ?? []).map((t) => ({
      value: t.id,
      label: t.nombre,
    }));
  }

  protected choferesDeTransportista(transportistaId: string) {
    const todos = this.catalogos().data?.choferes ?? [];
    if (!transportistaId) {
      return todos;
    }
    return todos.filter((ch) => ch.transportistaId === transportistaId);
  }

  protected camionesDeFila(transportistaId: string, choferId: string) {
    const chofer = this.catalogos().data?.choferes.find((ch) => ch.id === choferId);
    if (chofer?.camiones?.length) {
      return chofer.camiones.filter(
        (c) => !['acoplado', 'semi', 'semirremolque', 'trailer'].includes(c.tipo),
      );
    }
    const t = this.catalogos().data?.transportistas.find((x) => x.id === transportistaId);
    return (t?.camiones ?? []).filter(
      (c) => !['acoplado', 'semi', 'semirremolque', 'trailer'].includes(c.tipo),
    );
  }

  protected transportistaElegido(index: number, event: Event): void {
    const transportistaId = (event.target as HTMLSelectElement).value;
    const grupo = this.viajes.at(index);
    grupo.patchValue({
      transportistaId,
      choferId: '',
      camionId: '',
      dominio: '',
      acoplado: '',
      canal: transportistaId ? 'directo' : grupo.controls.canal.value,
    });
  }

  protected choferElegido(index: number, event: Event): void {
    const choferId = (event.target as HTMLSelectElement).value;
    const grupo = this.viajes.at(index);
    const chofer = this.catalogos().data?.choferes.find((ch) => ch.id === choferId);
    if (!chofer) {
      grupo.patchValue({ choferId: '', camionId: '', dominio: '', acoplado: '' });
      return;
    }
    const camion =
      chofer.camiones.find((c) => c.id === chofer.camionId) ?? chofer.camiones[0] ?? null;
    grupo.patchValue({
      choferId,
      transportistaId: chofer.transportistaId ?? grupo.controls.transportistaId.value,
      camionId: camion?.id ?? '',
      dominio: (camion?.dominio ?? chofer.dominio ?? '').toUpperCase(),
      acoplado: (camion?.acopladoDominio ?? '').toUpperCase(),
      canal: grupo.controls.canal.value || 'directo',
    });
  }

  protected camionElegido(index: number, event: Event): void {
    const camionId = (event.target as HTMLSelectElement).value;
    const grupo = this.viajes.at(index);
    const camiones = this.camionesDeFila(
      grupo.controls.transportistaId.value,
      grupo.controls.choferId.value,
    );
    const camion = camiones.find((c) => c.id === camionId);
    grupo.patchValue({
      camionId,
      dominio: (camion?.dominio ?? '').toUpperCase(),
      acoplado: (camion?.acopladoDominio ?? '').toUpperCase(),
    });
  }

  protected nombreTransportista(choferId: string): string {
    const chofer = this.catalogos().data?.choferes.find((ch) => ch.id === choferId);
    if (!chofer?.transportistaId) {
      return '';
    }
    return (
      this.catalogos().data?.transportistas.find((t) => t.id === chofer.transportistaId)?.nombre ??
      ''
    );
  }

  // --- Selección múltiple ---
  protected toggleSeleccion(index: number): void {
    this.seleccionados.update((set) => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  protected todosSeleccionados(): boolean {
    return this.viajes.length > 0 && this.seleccionados().size === this.viajes.length;
  }

  protected toggleTodos(): void {
    this.seleccionados.set(
      this.todosSeleccionados()
        ? new Set()
        : new Set(this.viajes.controls.map((_, index) => index)),
    );
  }

  // --- Generación real de documentos (requiere viaje ya persistido) ---
  protected accionMasiva(accion: 'carta de porte' | 'ticket de gasoil'): void {
    const indices = [...this.seleccionados()];
    if (indices.length === 0) {
      this.notifications.warning('Sin viajes seleccionados', 'Marcá al menos un viaje');
      return;
    }
    const despachoId = this.editando()?.id;
    if (!despachoId) {
      this.notifications.warning(
        'Guardá el despacho',
        'Primero guardá el borrador para generar documentos',
      );
      return;
    }
    const viajeIds = indices
      .map((i) => this.viajes.at(i)?.controls.id.value)
      .filter((id): id is string => !!id);
    if (viajeIds.length === 0) {
      this.notifications.warning(
        'Sin viajes guardados',
        'Los viajes seleccionados aún no tienen ID; guardá el despacho',
      );
      return;
    }
    from(viajeIds)
      .pipe(
        concatMap((viajeId) =>
          accion === 'carta de porte'
            ? this.api.emitirCartaPorte(despachoId, viajeId)
            : this.api.generarTicketGasoil(despachoId, viajeId),
        ),
        toArray(),
      )
      .subscribe({
        next: (resultados) =>
          this.notifications.success(
            accion === 'carta de porte'
              ? 'Intenciones de carta de porte creadas'
              : 'Tickets de gasoil generados',
            `${resultados.length} ${resultados.length === 1 ? 'viaje' : 'viajes'}`,
          ),
        error: (err) =>
          this.notifications.error(
            'Error al generar documentos',
            err?.error?.error?.mensaje ?? 'Error de negocio',
          ),
      });
  }

  protected accionFila(index: number, accion: 'carta de porte' | 'ticket de gasoil'): void {
    const despachoId = this.editando()?.id;
    const viajeId = this.viajes.at(index)?.controls.id.value;
    if (!despachoId || !viajeId) {
      this.notifications.warning(
        'Guardá el despacho',
        'Primero guardá el borrador para generar documentos',
      );
      return;
    }
    const onError = (err: { error?: { error?: { mensaje?: string } } }) =>
      this.notifications.error(
        'Error al generar documento',
        err?.error?.error?.mensaje ?? 'Error de negocio',
      );
    if (accion === 'carta de porte') {
      this.api.emitirCartaPorte(despachoId, viajeId).subscribe({
        next: (cpe) =>
          this.notifications.success(
            'Intención de CPE creada',
            `Tipo ${cpe.tipo_cpe} · ${cpe.estado}`,
          ),
        error: onError,
      });
      return;
    }
    this.api.generarTicketGasoil(despachoId, viajeId).subscribe({
      next: (adj) => this.notifications.success('Ticket de gasoil generado', adj.nombre),
      error: onError,
    });
  }

  private actualizarTarifaLlena(): void {
    const km = Number(this.form.controls.distanciaKm.value);
    if (!km || km <= 0) {
      this.tarifaResuelta.set(null);
      return;
    }
    this.api.resolverTarifaNacional(km).subscribe({
      next: (r) => {
        this.tarifaResuelta.set(r.precioPorTn);
        this.form.controls.tarifaPorTn.setValue(r.precioPorTn, { emitEvent: false });
      },
      error: () => this.tarifaResuelta.set(null),
    });
  }

  private armarPayload(
    estado: EstadoDespacho,
    exigirChofer: boolean,
    opciones: { exigirViajes?: boolean } = {},
  ): NuevoDespacho | null {
    const exigirViajes = opciones.exigirViajes ?? true;
    this.mensajeExito.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.tab.set(this.primerTabInvalido());
      return null;
    }

    const viajes = this.viajes.controls
      .map((grupo) => grupo.getRawValue())
      .filter((viaje) => viaje.destino && Number(viaje.toneladas) > 0)
      .map((viaje) => ({
        ...(viaje.id ? { id: viaje.id } : {}),
        choferId: viaje.choferId,
        dominio: viaje.dominio.trim().toUpperCase(),
        destino: viaje.destino,
        toneladas: Number(viaje.toneladas),
      }));

    if (exigirViajes && viajes.length === 0) {
      this.notifications.warning(
        'Sin cupos',
        'Agregá al menos un cupo/viaje con destino y toneladas, o publicá en búsqueda',
      );
      this.tab.set('transportistas');
      return null;
    }

    if (exigirChofer && viajes.some((viaje) => !viaje.choferId)) {
      this.notifications.warning('Chofer requerido', 'Asigná un chofer a cada viaje');
      this.tab.set('transportistas');
      return null;
    }

    const form = this.form.getRawValue();
    const dador =
      form.dadorViaje === 'Otro' ? (form.dadorOtro || '').trim() || 'Otro' : form.dadorViaje;

    if (form.tarifaLlena && (!form.distanciaKm || Number(form.distanciaKm) <= 0)) {
      this.notifications.warning('Distancia requerida', 'Indicá km para tarifa llena');
      this.tab.set('transporte');
      return null;
    }
    if (
      !form.tarifaLlena &&
      (!form.tarifaPorTn || Number(form.tarifaPorTn) <= 0) &&
      estado === 'activo'
    ) {
      this.notifications.warning('Tarifa requerida', 'Indicá tarifa o marcá tarifa llena');
      this.tab.set('transporte');
      return null;
    }
    if (form.cuando === 'fecha' && !form.cuandoFecha) {
      this.notifications.warning('Fecha requerida', 'Indicá la fecha de carga');
      this.tab.set('transporte');
      return null;
    }

    if (form.cpeHabilitada) {
      const faltantes: string[] = [];
      if (!form.cpeSucursal) faltantes.push('sucursal');
      if (!form.cpeCosecha) faltantes.push('cosecha');
      if (!form.cpeOrigenCodProvincia) faltantes.push('provincia origen');
      if (!form.cpeOrigenCodLocalidad) faltantes.push('localidad origen');
      if (!form.cpeDestinoCuit?.trim()) faltantes.push('CUIT destinatario');
      if (!form.cpeDestinoCodProvincia) faltantes.push('provincia destino');
      if (!form.cpeDestinoCodLocalidad) faltantes.push('localidad destino');
      if (!form.cpeDestinoEsCampo && !form.cpeDestinoPlanta) faltantes.push('planta destino');
      if (!form.distanciaKm || Number(form.distanciaKm) <= 0) faltantes.push('distancia km');
      if (faltantes.length) {
        this.notifications.warning(
          'Carta de porte incompleta',
          `Completá: ${faltantes.join(', ')}`,
        );
        this.tab.set(
          faltantes.some((f) => f.includes('origen'))
            ? 'origen'
            : faltantes.some((f) => f.includes('destino') || f.includes('CUIT'))
              ? 'destino'
              : faltantes.includes('cosecha')
                ? 'cereal'
                : 'transporte',
        );
        return null;
      }
    }

    const vacioANull = (v: string) => (v?.trim() ? v.trim() : null);

    return {
      nombre: form.nombre,
      productorId: form.productorId,
      campoId: form.campoId,
      origen: form.origen,
      entradaCampo: form.entradaCampo,
      material: form.material,
      administradorId: form.administradorId,
      vendedorId: form.vendedorId,
      fechaInicio: form.fechaInicio,
      fechaLlegadaEstimada: form.fechaLlegadaEstimada,
      observaciones: form.observaciones?.trim() || '',
      estado,
      dadorViaje: dador,
      tarifaLlena: form.tarifaLlena,
      tarifaPorTn: form.tarifaPorTn,
      distanciaKm: form.distanciaKm,
      cuando: form.cuando,
      cuandoFecha: form.cuandoFecha || null,
      cpeHabilitada: form.cpeHabilitada,
      cpeTipo: form.cpeHabilitada ? Number(form.cpeTipo) || 74 : null,
      cpeSucursal: form.cpeHabilitada ? form.cpeSucursal : null,
      cpeCosecha: form.cpeHabilitada ? form.cpeCosecha : null,
      cpeCuitSolicitante: vacioANull(form.cpeCuitSolicitante),
      cpeOrigenCodProvincia: this.numONull(form.cpeOrigenCodProvincia),
      cpeOrigenCodLocalidad: this.numONull(form.cpeOrigenCodLocalidad),
      cpeOrigenPlanta: form.cpeOrigenPlanta,
      cpeCorrespondeRetiroProductor: form.cpeCorrespondeRetiroProductor,
      cpeEsSolicitanteCampo: form.cpeEsSolicitanteCampo,
      cpeDestinoCuit: vacioANull(form.cpeDestinoCuit),
      cpeDestinoEsCampo: form.cpeDestinoEsCampo,
      cpeDestinoCodProvincia: this.numONull(form.cpeDestinoCodProvincia),
      cpeDestinoCodLocalidad: this.numONull(form.cpeDestinoCodLocalidad),
      cpeDestinoPlanta: form.cpeDestinoPlanta,
      cpePesoTaraKgDefault: form.cpePesoTaraKgDefault,
      cpeMercaderiaFumigada: form.cpeMercaderiaFumigada,
      cpeCuitPagadorFlete: vacioANull(form.cpeCuitPagadorFlete),
      cpeCuitIntermediarioFlete: vacioANull(form.cpeCuitIntermediarioFlete),
      cpeCuitRemitenteComercialVp: vacioANull(form.cpeCuitRemitenteComercialVp),
      cpeCuitRemitenteComercialVs: vacioANull(form.cpeCuitRemitenteComercialVs),
      cpeCuitMercadoATermino: vacioANull(form.cpeCuitMercadoATermino),
      cpeCuitCorredorVp: vacioANull(form.cpeCuitCorredorVp),
      cpeCuitCorredorVs: vacioANull(form.cpeCuitCorredorVs),
      cpeCuitRepresentanteEntregador: vacioANull(form.cpeCuitRepresentanteEntregador),
      cpeCuitRepresentanteRecibidor: vacioANull(form.cpeCuitRepresentanteRecibidor),
      viajes,
    };
  }

  protected cancelarEdicionIntencion(): void {
    this.router.navigate(['/cartas-porte']);
  }

  protected guardarYRegenerarIntencion(): void {
    const modo = this.modoIntencion();
    if (!modo) {
      return;
    }
    const payload = this.armarPayload('activo', true);
    if (!payload) {
      return;
    }
    if (!payload.cpeHabilitada) {
      this.notifications.warning(
        'CPE requerida',
        'La intención necesita la carta de porte habilitada',
      );
      this.tab.set('transporte');
      return;
    }
    const viajeVinculado = payload.viajes.find((v) => v.id === modo.viajeId);
    if (!viajeVinculado) {
      this.notifications.warning(
        'Viaje requerido',
        'No se puede regenerar la intención sin el viaje asociado',
      );
      return;
    }

    this.guardando.set(true);
    this.store
      .editarParaIntencionCpe(modo.despachoId, payload)
      .pipe(switchMap(() => this.cartasApi.reintentar(modo.cartaId)))
      .subscribe({
        next: (carta) => {
          this.guardando.set(false);
          this.notifications.success(
            'Intención regenerada',
            `Payload actualizado (intento #${carta.intentos})`,
          );
          this.router.navigate(['/cartas-porte']);
        },
        error: (err) => {
          this.guardando.set(false);
          this.notifications.error(
            'No se pudo regenerar',
            err?.message ?? err?.error?.error?.mensaje ?? 'Error de negocio',
          );
        },
      });
  }

  // --- Guardado ---
  protected guardar(estado: EstadoDespacho): void {
    const payload = this.armarPayload(estado, estado === 'activo', {
      exigirViajes: estado === 'activo',
    });
    if (!payload) {
      return;
    }

    this.guardando.set(true);
    const editando = this.editando();
    const peticion = editando
      ? this.store.actualizarDespacho(editando.id, payload)
      : this.store.crearDespacho(payload);

    peticion.subscribe({
      next: (despacho) => {
        this.guardando.set(false);
        if (editando) {
          if (estado === 'borrador') {
            this.notifications.success('Borrador actualizado', despacho.nombre);
            this.router.navigate(['/borradores']);
          } else {
            this.notifications.success('Despacho enviado', despacho.nombre);
            this.router.navigate(['/gestion-operativa']);
          }
          return;
        }
        if (estado === 'borrador') {
          this.router.navigate(['/borradores']);
          return;
        }
        this.mensajeExito.set(`Pedido "${despacho.nombre}" creado correctamente`);
        this.form.reset({
          dadorViaje: 'FEDEA',
          tarifaLlena: false,
          cuando: 'ahora',
          cpeHabilitada: false,
          cpeTipo: '74',
          cpeCosecha: 2526,
          cpeCorrespondeRetiroProductor: true,
          cpeEsSolicitanteCampo: true,
        });
        this.form.controls.campoId.disable();
        this.form.controls.tarifaPorTn.enable({ emitEvent: false });
        this.tarifaResuelta.set(null);
        this.viajes.clear();
        this.seleccionados.set(new Set());
        this.tab.set('origen');
      },
      error: () => this.guardando.set(false),
    });
  }

  protected buscarTransportistas(): void {
    // No exige filas en la tabla: el viaje se genera en estado "en búsqueda".
    const payload = this.armarPayload('borrador', false, { exigirViajes: false });
    if (!payload) {
      return;
    }
    if (!(payload.dadorViaje || '').trim()) {
      this.notifications.warning('Dador requerido', 'Seleccioná el dador de viaje');
      return;
    }
    if (payload.tarifaLlena) {
      if (!payload.distanciaKm) {
        this.notifications.warning('Distancia requerida', 'Indicá km para tarifa llena');
        return;
      }
    } else if (!payload.tarifaPorTn) {
      this.notifications.warning('Tarifa requerida', 'Indicá tarifa o marcá tarifa llena');
      return;
    }

    const form = this.form.getRawValue();
    const viajeTabla = payload.viajes[0];
    const destino = (viajeTabla?.destino || form.destinoOferta || '').trim();
    const toneladas = viajeTabla?.toneladas || Number(form.toneladasOferta) || 0;
    if (!destino || toneladas <= 0) {
      this.notifications.warning(
        'Pedido incompleto',
        'Indicá destino y toneladas (tab Destino / Cereal) para publicar en búsqueda',
      );
      this.tab.set(!destino ? 'destino' : 'cereal');
      return;
    }

    this.guardando.set(true);
    const editando = this.editando();
    const guardar$ = editando
      ? this.store.actualizarDespacho(editando.id, payload)
      : this.store.crearDespacho(payload);

    guardar$.subscribe({
      next: (despacho) => {
        this.editando.set({ id: despacho.id, nombre: despacho.nombre });
        this.store.buscarTransportistas(despacho.id, { destino, toneladas }).subscribe({
          next: () => {
            this.guardando.set(false);
            this.notifications.success(
              'Búsqueda iniciada',
              'Se generó el viaje y se notificó a las empresas transportistas',
            );
            this.router.navigate(['/borradores']);
          },
          error: () => this.guardando.set(false),
        });
      },
      error: () => this.guardando.set(false),
    });
  }

  protected esBusqueda(estado: EstadoViaje): boolean {
    return estado === 'en-busqueda-transportistas';
  }

  protected etiquetaEstado(estado: EstadoViaje, choferId: string): string {
    if (estado === 'en-busqueda-transportistas') {
      return 'En búsqueda';
    }
    if (estado === 'en-viaje') {
      return 'Iniciado';
    }
    if (estado === 'pendiente' && choferId) {
      return 'Asignado';
    }
    if (choferId) {
      return 'Asignado';
    }
    if (estado === 'borrador') {
      return 'Sin asignar';
    }
    return estado;
  }

  protected varianteEstado(
    estado: EstadoViaje,
    choferId: string,
  ): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
    if (estado === 'en-busqueda-transportistas') {
      return 'info';
    }
    if (choferId || estado === 'pendiente') {
      return 'success';
    }
    if (estado === 'en-viaje') {
      return 'success';
    }
    return 'warning';
  }

  private numONull(v: string | number | null | undefined): number | null {
    if (v === null || v === undefined || v === '') {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private primerTabInvalido(): TabDespacho {
    const c = this.form.controls;
    if (c.productorId.invalid || c.campoId.invalid || c.origen.invalid || c.entradaCampo.invalid) {
      return 'origen';
    }
    if (c.material.invalid) {
      return 'cereal';
    }
    if (
      c.vendedorId.invalid ||
      c.administradorId.invalid ||
      c.nombre.invalid ||
      c.fechaInicio.invalid
    ) {
      return 'vendedor';
    }
    if (c.dadorViaje.invalid || c.cuando.invalid) {
      return 'transporte';
    }
    return 'origen';
  }

  private crearFila(base?: {
    id?: string;
    transportistaId?: string;
    choferId: string;
    camionId?: string;
    dominio: string;
    acoplado?: string;
    codigoTurno?: string;
    canal?: CanalAsignacion;
    destino: string;
    toneladas: string;
    estado?: EstadoViaje;
  }): ViajeGroup {
    return this.fb.group({
      id: [base?.id ?? ''],
      transportistaId: [base?.transportistaId ?? ''],
      choferId: [base?.choferId ?? ''],
      camionId: [base?.camionId ?? ''],
      dominio: [base?.dominio ?? ''],
      acoplado: [base?.acoplado ?? ''],
      codigoTurno: [base?.codigoTurno ?? ''],
      canal: [(base?.canal ?? '') as CanalAsignacion],
      destino: [base?.destino ?? ''],
      toneladas: [base?.toneladas ?? ''],
      estado: [base?.estado ?? ('borrador' as EstadoViaje)],
    }) as ViajeGroup;
  }
}
