import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationStore } from '../../notifications/state/notification.store';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { MapPickerModal } from '../../shared/ui/map-picker-modal/map-picker-modal';
import { SelectInput, SelectOption } from '../../shared/ui/select/select-input';
import { Modal } from '../../shared/ui/modal/modal';
import { SideDrawer } from '../../shared/ui/side-drawer/side-drawer';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { TextInput } from '../../shared/ui/input/text-input';
import {
  CampoProductor,
  DrawerEntidad,
  DrawerModo,
  FiltroActivo,
  Productor,
  PuntoEntrada,
  ResponsableProductor,
} from './data-access/productores.model';
import { ProductoresService } from './data-access/productores.service';
import { ProductoresStore } from './data-access/productores.store';

const CUIT_AR = /^\d{2}-\d{8}-\d$/;
const PRODUCTORES_POR_PAGINA = 20;
const CENTRO_MAPA = { latitud: -33.89, longitud: -60.57 };

interface PuntoDraft {
  id?: string;
  nombre: string;
  orden: number;
  latitud: number;
  longitud: number;
  observacion: string;
}

function filtrarPorEstadoYBusqueda<T extends { activo: boolean; eliminado: boolean }>(
  items: T[],
  filtro: FiltroActivo,
  busqueda: string,
  textoDe: (item: T) => string,
): T[] {
  let result = items.filter((item) => !item.eliminado);
  if (filtro === 'activos') {
    result = result.filter((item) => item.activo);
  } else if (filtro === 'inactivos') {
    result = result.filter((item) => !item.activo);
  }
  const q = busqueda.trim().toLowerCase();
  if (q) {
    result = result.filter((item) => textoDe(item).toLowerCase().includes(q));
  }
  return result;
}

const PRODUCTORES_COLUMNS: TableColumn[] = [
  { key: 'nombreFantasia', label: 'Nombre fantasía' },
  { key: 'razonSocial', label: 'Razón social' },
  { key: 'cuit', label: 'CUIT' },
  { key: 'vendedor', label: 'Vendedor' },
  { key: 'email', label: 'Email' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '96px' },
];

const RESPONSABLES_COLUMNS: TableColumn[] = [
  { key: 'nombre', label: 'Nombre', width: '90px' },
  { key: 'apellido', label: 'Apellido', width: '90px' },
  { key: 'documento', label: 'DNI', width: '90px' },
  { key: 'telefono', label: 'Teléfono', width: '110px' },
  { key: 'estado', label: 'Estado', width: '72px' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '96px' },
];

const CAMPOS_COLUMNS: TableColumn[] = [
  { key: 'codigo', label: 'Código', width: '80px' },
  { key: 'nombre', label: 'Nombre', width: '120px' },
  { key: 'localidad', label: 'Localidad', width: '100px' },
  { key: 'provincia', label: 'Provincia', width: '100px' },
  { key: 'superficieHa', label: 'Ha', width: '56px' },
  { key: 'puntos', label: 'Entradas', width: '72px' },
  { key: 'estado', label: 'Estado', width: '72px' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '96px' },
];

