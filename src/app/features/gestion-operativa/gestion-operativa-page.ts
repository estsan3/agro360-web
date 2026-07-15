import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, from, toArray } from 'rxjs';
import { NotificationStore } from '../../notifications/state/notification.store';
import { KpiCard } from '../../shared/ui/kpi-card/kpi-card';
import { MensajeriaStore } from '../mensajeria/data-access/mensajeria.store';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { TextInput } from '../../shared/ui/input/text-input';
import { Modal } from '../../shared/ui/modal/modal';
import { ProgressBar, ProgressVariant } from '../../shared/ui/progress-bar/progress-bar';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { SelectInput, SelectOption } from '../../shared/ui/select/select-input';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { Despacho, EstadoViaje, Viaje } from '../despachos/data-access/despacho.model';
import { DespachoStore } from '../despachos/data-access/despacho.store';
import { ReportExportService } from '../despachos/reportes-despachos/report-export.service';

function viajesOperativos(viajes: Viaje[]): Viaje[] {
  return viajes.filter((viaje) => viaje.estado !== 'borrador');
}

interface CampaniaVm {
  id: string;
  nombre: string;
  estado: Despacho['estado'];
  productorCampo: string;
  administrador: string;
  vendedor: string;
  totalViajes: number;
  totalToneladas: number;
  enViaje: number;
  completados: number;
  conProblemas: number;
  viajes: Viaje[];
}

// Anchos fijos: todas las tablas expandidas comparten la misma grilla.
// Visual management: Estado y Progreso dominan; Observaciones compacta
// con popup para el texto completo.
// Destino y Observaciones son flexibles: se reparten el sobrante en
// pantallas anchas (sin espacio muerto); el resto con anchos generosos
const VIAJES_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID', width: '96px' },
  { key: 'chofer', label: 'Chofer', width: '140px' },
  { key: 'transporte', label: 'Transporte', width: '190px' },
  { key: 'destino', label: 'Destino' },
  { key: 'toneladas', label: 'Toneladas', align: 'right', width: '110px' },
  { key: 'estado', label: 'Estado', width: '170px' },
  { key: 'progreso', label: 'Progreso', width: '260px' },
  { key: 'observaciones', label: 'Observaciones' },
  { key: 'acciones', label: 'Acciones', align: 'center', width: '140px' },
];

const PROGRESS_VARIANT: Record<EstadoViaje, ProgressVariant> = {
  borrador: 'neutral',
  completado: 'success',
  'en-viaje': 'info',
  retrasado: 'danger',
  pendiente: 'neutral',
};

const ESTADO_LABEL: Record<EstadoViaje, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  'en-viaje': 'En viaje',
  retrasado: 'Retrasado',
  completado: 'Completado',
};

interface CampaniaDetalleVm {
  id: string;
  nombre: string;
  productor: string;
  campo: string;
  origen: string;
  entradaCampo: string;
  material: string;
  administrador: string;
  vendedor: string;
  fechaInicio: string;
  fechaLlegada: string;
  observaciones: string;
  totalViajes: number;
  totalToneladas: number;
  enViaje: number;
  completados: number;
  conProblemas: number;
  pendientesAsignables: number;
}

/**
 * Gestión operativa (Figma: 720:856 + Tabla gestion operativa del kit):
 * campañas activas expandibles con el detalle de sus viajes.
 */