@Component({
  selector: 'app-productores-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Badge,
    Button,
    Icon,
    MapPickerModal,
    SelectInput,
    Modal,
    SideDrawer,
    StateWrapper,
    Table,
    TableCellDef,
    TextInput,
  ],
  templateUrl: './productores-page.html',
  styleUrls: ['./productores-page.scss', '../transportistas/transportistas-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoresPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProductoresService);
  private readonly store = inject(ProductoresStore);
  private readonly notifications = inject(NotificationStore);

  protected readonly productoresColumns = PRODUCTORES_COLUMNS;
  protected readonly responsablesColumns = RESPONSABLES_COLUMNS;
  protected readonly camposColumns = CAMPOS_COLUMNS;

  protected readonly busqueda = signal('');
  protected readonly filtro = signal<FiltroActivo>('activos');
  protected readonly busquedaCampos = signal('');
  protected readonly filtroCampos = signal<FiltroActivo>('activos');
  protected readonly busquedaResponsables = signal('');
  protected readonly filtroResponsables = signal<FiltroActivo>('activos');
  protected readonly paginaProductores = signal(1);
  protected readonly seleccionadoId = signal<string | null>(null);
  protected readonly configModalAbierto = signal(false);
  protected readonly masterDirty = signal(false);
  protected readonly drawerAbierto = signal(false);
  protected readonly drawerEntidad = signal<DrawerEntidad>('productor');
  protected readonly drawerModo = signal<DrawerModo>('crear');
  protected readonly entidadId = signal<string | null>(null);
  protected readonly formDirty = signal(false);
  protected readonly puntosDraft = signal<PuntoDraft[]>([]);
  protected readonly mapModalAbierto = signal(false);
  protected readonly mapModalTarget = signal<'campo' | number>('campo');
  protected readonly mapModalLat = signal(CENTRO_MAPA.latitud);
  protected readonly mapModalLng = signal(CENTRO_MAPA.longitud);

  protected readonly productoresState = this.store.productores;
  protected readonly detalleState = this.store.detalle;

  protected readonly filtroOptions: SelectOption[] = [
    { value: 'activos', label: 'Solo activos' },
    { value: 'inactivos', label: 'Solo inactivos' },
    { value: 'todos', label: 'Todos (sin eliminados)' },
  ];

  protected readonly productorForm = this.fb.group({
    nombreFantasia: [''],
    razonSocial: [''],
    cuit: ['', Validators.pattern(CUIT_AR)],
    direccionFiscal: [''],
    email: [''],
    telefono: [''],
    vendedorId: [''],
    notas: [''],
  });

  protected readonly responsableForm = this.fb.group({
    nombre: [''],
    apellido: [''],
    documento: [''],
    telefono: [''],
  });

  protected readonly campoForm = this.fb.group({
    nombre: [''],
    codigo: [''],
    superficieHa: [0],
    localidad: [''],
    provincia: [''],
    partido: [''],
    direccion: [''],
    latitud: [CENTRO_MAPA.latitud],
    longitud: [CENTRO_MAPA.longitud],
    contactoNombre: [''],
    contactoTelefono: [''],
  });

  protected readonly vendedorOptions = computed<SelectOption[]>(() =>
    (this.store.vendedores() ?? []).map((v) => ({ value: v.id, label: v.nombre })),
  );

  protected readonly productoresRows = computed(() => {
    const vendedores = this.store.vendedores();
    return (this.productoresState().data ?? []).map((p) => ({
      ...p,
      vendedor: vendedores.find((v) => v.id === p.vendedorId)?.nombre ?? '—',
      estado: p.activo ? 'Activo' : 'Inactivo',
    })) as Record<string, unknown>[];
  });

  protected readonly totalProductores = computed(() => this.productoresRows().length);

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalProductores() / PRODUCTORES_POR_PAGINA)),
  );

  protected readonly productoresRowsPagina = computed(() => {
    const pagina = Math.min(this.paginaProductores(), this.totalPaginas());
    const inicio = (pagina - 1) * PRODUCTORES_POR_PAGINA;
    return this.productoresRows().slice(inicio, inicio + PRODUCTORES_POR_PAGINA);
  });

  protected readonly rangoProductores = computed(() => {
    if (this.totalProductores() === 0) {
      return '0 de 0';
    }
    const pagina = Math.min(this.paginaProductores(), this.totalPaginas());
    const desde = (pagina - 1) * PRODUCTORES_POR_PAGINA + 1;
    const hasta = Math.min(pagina * PRODUCTORES_POR_PAGINA, this.totalProductores());
    return `${desde}-${hasta} de ${this.totalProductores()}`;
  });

  protected readonly detalle = computed(() => this.detalleState().data ?? null);

  protected readonly responsablesRows = computed(() => {
    const detalle = this.detalle();
    if (!detalle) {
      return [];
    }
    return filtrarPorEstadoYBusqueda(
      detalle.responsables,
      this.filtroResponsables(),
      this.busquedaResponsables(),
      (r) => `${r.nombre} ${r.apellido} ${r.documento} ${r.telefono}`,
    ).map(
      (r) =>
        ({
          ...r,
          estado: r.activo ? 'Activo' : 'Inactivo',
        }) as Record<string, unknown>,
    );
  });

  protected readonly camposRows = computed(() => {
    const detalle = this.detalle();
    if (!detalle) {
      return [];
    }
    return filtrarPorEstadoYBusqueda(
      detalle.campos,
      this.filtroCampos(),
      this.busquedaCampos(),
      (c) =>
        `${c.nombre} ${c.codigo} ${c.localidad} ${c.provincia} ${c.direccion} ${c.contactoNombre}`,
    ).map(
      (c) =>
        ({
          ...c,
          puntos: c.puntosEntrada.filter((p) => !p.eliminado).length,
          estado: c.activo ? 'Activo' : 'Inactivo',
        }) as Record<string, unknown>,
    );
  });

  protected readonly configModalTitulo = computed(() => {
    const det = this.detalle();
    const nombre = det?.nombreFantasia || det?.razonSocial || 'Productor';
    return `Configuración · ${nombre}`;
  });

  protected readonly drawerTitulo = computed(() => {
    const entidad = this.drawerEntidad();
    const modo = this.drawerModo();
    const prefijos: Record<DrawerModo, string> = {
      crear: 'Nuevo',
      editar: 'Editar',
      ver: 'Ver',
    };
    const nombres: Record<DrawerEntidad, string> = {
      productor: 'productor',
      responsable: 'responsable',
      campo: 'campo',
    };
    return `${prefijos[modo]} ${nombres[entidad]}`;
  });

  protected readonly mapModalTitulo = computed(() => {
    const target = this.mapModalTarget();
    if (target === 'campo') {
      return 'Ubicación del centro del campo';
    }
    return `Punto de entrada ${target + 1}`;
  });

  protected readonly soloLectura = computed(() => this.drawerModo() === 'ver');

  protected errorProductor(campo: string): string {
    const control = this.productorForm.get(campo);
    if (!control?.touched || !control.errors) {
      return '';
    }
    if (control.errors['pattern']) {
      return 'Formato inválido. Usá XX-XXXXXXXX-X';
    }
    return '';
  }

  constructor() {
    this.store.cargarVendedores();
    this.recargarProductores();
    this.productorForm.valueChanges.subscribe(() => {
      if (this.configModalAbierto()) {
        this.masterDirty.set(true);
      } else if (this.drawerAbierto()) {
        this.formDirty.set(true);
      }
    });
    this.responsableForm.valueChanges.subscribe(() => this.formDirty.set(true));
    this.campoForm.valueChanges.subscribe(() => this.formDirty.set(true));
  }

  protected recargarProductores(): void {
    this.store.cargarProductores(this.filtro(), this.busqueda());
  }

  protected onBusquedaChange(valor: string): void {
    this.busqueda.set(valor);
    this.paginaProductores.set(1);
    this.recargarProductores();
  }

  protected onFiltroChange(valor: string): void {
    this.filtro.set(valor as FiltroActivo);
    this.paginaProductores.set(1);
    this.recargarProductores();
  }

  protected paginaAnterior(): void {
    if (this.paginaProductores() > 1) {
      this.paginaProductores.update((p) => p - 1);
    }
  }

  protected paginaSiguiente(): void {
    if (this.paginaProductores() < this.totalPaginas()) {
      this.paginaProductores.update((p) => p + 1);
    }
  }

  protected abrirConfigProductor(id: string): void {
    this.seleccionadoId.set(id);
    this.masterDirty.set(false);
    this.busquedaCampos.set('');
    this.filtroCampos.set('activos');
    this.busquedaResponsables.set('');
    this.filtroResponsables.set('activos');
    this.configModalAbierto.set(true);
    this.store.refrescarDetalle(id).subscribe((detalle) => {
      this.productorForm.enable();
      this.productorForm.reset({
        nombreFantasia: detalle.nombreFantasia,
        razonSocial: detalle.razonSocial,
        cuit: detalle.cuit,
        direccionFiscal: detalle.direccionFiscal,
        email: detalle.email,
        telefono: detalle.telefono,
        vendedorId: detalle.vendedorId,
        notas: detalle.notas,
      });
      this.masterDirty.set(false);
    });
  }

  protected cerrarConfigModal(): void {
    if (this.masterDirty()) {
      const confirmar = window.confirm('Hay cambios sin guardar. ¿Desea cerrar igualmente?');
      if (!confirmar) {
        return;
      }
    }
    this.configModalAbierto.set(false);
    this.seleccionadoId.set(null);
    this.masterDirty.set(false);
  }

  protected guardarMasterProductor(): void {
    const id = this.seleccionadoId();
    if (!id || this.productorForm.invalid) {
      this.productorForm.markAllAsTouched();
      return;
    }
    const body = this.productorForm.getRawValue() as Partial<Productor>;
    this.api.actualizar(id, body).subscribe((detalle) => {
      this.notifications.success(
        'Productor actualizado',
        detalle.nombreFantasia || detalle.razonSocial,
      );
      this.masterDirty.set(false);
      this.recargarProductores();
      this.store.refrescarDetalle(id).subscribe();
    });
  }

  protected abrirDrawer(entidad: DrawerEntidad, modo: DrawerModo, id: string | null = null): void {
    this.drawerEntidad.set(entidad);
    this.drawerModo.set(modo);
    this.entidadId.set(id);
    this.formDirty.set(false);
    this.mapModalAbierto.set(false);

    if (entidad === 'productor') {
      this.resetProductorForm(modo, id);
    } else if (entidad === 'responsable') {
      this.resetResponsableForm(modo, id);
    } else {
      this.resetCampoForm(modo, id);
    }

    this.drawerAbierto.set(true);
  }

  protected cerrarDrawer(): void {
    if (this.formDirty() && this.drawerModo() !== 'ver') {
      const confirmar = window.confirm('Hay cambios sin guardar. ¿Desea cerrar igualmente?');
      if (!confirmar) {
        return;
      }
    }
    this.drawerAbierto.set(false);
    this.entidadId.set(null);
    this.formDirty.set(false);
  }

  protected guardarDrawer(): void {
    const entidad = this.drawerEntidad();
    const modo = this.drawerModo();
    if (modo === 'ver') {
      this.cerrarDrawerForzado();
      return;
    }
    if (entidad === 'productor') {
      this.guardarProductor();
    } else if (entidad === 'responsable') {
      this.guardarResponsable(modo);
    } else {
      this.guardarCampo(modo);
    }
  }

  protected toggleActivoProductor(productor: Productor): void {
    this.api.cambiarActivo(productor.id, !productor.activo).subscribe(() => {
      this.notifications.success(
        productor.activo ? 'Productor desactivado' : 'Productor activado',
        productor.nombreFantasia || productor.razonSocial,
      );
      this.recargarProductores();
      if (this.seleccionadoId() === productor.id) {
        this.store.cargarDetalle(productor.id);
      }
    });
  }

  protected eliminarProductor(productor: Productor): void {
    if (!window.confirm(`¿Eliminar ${productor.nombreFantasia || productor.razonSocial}?`)) {
      return;
    }
    this.api.eliminar(productor.id).subscribe(() => {
      this.notifications.warning('Productor eliminado', 'Baja lógica registrada');
      if (this.seleccionadoId() === productor.id) {
        this.cerrarConfigModalForzado();
      }
      this.recargarProductores();
    });
  }

  protected toggleActivoResponsable(responsable: ResponsableProductor): void {
    const productorId = this.seleccionadoId();
    if (!productorId) {
      return;
    }
    this.api
      .cambiarActivoResponsable(productorId, responsable.id, !responsable.activo)
      .subscribe(() => {
        this.store.refrescarDetalle(productorId).subscribe();
      });
  }

  protected eliminarResponsable(responsable: ResponsableProductor): void {
    const productorId = this.seleccionadoId();
    if (
      !productorId ||
      !window.confirm(`¿Eliminar a ${responsable.nombre} ${responsable.apellido}?`)
    ) {
      return;
    }
    this.api.eliminarResponsable(productorId, responsable.id).subscribe(() => {
      this.store.refrescarDetalle(productorId).subscribe();
    });
  }

  protected toggleActivoCampo(campo: CampoProductor): void {
    const productorId = this.seleccionadoId();
    if (!productorId) {
      return;
    }
    this.api.cambiarActivoCampo(productorId, campo.id, !campo.activo).subscribe(() => {
      this.store.refrescarDetalle(productorId).subscribe();
    });
  }

  protected eliminarCampo(campo: CampoProductor): void {
    const productorId = this.seleccionadoId();
    if (!productorId || !window.confirm(`¿Eliminar campo ${campo.nombre}?`)) {
      return;
    }
    this.api.eliminarCampo(productorId, campo.id).subscribe(() => {
      this.store.refrescarDetalle(productorId).subscribe();
    });
  }

  protected agregarPuntoEntrada(): void {
    const lat = this.campoForm.controls.latitud.value ?? CENTRO_MAPA.latitud;
    const lng = this.campoForm.controls.longitud.value ?? CENTRO_MAPA.longitud;
    const orden = this.puntosDraft().length + 1;
    this.puntosDraft.update((items) => [
      ...items,
      {
        nombre: `Entrada ${orden}`,
        orden,
        latitud: Number((lat + orden * 0.001).toFixed(6)),
        longitud: Number((lng + orden * 0.001).toFixed(6)),
        observacion: '',
      },
    ]);
    this.formDirty.set(true);
  }

  protected quitarPuntoEntrada(index: number): void {
    this.puntosDraft.update((items) =>
      items
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, orden: i + 1, nombre: `Entrada ${i + 1}` })),
    );
    this.formDirty.set(true);
  }

  protected abrirMapaModal(target: 'campo' | number): void {
    if (this.soloLectura()) {
      return;
    }
    if (target === 'campo') {
      const lat = this.campoForm.controls.latitud.value;
      const lng = this.campoForm.controls.longitud.value;
      this.mapModalLat.set(lat ?? CENTRO_MAPA.latitud);
      this.mapModalLng.set(lng ?? CENTRO_MAPA.longitud);
    } else {
      const punto = this.puntosDraft()[target];
      this.mapModalLat.set(punto?.latitud ?? CENTRO_MAPA.latitud);
      this.mapModalLng.set(punto?.longitud ?? CENTRO_MAPA.longitud);
    }
    this.mapModalTarget.set(target);
    this.mapModalAbierto.set(true);
  }

  protected cerrarMapaModal(): void {
    this.mapModalAbierto.set(false);
  }

  protected confirmarMapaModal(event: { latitud: number; longitud: number }): void {
    const target = this.mapModalTarget();
    if (target === 'campo') {
      this.campoForm.patchValue({ latitud: event.latitud, longitud: event.longitud });
    } else {
      this.puntosDraft.update((items) =>
        items.map((p, i) =>
          i === target ? { ...p, latitud: event.latitud, longitud: event.longitud } : p,
        ),
      );
    }
    this.mapModalAbierto.set(false);
    this.formDirty.set(true);
  }

  protected abrirGoogleMaps(lat: number, lng: number): void {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  }

  protected actualizarPunto(index: number, campo: keyof PuntoDraft, valor: string | number): void {
    this.puntosDraft.update((items) =>
      items.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)),
    );
    this.formDirty.set(true);
  }

  private guardarProductor(): void {
    if (this.productorForm.invalid) {
      this.productorForm.markAllAsTouched();
      return;
    }
    const body = this.productorForm.getRawValue() as Partial<Productor>;
    this.api.crear(body).subscribe((detalle) => {
      this.notifications.success('Productor creado', detalle.nombreFantasia || detalle.razonSocial);
      this.cerrarDrawerForzado();
      this.recargarProductores();
      this.abrirConfigProductor(detalle.id);
    });
  }

  private guardarResponsable(modo: DrawerModo): void {
    const productorId = this.seleccionadoId();
    if (!productorId) {
      return;
    }
    const body = this.responsableForm.getRawValue() as Partial<ResponsableProductor>;
    const req =
      modo === 'crear'
        ? this.api.crearResponsable(productorId, body)
        : this.api.actualizarResponsable(productorId, this.entidadId()!, body);
    req.subscribe(() => {
      this.notifications.success(
        modo === 'crear' ? 'Responsable agregado' : 'Responsable actualizado',
      );
      this.cerrarDrawerForzado();
      this.store.refrescarDetalle(productorId).subscribe();
    });
  }

  private guardarCampo(modo: DrawerModo): void {
    const productorId = this.seleccionadoId();
    if (!productorId) {
      return;
    }
    const raw = this.campoForm.getRawValue();
    const body: Partial<CampoProductor> = {
      nombre: raw.nombre ?? '',
      codigo: raw.codigo ?? '',
      superficieHa: Number(raw.superficieHa ?? 0),
      localidad: raw.localidad ?? '',
      provincia: raw.provincia ?? '',
      partido: raw.partido ?? '',
      direccion: raw.direccion ?? '',
      latitud: Number(raw.latitud ?? CENTRO_MAPA.latitud),
      longitud: Number(raw.longitud ?? CENTRO_MAPA.longitud),
      contactoNombre: raw.contactoNombre ?? '',
      contactoTelefono: raw.contactoTelefono ?? '',
      puntosEntrada: this.puntosDraft().map(
        (p) =>
          ({
            id: p.id ?? '',
            campoId: this.entidadId() ?? '',
            activo: true,
            eliminado: false,
            nombre: p.nombre,
            orden: p.orden,
            latitud: p.latitud,
            longitud: p.longitud,
            observacion: p.observacion,
          }) as PuntoEntrada,
      ),
    };
    const req =
      modo === 'crear'
        ? this.api.crearCampo(productorId, body)
        : this.api.actualizarCampo(productorId, this.entidadId()!, body);
    req.subscribe(() => {
      this.notifications.success(modo === 'crear' ? 'Campo agregado' : 'Campo actualizado');
      this.cerrarDrawerForzado();
      this.store.refrescarDetalle(productorId).subscribe();
    });
  }

  private resetProductorForm(modo: DrawerModo, id: string | null): void {
    if (modo === 'crear') {
      this.productorForm.enable();
      this.productorForm.reset({
        nombreFantasia: '',
        razonSocial: '',
        cuit: '',
        direccionFiscal: '',
        email: '',
        telefono: '',
        vendedorId: '',
        notas: '',
      });
      return;
    }
    const det = this.detalle();
    const p = det?.id === id ? det : null;
    if (!p) {
      return;
    }
    this.productorForm.reset({
      nombreFantasia: p.nombreFantasia,
      razonSocial: p.razonSocial,
      cuit: p.cuit,
      direccionFiscal: p.direccionFiscal,
      email: p.email,
      telefono: p.telefono,
      vendedorId: p.vendedorId,
      notas: p.notas,
    });
    if (modo === 'ver') {
      this.productorForm.disable();
    } else {
      this.productorForm.enable();
    }
  }

  private resetResponsableForm(modo: DrawerModo, id: string | null): void {
    if (modo === 'crear') {
      this.responsableForm.enable();
      this.responsableForm.reset({ nombre: '', apellido: '', documento: '', telefono: '' });
      return;
    }
    const r = this.detalle()?.responsables.find((x) => x.id === id);
    if (!r) {
      return;
    }
    this.responsableForm.reset({
      nombre: r.nombre,
      apellido: r.apellido,
      documento: r.documento,
      telefono: r.telefono,
    });
    if (modo === 'ver') {
      this.responsableForm.disable();
    } else {
      this.responsableForm.enable();
    }
  }

  private resetCampoForm(modo: DrawerModo, id: string | null): void {
    if (modo === 'crear') {
      this.campoForm.enable();
      this.campoForm.reset({
        nombre: '',
        codigo: '',
        superficieHa: 0,
        localidad: '',
        provincia: '',
        partido: '',
        direccion: '',
        latitud: CENTRO_MAPA.latitud,
        longitud: CENTRO_MAPA.longitud,
        contactoNombre: '',
        contactoTelefono: '',
      });
      this.puntosDraft.set([]);
      return;
    }
    const c = this.detalle()?.campos.find((x) => x.id === id);
    if (!c) {
      return;
    }
    this.campoForm.reset({
      nombre: c.nombre,
      codigo: c.codigo,
      superficieHa: c.superficieHa,
      localidad: c.localidad,
      provincia: c.provincia,
      partido: c.partido,
      direccion: c.direccion,
      latitud: c.latitud,
      longitud: c.longitud,
      contactoNombre: c.contactoNombre,
      contactoTelefono: c.contactoTelefono,
    });
    this.puntosDraft.set(
      (c.puntosEntrada ?? [])
        .filter((p) => !p.eliminado)
        .map((p, i) => ({
          id: p.id,
          nombre: p.nombre || `Entrada ${i + 1}`,
          orden: p.orden || i + 1,
          latitud: p.latitud,
          longitud: p.longitud,
          observacion: p.observacion,
        })),
    );
    if (modo === 'ver') {
      this.campoForm.disable();
    } else {
      this.campoForm.enable();
    }
  }

  private cerrarDrawerForzado(): void {
    this.drawerAbierto.set(false);
    this.entidadId.set(null);
    this.formDirty.set(false);
  }

  private cerrarConfigModalForzado(): void {
    this.configModalAbierto.set(false);
    this.seleccionadoId.set(null);
    this.masterDirty.set(false);
  }
}