@Component({
  selector: 'app-gestion-operativa-page',
  imports: [
    Badge,
    Button,
    DatePipe,
    Icon,
    KpiCard,
    Modal,
    ProgressBar,
    ReactiveFormsModule,
    SearchBar,
    SelectInput,
    StateWrapper,
    Table,
    TableCellDef,
    TextInput,
  ],
  templateUrl: './gestion-operativa-page.html',
  styleUrl: './gestion-operativa-page.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionOperativaPage {
  private readonly store = inject(DespachoStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationStore);
  private readonly mensajeriaStore = inject(MensajeriaStore);
  private readonly fb = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);
  private readonly exportService = inject(ReportExportService);

  protected readonly viajesColumns = VIAJES_COLUMNS;
  protected readonly despachos = this.store.despachos;
  protected readonly busqueda = signal('');
  protected readonly expandidas = signal<Set<string>>(new Set());
  protected readonly filtrosAbiertos = signal(false);
  protected readonly menuCampaniaAbierto = signal<string | null>(null);
  protected readonly menuCampaniaPos = signal<{ top: number; right: number } | null>(null);
  protected readonly detalleCampaniaId = signal<string | null>(null);
  protected readonly agregarViajeCampaniaId = signal<string | null>(null);
  protected readonly metadatosCampaniaId = signal<string | null>(null);
  protected readonly guardandoViaje = signal(false);
  protected readonly guardandoMetadatos = signal(false);

  protected readonly agregarViajeForm = this.fb.group({
    choferId: [''],
    dominio: [''],
    destino: ['', Validators.required],
    toneladas: ['', [Validators.required, Validators.min(0.01), Validators.max(100)]],
  });

  protected readonly metadatosForm = this.fb.group({
    fechaLlegadaEstimada: ['', Validators.required],
    observaciones: [''],
  });

  protected readonly filtrosForm = this.fb.group({
    administradorId: [''],
    vendedorId: [''],
    productorId: [''],
    material: [''],
    chofer: [''],
    estadoViaje: [''],
    destino: [''],
    dominio: [''],
    fechaDesde: [''],
    fechaHasta: [''],
    minViajes: [''],
    minToneladas: [''],
  });

  protected readonly filtros = toSignal(this.filtrosForm.valueChanges, {
    initialValue: this.filtrosForm.getRawValue(),
  });

  protected readonly administradorOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.administradores ?? []).map((a) => ({
      value: a.id,
      label: a.nombre,
    })),
  );

  protected readonly vendedorOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.vendedores ?? []).map((v) => ({
      value: v.id,
      label: v.nombre,
    })),
  );

  protected readonly productorOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.productores ?? []).map((p) => ({
      value: p.id,
      label: p.nombre,
    })),
  );

  protected readonly materialOptions = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.materiales ?? []).map((m) => ({ value: m, label: m })),
  );

  protected readonly estadoViajeOptions = computed<SelectOption[]>(() => [
    { value: 'en-viaje', label: 'En ruta' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'retrasado', label: 'Incidentes' },
    { value: 'completado', label: 'Finalizado' },
  ]);

  protected readonly choferOptions = computed<SelectOption[]>(() => {
    const nombres = new Set<string>();
    for (const despacho of this.store.enOperacion()) {
      for (const viaje of viajesOperativos(despacho.viajes)) {
        if (viaje.chofer && viaje.chofer !== 'Sin asignar') {
          nombres.add(viaje.chofer);
        }
      }
    }
    return [...nombres].sort().map((nombre) => ({ value: nombre, label: nombre }));
  });

  protected readonly destinoOptions = computed<SelectOption[]>(() => {
    const destinos = new Set<string>();
    for (const despacho of this.store.enOperacion()) {
      for (const viaje of viajesOperativos(despacho.viajes)) {
        if (viaje.destino) {
          destinos.add(viaje.destino);
        }
      }
    }
    return [...destinos].sort().map((destino) => ({ value: destino, label: destino }));
  });

  protected readonly choferOptionsAgregar = computed<SelectOption[]>(() =>
    (this.store.catalogos().data?.choferes ?? []).map((chofer) => ({
      value: chofer.id,
      label: chofer.nombre,
    })),
  );

  protected readonly detalleCampania = computed<CampaniaDetalleVm | null>(() => {
    const id = this.detalleCampaniaId();
    if (!id) {
      return null;
    }
    return this.armarDetalleCampania(id);
  });

  protected readonly hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    return !!(
      f.administradorId ||
      f.vendedorId ||
      f.productorId ||
      f.material ||
      f.chofer ||
      f.estadoViaje ||
      f.destino ||
      f.dominio ||
      f.fechaDesde ||
      f.fechaHasta ||
      f.minViajes ||
      f.minToneladas
    );
  });

  protected readonly campanias = computed<CampaniaVm[]>(() => {
    const catalogos = this.store.catalogos().data;
    const filtro = this.busqueda().toLowerCase();
    const f = this.filtros();
    const desde = f.fechaDesde ? new Date(`${f.fechaDesde}T00:00:00`) : null;
    const hasta = f.fechaHasta ? new Date(`${f.fechaHasta}T23:59:59`) : null;
    const minViajes = f.minViajes ? Number(f.minViajes) : null;
    const minToneladas = f.minToneladas ? Number(f.minToneladas) : null;
    const dominioFiltro = f.dominio?.trim().toLowerCase() ?? '';

    const filtrarViajes = (viajes: Viaje[]): Viaje[] => {
      let resultado = viajesOperativos(viajes);
      if (f.estadoViaje) {
        resultado = resultado.filter((viaje) => viaje.estado === f.estadoViaje);
      }
      if (f.chofer) {
        resultado = resultado.filter((viaje) => viaje.chofer === f.chofer);
      }
      if (f.destino) {
        resultado = resultado.filter((viaje) => viaje.destino === f.destino);
      }
      if (dominioFiltro) {
        resultado = resultado.filter((viaje) =>
          viaje.dominio.toLowerCase().includes(dominioFiltro),
        );
      }
      return resultado;
    };

    return this.store
      .enOperacion()
      .filter((despacho) => {
        if (f.administradorId && despacho.administradorId !== f.administradorId) {
          return false;
        }
        if (f.vendedorId && despacho.vendedorId !== f.vendedorId) {
          return false;
        }
        if (f.productorId && despacho.productorId !== f.productorId) {
          return false;
        }
        if (f.material && despacho.material !== f.material) {
          return false;
        }
        if (desde && despacho.fechaInicio < desde) {
          return false;
        }
        if (hasta && despacho.fechaInicio > hasta) {
          return false;
        }
        const viajes = filtrarViajes(despacho.viajes);
        if (viajes.length === 0) {
          return false;
        }
        if (minViajes !== null && !Number.isNaN(minViajes) && viajes.length < minViajes) {
          return false;
        }
        const toneladas = viajes.reduce((sum, viaje) => sum + viaje.toneladas, 0);
        if (minToneladas !== null && !Number.isNaN(minToneladas) && toneladas < minToneladas) {
          return false;
        }
        return true;
      })
      .map((despacho) => {
        const viajes = filtrarViajes(despacho.viajes);
        return { ...despacho, viajes };
      })
      .map((despacho) => {
        const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
        const campo = productor?.campos.find((c) => c.id === despacho.campoId);
        return {
          id: despacho.id,
          nombre: despacho.nombre,
          estado: despacho.estado,
          productorCampo: `${productor?.nombre ?? '—'} / ${campo?.nombre ?? '—'}`,
          administrador:
            catalogos?.administradores.find((a) => a.id === despacho.administradorId)?.nombre ??
            '—',
          vendedor: catalogos?.vendedores.find((v) => v.id === despacho.vendedorId)?.nombre ?? '—',
          totalViajes: despacho.viajes.length,
          totalToneladas: despacho.viajes.reduce((sum, viaje) => sum + viaje.toneladas, 0),
          enViaje: despacho.viajes.filter((viaje) => viaje.estado === 'en-viaje').length,
          completados: despacho.viajes.filter((viaje) => viaje.estado === 'completado').length,
          conProblemas: despacho.viajes.filter(
            (viaje) => viaje.estado === 'retrasado' || viaje.estado === 'pendiente',
          ).length,
          viajes: despacho.viajes,
        };
      })
      .filter(
        (campania) =>
          !filtro ||
          campania.nombre.toLowerCase().includes(filtro) ||
          campania.productorCampo.toLowerCase().includes(filtro) ||
          campania.viajes.some(
            (viaje) =>
              viaje.chofer.toLowerCase().includes(filtro) ||
              viaje.id.toLowerCase().includes(filtro),
          ),
      );
  });

  protected readonly campaniaDelMenu = computed(() => {
    const id = this.menuCampaniaAbierto();
    if (!id) {
      return null;
    }
    return this.campanias().find((campania) => campania.id === id) ?? null;
  });

  protected readonly emptyMessage = computed(() =>
    this.hayFiltrosActivos() || this.busqueda()
      ? 'No hay campañas que coincidan con los filtros'
      : 'No hay campañas activas',
  );

  protected readonly totalViajesOperativos = computed(
    () => this.enRuta() + this.pendientes() + this.incidentes() + this.finalizados(),
  );

  /** Participación real de cada estado sobre el total operativo */
  protected pct(cantidad: number): string {
    const total = Math.max(this.totalViajesOperativos(), 1);
    return `${Math.round((cantidad / total) * 100)}% del total`;
  }

  // Métricas operativas reales por estado
  protected readonly tnEnMovimiento = computed(() =>
    this.todosLosViajes()
      .filter((v) => v.estado === 'en-viaje')
      .reduce((sum, v) => sum + v.toneladas, 0),
  );
  protected readonly sinAsignar = computed(
    () =>
      this.todosLosViajes().filter((v) => v.estado === 'pendiente' && v.chofer === 'Sin asignar')
        .length,
  );
  protected readonly tnAfectadas = computed(() =>
    this.todosLosViajes()
      .filter((v) => v.estado === 'retrasado')
      .reduce((sum, v) => sum + v.toneladas, 0),
  );
  protected readonly tnEntregadas = computed(() =>
    this.todosLosViajes()
      .filter((v) => v.estado === 'completado')
      .reduce((sum, v) => sum + v.toneladas, 0),
  );

  // Totalizadores (los % de tendencia llegan con el backend — TODO)
  private readonly todosLosViajes = computed(() =>
    this.store.enOperacion().flatMap((d) => d.viajes),
  );
  protected readonly enRuta = computed(
    () => this.todosLosViajes().filter((v) => v.estado === 'en-viaje').length,
  );
  protected readonly pendientes = computed(
    () => this.todosLosViajes().filter((v) => v.estado === 'pendiente').length,
  );
  protected readonly incidentes = computed(
    () => this.todosLosViajes().filter((v) => v.estado === 'retrasado').length,
  );
  protected readonly finalizados = computed(
    () => this.todosLosViajes().filter((v) => v.estado === 'completado').length,
  );

  protected toggleFiltroEstado(estado: EstadoViaje): void {
    const actual = this.filtros().estadoViaje;
    const nuevo = actual === estado ? '' : estado;
    this.filtrosForm.patchValue({ estadoViaje: nuevo });
    if (nuevo) {
      this.expandidas.set(new Set(this.store.enOperacion().map((despacho) => despacho.id)));
    }
  }

  protected quitarFiltroEstado(): void {
    this.filtrosForm.patchValue({ estadoViaje: '' });
  }

  protected toggleFiltros(): void {
    this.filtrosAbiertos.update((abierto) => !abierto);
  }

  protected limpiarFiltros(): void {
    this.filtrosForm.reset({
      administradorId: '',
      vendedorId: '',
      productorId: '',
      material: '',
      chofer: '',
      estadoViaje: '',
      destino: '',
      dominio: '',
      fechaDesde: '',
      fechaHasta: '',
      minViajes: '',
      minToneladas: '',
    });
  }

  constructor() {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
    this.mensajeriaStore.cargarConversaciones();

    // Búsqueda profunda desde la lupa del topbar (?q=#12342)
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q');
      if (q) {
        this.busqueda.set(q);
        this.expandirTodas();
      }
    });
  }

  private expandirTodas(): void {
    this.expandidas.set(new Set(this.store.enOperacion().map((d) => d.id)));
  }

  /** Mensajes sin leer del chofer de un viaje (badge en el icono de chat) */
  protected noLeidosDe(chofer: string): number {
    return (
      (this.mensajeriaStore.conversaciones().data ?? []).find((c) => c.chofer === chofer)
        ?.noLeidos ?? 0
    );
  }

  protected toggle(id: string): void {
    this.expandidas.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  /** Dominio → modelo del transporte (alta del transporte / cédula verde) */
  private readonly modeloPorDominio = computed(() => {
    const mapa = new Map<string, string>();
    for (const chofer of this.store.catalogos().data?.choferes ?? []) {
      mapa.set(chofer.dominio, chofer.modelo);
    }
    return mapa;
  });

  protected viajesRows(campania: CampaniaVm): Record<string, unknown>[] {
    return campania.viajes.map((viaje) => ({
      ...viaje,
      modelo: this.modeloPorDominio().get(viaje.dominio) ?? '',
    }));
  }

  protected progressVariant(estado: EstadoViaje): ProgressVariant {
    return PROGRESS_VARIANT[estado];
  }

  /** Fila pintada según estado del viaje (diseño: retrasado en rosa) */
  protected readonly estadoRowClass = (row: Record<string, unknown>): string =>
    row['estado'] === 'retrasado' ? 'row--danger' : '';

  protected crearDespacho(): void {
    this.router.navigate(['/despachos']);
  }

  // --- Acciones por campaña ---

  protected toggleMenuCampania(campaniaId: string, event: Event): void {
    event.stopPropagation();
    if (this.menuCampaniaAbierto() === campaniaId) {
      this.cerrarMenuCampania();
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.menuCampaniaPos.set({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    this.menuCampaniaAbierto.set(campaniaId);
  }

  protected cerrarMenuCampania(): void {
    this.menuCampaniaAbierto.set(null);
    this.menuCampaniaPos.set(null);
  }

  protected verDetalleCampania(campaniaId: string): void {
    this.cerrarMenuCampania();
    this.detalleCampaniaId.set(campaniaId);
  }

  protected cerrarDetalleCampania(): void {
    this.detalleCampaniaId.set(null);
  }

  protected esCampaniaActiva(campania: CampaniaVm): boolean {
    return campania.estado === 'activo';
  }

  protected esCampaniaOperable(campania: CampaniaVm): boolean {
    return campania.estado !== 'cerrado';
  }

  protected puedeCerrarCampania(campania: CampaniaVm): boolean {
    return (
      campania.estado === 'activo' &&
      campania.viajes.length > 0 &&
      campania.viajes.every((viaje) => viaje.estado === 'completado')
    );
  }

  protected abrirAgregarViaje(campaniaId: string): void {
    const despacho = this.buscarDespacho(campaniaId);
    if (!despacho || despacho.estado === 'cerrado') {
      this.notifications.warning(
        'Campaña no editable',
        'No se agregan viajes en campañas cerradas',
      );
      return;
    }
    this.cerrarMenuCampania();
    this.detalleCampaniaId.set(null);
    const ultimoDestino = despacho.viajes.at(-1)?.destino ?? '';
    this.agregarViajeForm.reset({
      choferId: '',
      dominio: '',
      destino: ultimoDestino,
      toneladas: '',
    });
    this.agregarViajeCampaniaId.set(campaniaId);
  }

  protected cerrarAgregarViaje(): void {
    this.agregarViajeCampaniaId.set(null);
    this.guardandoViaje.set(false);
  }

  protected patentesAgregarViaje(): string[] {
    const choferId = this.agregarViajeForm.get('choferId')?.value;
    if (!choferId) {
      return [];
    }
    const chofer = this.store.catalogos().data?.choferes.find((c) => c.id === choferId);
    if (!chofer) {
      return [];
    }
    const patentes = new Set<string>();
    if (chofer.dominio) {
      patentes.add(chofer.dominio);
    }
    for (const camion of chofer.camiones ?? []) {
      patentes.add(camion.dominio);
    }
    return [...patentes];
  }

  protected patentesAgregarOptions(): SelectOption[] {
    return this.patentesAgregarViaje().map((patente) => ({
      value: patente,
      label: patente,
    }));
  }

  protected errorAgregarViaje(campo: 'destino' | 'toneladas'): string {
    const control = this.agregarViajeForm.get(campo);
    if (!control?.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control.hasError('min')) {
      return 'Ingresá un valor mayor a 0';
    }
    if (control.hasError('max')) {
      return 'Máximo 100 toneladas';
    }
    return '';
  }

  protected guardarViajeNuevo(): void {
    const campaniaId = this.agregarViajeCampaniaId();
    if (!campaniaId || this.agregarViajeForm.invalid) {
      this.agregarViajeForm.markAllAsTouched();
      this.notifications.warning(
        'Revisá el formulario',
        'Completá destino y toneladas (mayor a 0)',
      );
      return;
    }
    const raw = this.agregarViajeForm.getRawValue();
    this.guardandoViaje.set(true);
    this.store
      .agregarViaje(campaniaId, {
        choferId: raw.choferId || undefined,
        dominio: raw.dominio || undefined,
        destino: (raw.destino ?? '').trim(),
        toneladas: Number(raw.toneladas),
      })
      .subscribe({
        next: (despacho) => {
          this.guardandoViaje.set(false);
          this.cerrarAgregarViaje();
          this.expandidas.update((set) => new Set(set).add(campaniaId));
          this.notifications.success('Viaje agregado', `Nuevo viaje en "${despacho.nombre}"`);
        },
        error: (error: Error) => {
          this.guardandoViaje.set(false);
          this.notifications.error('No se pudo agregar el viaje', error.message);
        },
      });
  }

  protected exportarCampania(campania: CampaniaVm): void {
    this.cerrarMenuCampania();
    this.exportService.exportCsv({
      titulo: `Viajes ${campania.nombre}`,
      headers: ['ID', 'Chofer', 'Dominio', 'Destino', 'Toneladas', 'Estado', 'Progreso'],
      filas: campania.viajes.map((viaje) => [
        viaje.id,
        viaje.chofer,
        viaje.dominio,
        viaje.destino,
        String(viaje.toneladas),
        ESTADO_LABEL[viaje.estado],
        `${viaje.progreso}%`,
      ]),
    });
    this.notifications.success('Exportación lista', `Viajes de "${campania.nombre}" descargados`);
  }

  protected irAReportes(campaniaId: string): void {
    this.cerrarMenuCampania();
    this.router.navigate(['/reportes'], { queryParams: { campania: campaniaId } });
  }

  protected filtrarSoloCampania(campania: CampaniaVm): void {
    this.cerrarMenuCampania();
    const despacho = this.buscarDespacho(campania.id);
    if (!despacho) {
      return;
    }
    this.filtrosForm.patchValue({
      productorId: despacho.productorId,
      material: despacho.material,
      administradorId: despacho.administradorId,
      vendedorId: despacho.vendedorId,
    });
    this.filtrosAbiertos.set(true);
    this.busqueda.set('');
  }

  protected iniciarPendientesCampania(campaniaId: string): void {
    const despacho = this.buscarDespacho(campaniaId);
    if (!despacho) {
      this.notifications.warning('Campaña no encontrada', 'Recargá la página e intentá de nuevo');
      return;
    }
    if (despacho.estado === 'cerrado') {
      this.notifications.warning(
        'Campaña no editable',
        'No se inician viajes en campañas cerradas',
      );
      return;
    }
    const pendientes = despacho.viajes.filter(
      (viaje) => viaje.estado === 'pendiente' && viaje.choferId,
    );
    this.cerrarMenuCampania();
    if (pendientes.length === 0) {
      this.notifications.warning(
        'Sin pendientes asignables',
        'No hay viajes pendientes con chofer asignado',
      );
      return;
    }
    from(pendientes)
      .pipe(
        concatMap((viaje) => this.store.iniciarViaje(campaniaId, viaje.id)),
        toArray(),
      )
      .subscribe({
        next: () => {
          this.expandidas.update((set) => new Set(set).add(campaniaId));
          this.notifications.success(
            'Viajes iniciados',
            `${pendientes.length} viaje(s) salieron a ruta`,
          );
        },
        error: (error: Error) => this.notifications.error('Error al iniciar viajes', error.message),
      });
  }

  protected contactarChoferesCampania(campania: CampaniaVm): void {
    this.cerrarMenuCampania();
    const choferes = [
      ...new Set(
        campania.viajes
          .map((viaje) => viaje.chofer.split(' / ')[0].trim())
          .filter((nombre) => nombre && nombre !== 'Sin asignar'),
      ),
    ];
    if (choferes.length === 0) {
      this.notifications.warning('Sin choferes', 'La campaña no tiene choferes asignados');
      return;
    }
    this.router.navigate(['/mensajeria'], { queryParams: { chofer: choferes[0] } });
  }

  protected adjuntarMasivoCampania(
    campania: CampaniaVm,
    tipo: 'ticket de gasoil' | 'carta de porte',
  ): void {
    this.cerrarMenuCampania();
    const viajes = campania.viajes.filter((viaje) => viaje.estado !== 'completado');
    if (viajes.length === 0) {
      this.notifications.warning('Sin viajes', 'No hay viajes activos para adjuntar documentos');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = tipo === 'carta de porte' ? '.pdf,image/*' : 'image/*,.pdf';
    input.onchange = () => {
      const archivo = input.files?.[0];
      if (archivo) {
        this.notifications.success(
          `Adjunto masivo: ${tipo}`,
          `${archivo.name} → ${viajes.length} viaje(s) de "${campania.nombre}"`,
        );
      }
    };
    input.click();
  }

  protected abrirEditarMetadatos(campaniaId: string): void {
    const despacho = this.buscarDespacho(campaniaId);
    if (!despacho || despacho.estado !== 'activo') {
      this.notifications.warning('No editable', 'Solo se ajustan metadatos de campañas activas');
      return;
    }
    this.cerrarMenuCampania();
    this.detalleCampaniaId.set(null);
    this.metadatosForm.reset({
      fechaLlegadaEstimada: this.toInputDate(despacho.fechaLlegadaEstimada),
      observaciones: despacho.observaciones,
    });
    this.metadatosCampaniaId.set(campaniaId);
  }

  protected cerrarEditarMetadatos(): void {
    this.metadatosCampaniaId.set(null);
    this.guardandoMetadatos.set(false);
  }

  protected guardarMetadatos(): void {
    const campaniaId = this.metadatosCampaniaId();
    if (!campaniaId || this.metadatosForm.invalid) {
      this.metadatosForm.markAllAsTouched();
      return;
    }
    const raw = this.metadatosForm.getRawValue();
    this.guardandoMetadatos.set(true);
    this.store
      .actualizarMetadatos(campaniaId, {
        fechaLlegadaEstimada: raw.fechaLlegadaEstimada ?? '',
        observaciones: raw.observaciones ?? undefined,
      })
      .subscribe({
        next: (despacho) => {
          this.guardandoMetadatos.set(false);
          this.cerrarEditarMetadatos();
          this.notifications.success('Metadatos actualizados', despacho.nombre);
        },
        error: (error: Error) => {
          this.guardandoMetadatos.set(false);
          this.notifications.error('No se pudieron guardar los metadatos', error.message);
        },
      });
  }

  protected cerrarCampania(campania: CampaniaVm): void {
    if (!this.puedeCerrarCampania(campania)) {
      this.notifications.warning('No se puede cerrar', 'Todos los viajes deben estar completados');
      return;
    }
    this.cerrarMenuCampania();
    this.store.cerrarDespacho(campania.id).subscribe({
      next: (despacho) => {
        this.expandidas.update((set) => {
          const next = new Set(set);
          next.delete(campania.id);
          return next;
        });
        this.notifications.success('Campaña cerrada', `"${despacho.nombre}" archivada`);
      },
      error: (error: Error) =>
        this.notifications.error('No se pudo cerrar la campaña', error.message),
    });
  }

  protected duplicarCampania(campaniaId: string): void {
    this.cerrarMenuCampania();
    this.store.duplicarDespacho(campaniaId).subscribe({
      next: (copia) => {
        this.notifications.success('Campaña duplicada', copia.nombre);
        this.router.navigate(['/despachos'], { queryParams: { borrador: copia.id } });
      },
      error: (error: Error) =>
        this.notifications.error('No se pudo duplicar la campaña', error.message),
    });
  }

  private toInputDate(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private buscarDespacho(campaniaId: string): Despacho | undefined {
    return this.store.enOperacion().find((despacho) => despacho.id === campaniaId);
  }

  private armarDetalleCampania(campaniaId: string): CampaniaDetalleVm | null {
    const despacho = this.buscarDespacho(campaniaId);
    const catalogos = this.store.catalogos().data;
    if (!despacho) {
      return null;
    }
    const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
    const campo = productor?.campos.find((c) => c.id === despacho.campoId);
    const viajes = viajesOperativos(despacho.viajes);
    return {
      id: despacho.id,
      nombre: despacho.nombre,
      productor: productor?.nombre ?? '—',
      campo: campo?.nombre ?? '—',
      origen: despacho.origen,
      entradaCampo: despacho.entradaCampo || '—',
      material: despacho.material,
      administrador:
        catalogos?.administradores.find((a) => a.id === despacho.administradorId)?.nombre ?? '—',
      vendedor: catalogos?.vendedores.find((v) => v.id === despacho.vendedorId)?.nombre ?? '—',
      fechaInicio: this.datePipe.transform(despacho.fechaInicio, 'dd/MM/yyyy') ?? '—',
      fechaLlegada: this.datePipe.transform(despacho.fechaLlegadaEstimada, 'dd/MM/yyyy') ?? '—',
      observaciones: despacho.observaciones || '—',
      totalViajes: viajes.length,
      totalToneladas: viajes.reduce((sum, viaje) => sum + viaje.toneladas, 0),
      enViaje: viajes.filter((viaje) => viaje.estado === 'en-viaje').length,
      completados: viajes.filter((viaje) => viaje.estado === 'completado').length,
      conProblemas: viajes.filter(
        (viaje) => viaje.estado === 'retrasado' || viaje.estado === 'pendiente',
      ).length,
      pendientesAsignables: viajes.filter((viaje) => viaje.estado === 'pendiente' && viaje.choferId)
        .length,
    };
  }

  // --- Acciones por viaje ---

  /** id del viaje cuyo menú "más opciones" está abierto */
  protected readonly menuAbierto = signal<string | null>(null);

  /** Popup de observación completa: id del viaje + coordenadas del clic
   * (position fixed para que no lo recorte el scroll de la tabla) */
  protected readonly obsAbierta = signal<{ id: string; x: number; y: number } | null>(null);

  protected toggleObs(viajeId: string, event: MouseEvent): void {
    if (this.obsAbierta()?.id === viajeId) {
      this.obsAbierta.set(null);
      return;
    }
    const boton = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.obsAbierta.set({
      id: viajeId,
      x: Math.max(boton.right - 260, 8),
      y: boton.bottom + 6,
    });
  }

  private adjuntoPendiente: { viajeId: string; tipo: string } | null = null;

  protected adjuntar(viajeId: string, tipo: 'ticket de gasoil' | 'carta de porte'): void {
    // TODO(backend): subir el archivo al viaje; hoy solo se simula la carga
    this.adjuntoPendiente = { viajeId, tipo };
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = tipo === 'carta de porte' ? '.pdf,image/*' : 'image/*,.pdf';
    input.onchange = () => {
      const archivo = input.files?.[0];
      if (archivo && this.adjuntoPendiente) {
        this.notifications.success(
          `Se adjuntó ${this.adjuntoPendiente.tipo}`,
          `${archivo.name} → viaje ${this.adjuntoPendiente.viajeId}`,
        );
      }
      this.adjuntoPendiente = null;
    };
    input.click();
  }

  protected abrirChat(viajeId: string, choferPatente: string): void {
    const chofer = choferPatente.split(' / ')[0];
    this.router.navigate(['/mensajeria'], { queryParams: { chofer, viaje: viajeId } });
  }

  protected toggleMenu(viajeId: string): void {
    this.menuAbierto.update((actual) => (actual === viajeId ? null : viajeId));
  }

  protected opcionMenu(opcion: string, viajeId: string): void {
    this.menuAbierto.set(null);
    this.notifications.warning(opcion, `Viaje ${viajeId} — disponible próximamente`);
  }
}
