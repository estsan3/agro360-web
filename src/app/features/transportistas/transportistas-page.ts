import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationStore } from '../../notifications/state/notification.store';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { FileUpload } from '../../shared/ui/file-upload/file-upload';
import { Icon } from '../../shared/ui/icon/icon';
import { SelectInput, SelectOption } from '../../shared/ui/select/select-input';
import { Modal } from '../../shared/ui/modal/modal';
import { SideDrawer } from '../../shared/ui/side-drawer/side-drawer';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { TextInput } from '../../shared/ui/input/text-input';
import {
  CamionTransportista,
  ChoferTransportista,
  DrawerEntidad,
  DrawerModo,
  FiltroActivo,
  Transportista,
} from './data-access/transportistas.model';
import { TransportistasService } from './data-access/transportistas.service';
import { TransportistasStore } from './data-access/transportistas.store';

const PATENTE_AR = /^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/i;
const CUIT_AR = /^\d{2}-\d{8}-\d$/;
const EMPRESAS_POR_PAGINA = 20;

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

const EMPRESAS_COLUMNS: TableColumn[] = [
  { key: 'nombreFantasia', label: 'Nombre fantasía' },
  { key: 'razonSocial', label: 'Razón social' },
  { key: 'cuit', label: 'CUIT' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '96px' },
];

const CAMIONES_COLUMNS: TableColumn[] = [
  { key: 'dominio', label: 'Dominio', width: '90px' },
  { key: 'marca', label: 'Marca', width: '100px' },
  { key: 'modelo', label: 'Modelo', width: '100px' },
  { key: 'tipo', label: 'Tipo', width: '110px' },
  { key: 'nroChasis', label: 'Nº chasis', width: '140px' },
  { key: 'nroMotor', label: 'Nº motor', width: '120px' },
  { key: 'estado', label: 'Estado', width: '80px' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '96px' },
];

const CHOFERES_COLUMNS: TableColumn[] = [
  { key: 'nombre', label: 'Nombre', width: '90px' },
  { key: 'apellido', label: 'Apellido', width: '90px' },
  { key: 'documento', label: 'DNI', width: '80px' },
  { key: 'direccion', label: 'Dirección', width: '130px' },
  { key: 'telefono', label: 'Teléfono', width: '100px' },
  { key: 'edad', label: 'Edad', width: '48px' },
  { key: 'fechaNacimiento', label: 'Nacimiento', width: '96px' },
  { key: 'licenciaTipo', label: 'Licencia', width: '72px' },
  { key: 'licenciaVencimiento', label: 'Vencimiento', width: '96px' },
  { key: 'camion', label: 'Camión', width: '80px' },
  { key: 'estado', label: 'Estado', width: '72px' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '96px' },
];

@Component({
  selector: 'app-transportistas-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Badge,
    Button,
    FileUpload,
    Icon,
    SelectInput,
    Modal,
    SideDrawer,
    StateWrapper,
    Table,
    TableCellDef,
    TextInput,
  ],
  templateUrl: './transportistas-page.html',
  styleUrl: './transportistas-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportistasPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TransportistasService);
  private readonly store = inject(TransportistasStore);
  private readonly notifications = inject(NotificationStore);

  protected readonly empresasColumns = EMPRESAS_COLUMNS;
  protected readonly camionesColumns = CAMIONES_COLUMNS;
  protected readonly choferesColumns = CHOFERES_COLUMNS;

  protected readonly busqueda = signal('');
  protected readonly filtro = signal<FiltroActivo>('activos');
  protected readonly busquedaCamiones = signal('');
  protected readonly filtroCamiones = signal<FiltroActivo>('activos');
  protected readonly busquedaChoferes = signal('');
  protected readonly filtroChoferes = signal<FiltroActivo>('activos');
  protected readonly paginaEmpresas = signal(1);
  protected readonly seleccionadoId = signal<string | null>(null);
  protected readonly configModalAbierto = signal(false);
  protected readonly masterDirty = signal(false);
  protected readonly drawerAbierto = signal(false);
  protected readonly drawerEntidad = signal<DrawerEntidad>('empresa');
  protected readonly drawerModo = signal<DrawerModo>('crear');
  protected readonly entidadId = signal<string | null>(null);
  protected readonly formDirty = signal(false);

  protected readonly empresasState = this.store.empresas;
  protected readonly detalleState = this.store.detalle;

  protected readonly filtroOptions: SelectOption[] = [
    { value: 'activos', label: 'Solo activos' },
    { value: 'inactivos', label: 'Solo inactivos' },
    { value: 'todos', label: 'Todos (sin eliminados)' },
  ];

  protected readonly empresaForm = this.fb.group({
    nombreFantasia: [''],
    razonSocial: [''],
    cuit: ['', Validators.pattern(CUIT_AR)],
    direccion: [''],
    email: [''],
    telefono: [''],
    paginaWeb: [''],
  });

  protected readonly choferForm = this.fb.group({
    nombre: [''],
    apellido: [''],
    documento: [''],
    direccion: [''],
    telefono: [''],
    edad: [0],
    fechaNacimiento: [''],
    licenciaTipo: [''],
    licenciaVencimiento: [''],
    camionId: [''],
    fotoLicencia: [undefined as ChoferTransportista['fotoLicencia']],
    fotoDniFrente: [undefined as ChoferTransportista['fotoDniFrente']],
    fotoDniDorso: [undefined as ChoferTransportista['fotoDniDorso']],
  });

  protected readonly camionForm = this.fb.group({
    dominio: ['', Validators.pattern(PATENTE_AR)],
    marca: [''],
    modelo: [''],
    tipo: [''],
    nroChasis: ['', Validators.maxLength(20)],
    nroMotor: ['', Validators.maxLength(20)],
    fotoTarjetaVerde: [undefined as CamionTransportista['fotoTarjetaVerde']],
  });

  protected readonly empresasRows = computed(() =>
    (this.empresasState().data ?? []).map(
      (e) =>
        ({
          ...e,
          estado: e.activo ? 'Activo' : 'Inactivo',
        }) as Record<string, unknown>,
    ),
  );

  protected readonly totalEmpresas = computed(() => this.empresasRows().length);

  protected readonly totalPaginasEmpresas = computed(() =>
    Math.max(1, Math.ceil(this.totalEmpresas() / EMPRESAS_POR_PAGINA)),
  );

  protected readonly empresasRowsPagina = computed(() => {
    const pagina = Math.min(this.paginaEmpresas(), this.totalPaginasEmpresas());
    const inicio = (pagina - 1) * EMPRESAS_POR_PAGINA;
    return this.empresasRows().slice(inicio, inicio + EMPRESAS_POR_PAGINA);
  });

  protected readonly rangoEmpresas = computed(() => {
    if (this.totalEmpresas() === 0) {
      return '0 de 0';
    }
    const pagina = Math.min(this.paginaEmpresas(), this.totalPaginasEmpresas());
    const desde = (pagina - 1) * EMPRESAS_POR_PAGINA + 1;
    const hasta = Math.min(pagina * EMPRESAS_POR_PAGINA, this.totalEmpresas());
    return `${desde}-${hasta} de ${this.totalEmpresas()}`;
  });

  protected readonly detalle = computed(() => this.detalleState().data ?? null);

  protected readonly camionesRows = computed(() => {
    const detalle = this.detalle();
    if (!detalle) {
      return [];
    }
    return filtrarPorEstadoYBusqueda(
      detalle.camiones,
      this.filtroCamiones(),
      this.busquedaCamiones(),
      (c) => `${c.dominio} ${c.marca} ${c.modelo} ${c.tipo} ${c.nroChasis} ${c.nroMotor}`,
    ).map(
      (c) =>
        ({
          ...c,
          estado: c.activo ? 'Activo' : 'Inactivo',
        }) as Record<string, unknown>,
    );
  });

  protected readonly choferesRows = computed(() => {
    const detalle = this.detalle();
    if (!detalle) {
      return [];
    }
    return filtrarPorEstadoYBusqueda(
      detalle.choferes,
      this.filtroChoferes(),
      this.busquedaChoferes(),
      (c) => {
        const camion = detalle.camiones.find((m) => m.id === c.camionId);
        return `${c.nombre} ${c.apellido} ${c.documento} ${c.telefono} ${camion?.dominio ?? ''}`;
      },
    ).map((c) => {
      const camion = detalle.camiones.find((m) => m.id === c.camionId);
      return {
        ...c,
        camion: camion?.dominio ?? '—',
        estado: c.activo ? 'Activo' : 'Inactivo',
      } as Record<string, unknown>;
    });
  });

  protected readonly tipoVehiculoOptions = computed<SelectOption[]>(() =>
    (this.store.tiposVehiculo() ?? []).map((t) => ({ value: t, label: t })),
  );

  protected readonly tipoLicenciaOptions = computed<SelectOption[]>(() =>
    (this.store.tiposLicencia() ?? []).map((t) => ({ value: t, label: t })),
  );

  protected readonly camionAsociadoOptions = computed<SelectOption[]>(() => {
    const detalle = this.detalle();
    if (!detalle) {
      return [{ value: '', label: 'Sin camión' }];
    }
    return [
      { value: '', label: 'Sin camión' },
      ...detalle.camiones
        .filter((c) => !c.eliminado && c.activo)
        .map((c) => ({ value: c.id, label: `${c.dominio} · ${c.marca} ${c.modelo}` })),
    ];
  });

  protected readonly configModalTitulo = computed(() => {
    const det = this.detalle();
    const nombre = det?.nombreFantasia || det?.razonSocial || 'Empresa';
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
      empresa: 'empresa transportista',
      chofer: 'chofer',
      camion: 'camión',
    };
    return `${prefijos[modo]} ${nombres[entidad]}`;
  });

  protected readonly soloLectura = computed(() => this.drawerModo() === 'ver');

  protected errorEmpresa(campo: string): string {
    const control = this.empresaForm.get(campo);
    if (!control?.touched || !control.errors) {
      return '';
    }
    if (control.errors['pattern']) {
      return 'Formato inválido. Usá XX-XXXXXXXX-X';
    }
    return '';
  }

  constructor() {
    this.store.cargarParametria();
    this.recargarEmpresas();
    this.empresaForm.valueChanges.subscribe(() => {
      if (this.configModalAbierto()) {
        this.masterDirty.set(true);
      } else if (this.drawerAbierto()) {
        this.formDirty.set(true);
      }
    });
    this.choferForm.valueChanges.subscribe(() => this.formDirty.set(true));
    this.camionForm.valueChanges.subscribe(() => this.formDirty.set(true));
  }

  protected recargarEmpresas(): void {
    this.store.cargarEmpresas(this.filtro(), this.busqueda());
  }

  protected onBusquedaChange(valor: string): void {
    this.busqueda.set(valor);
    this.paginaEmpresas.set(1);
    this.recargarEmpresas();
  }

  protected onFiltroChange(valor: string): void {
    this.filtro.set(valor as FiltroActivo);
    this.paginaEmpresas.set(1);
    this.recargarEmpresas();
  }

  protected paginaAnteriorEmpresas(): void {
    if (this.paginaEmpresas() > 1) {
      this.paginaEmpresas.update((p) => p - 1);
    }
  }

  protected paginaSiguienteEmpresas(): void {
    if (this.paginaEmpresas() < this.totalPaginasEmpresas()) {
      this.paginaEmpresas.update((p) => p + 1);
    }
  }

  protected abrirConfigEmpresa(id: string): void {
    this.seleccionadoId.set(id);
    this.masterDirty.set(false);
    this.busquedaCamiones.set('');
    this.filtroCamiones.set('activos');
    this.busquedaChoferes.set('');
    this.filtroChoferes.set('activos');
    this.configModalAbierto.set(true);
    this.store.refrescarDetalle(id).subscribe((detalle) => {
      this.empresaForm.enable();
      this.empresaForm.reset({
        nombreFantasia: detalle.nombreFantasia,
        razonSocial: detalle.razonSocial,
        cuit: detalle.cuit,
        direccion: detalle.direccion,
        email: detalle.email,
        telefono: detalle.telefono,
        paginaWeb: detalle.paginaWeb,
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

  protected guardarMasterEmpresa(): void {
    const id = this.seleccionadoId();
    if (!id) {
      return;
    }
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }
    const body = this.empresaForm.getRawValue() as Partial<Transportista>;
    this.api.actualizar(id, body).subscribe((detalle) => {
      this.notifications.success(
        'Empresa actualizada',
        detalle.nombreFantasia || detalle.razonSocial,
      );
      this.masterDirty.set(false);
      this.recargarEmpresas();
      this.store.refrescarDetalle(id).subscribe();
    });
  }

  protected abrirDrawer(entidad: DrawerEntidad, modo: DrawerModo, id: string | null = null): void {
    this.drawerEntidad.set(entidad);
    this.drawerModo.set(modo);
    this.entidadId.set(id);
    this.formDirty.set(false);

    if (entidad === 'empresa') {
      this.resetEmpresaForm(modo, id);
    } else if (entidad === 'chofer') {
      this.resetChoferForm(modo, id);
    } else {
      this.resetCamionForm(modo, id);
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

    if (entidad === 'empresa') {
      this.guardarEmpresa();
    } else if (entidad === 'chofer') {
      this.guardarChofer(modo);
    } else {
      this.guardarCamion(modo);
    }
  }

  protected toggleActivoEmpresa(empresa: Transportista): void {
    this.api.cambiarActivo(empresa.id, !empresa.activo).subscribe(() => {
      this.notifications.success(
        empresa.activo ? 'Empresa desactivada' : 'Empresa activada',
        empresa.nombreFantasia || empresa.razonSocial,
      );
      this.recargarEmpresas();
      if (this.seleccionadoId() === empresa.id) {
        this.store.cargarDetalle(empresa.id);
      }
    });
  }

  protected eliminarEmpresa(empresa: Transportista): void {
    if (!window.confirm(`¿Eliminar ${empresa.nombreFantasia || empresa.razonSocial}?`)) {
      return;
    }
    this.api.eliminar(empresa.id).subscribe(() => {
      this.notifications.warning('Empresa eliminada', 'Baja lógica registrada');
      if (this.seleccionadoId() === empresa.id) {
        this.cerrarConfigModalForzado();
      }
      this.recargarEmpresas();
    });
  }

  protected toggleActivoChofer(chofer: ChoferTransportista): void {
    const transportistaId = this.seleccionadoId();
    if (!transportistaId) {
      return;
    }
    this.api.cambiarActivoChofer(transportistaId, chofer.id, !chofer.activo).subscribe(() => {
      this.store.refrescarDetalle(transportistaId).subscribe();
    });
  }

  protected eliminarChofer(chofer: ChoferTransportista): void {
    const transportistaId = this.seleccionadoId();
    if (!transportistaId || !window.confirm(`¿Eliminar a ${chofer.nombre} ${chofer.apellido}?`)) {
      return;
    }
    this.api.eliminarChofer(transportistaId, chofer.id).subscribe(() => {
      this.store.refrescarDetalle(transportistaId).subscribe();
    });
  }

  protected toggleActivoCamion(camion: CamionTransportista): void {
    const transportistaId = this.seleccionadoId();
    if (!transportistaId) {
      return;
    }
    this.api.cambiarActivoCamion(transportistaId, camion.id, !camion.activo).subscribe(() => {
      this.store.refrescarDetalle(transportistaId).subscribe();
    });
  }

  protected eliminarCamion(camion: CamionTransportista): void {
    const transportistaId = this.seleccionadoId();
    if (!transportistaId || !window.confirm(`¿Eliminar patente ${camion.dominio}?`)) {
      return;
    }
    this.api.eliminarCamion(transportistaId, camion.id).subscribe(() => {
      this.store.refrescarDetalle(transportistaId).subscribe();
    });
  }

  private guardarEmpresa(): void {
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }
    const body = this.empresaForm.getRawValue() as Partial<Transportista>;
    this.api.crear(body).subscribe((detalle) => {
      this.notifications.success('Empresa creada', detalle.nombreFantasia || detalle.razonSocial);
      this.cerrarDrawerForzado();
      this.recargarEmpresas();
      this.abrirConfigEmpresa(detalle.id);
    });
  }

  private guardarChofer(modo: DrawerModo): void {
    const transportistaId = this.seleccionadoId();
    if (!transportistaId) {
      return;
    }
    const raw = this.choferForm.getRawValue();
    const body = {
      nombre: raw.nombre ?? '',
      apellido: raw.apellido ?? '',
      documento: raw.documento ?? '',
      direccion: raw.direccion ?? '',
      telefono: raw.telefono ?? '',
      edad: raw.edad ?? 0,
      fechaNacimiento: raw.fechaNacimiento ?? '',
      licenciaTipo: raw.licenciaTipo ?? '',
      licenciaVencimiento: raw.licenciaVencimiento ?? '',
      camionId: raw.camionId ? raw.camionId : null,
      fotoLicencia: raw.fotoLicencia ?? undefined,
      fotoDniFrente: raw.fotoDniFrente ?? undefined,
      fotoDniDorso: raw.fotoDniDorso ?? undefined,
    } satisfies Partial<ChoferTransportista>;
    const obs =
      modo === 'crear'
        ? this.api.crearChofer(transportistaId, body)
        : this.api.actualizarChofer(transportistaId, this.entidadId()!, body);

    obs.subscribe(() => {
      this.notifications.success(
        modo === 'crear' ? 'Chofer agregado' : 'Chofer actualizado',
        `${body.nombre} ${body.apellido}`,
      );
      this.cerrarDrawerForzado();
      this.store.refrescarDetalle(transportistaId).subscribe();
    });
  }

  private guardarCamion(modo: DrawerModo): void {
    const transportistaId = this.seleccionadoId();
    if (!transportistaId) {
      return;
    }
    if (this.camionForm.invalid) {
      this.camionForm.markAllAsTouched();
      return;
    }
    const body = this.camionForm.getRawValue() as Partial<CamionTransportista>;
    const obs =
      modo === 'crear'
        ? this.api.crearCamion(transportistaId, body)
        : this.api.actualizarCamion(transportistaId, this.entidadId()!, body);

    obs.subscribe(() => {
      this.notifications.success(
        modo === 'crear' ? 'Camión agregado' : 'Camión actualizado',
        body.dominio ?? '',
      );
      this.cerrarDrawerForzado();
      this.store.refrescarDetalle(transportistaId).subscribe();
    });
  }

  private resetEmpresaForm(modo: DrawerModo, id: string | null): void {
    if (modo === 'crear') {
      this.empresaForm.reset({
        nombreFantasia: '',
        razonSocial: '',
        cuit: '',
        direccion: '',
        email: '',
        telefono: '',
        paginaWeb: '',
      });
      return;
    }
    const empresa =
      id === this.seleccionadoId()
        ? this.detalle()
        : this.empresasState().data?.find((e) => e.id === id);
    if (!empresa) {
      return;
    }
    this.empresaForm.reset({
      nombreFantasia: empresa.nombreFantasia,
      razonSocial: empresa.razonSocial,
      cuit: empresa.cuit,
      direccion: empresa.direccion,
      email: empresa.email,
      telefono: empresa.telefono,
      paginaWeb: empresa.paginaWeb,
    });
    if (modo === 'ver') {
      this.empresaForm.disable();
    } else {
      this.empresaForm.enable();
    }
  }

  private resetChoferForm(modo: DrawerModo, id: string | null): void {
    this.choferForm.enable();
    if (modo === 'crear') {
      this.choferForm.reset({
        nombre: '',
        apellido: '',
        documento: '',
        direccion: '',
        telefono: '',
        edad: 0,
        fechaNacimiento: '',
        licenciaTipo: '',
        licenciaVencimiento: '',
        camionId: '',
        fotoLicencia: undefined,
        fotoDniFrente: undefined,
        fotoDniDorso: undefined,
      });
      return;
    }
    const chofer = this.detalle()?.choferes.find((c) => c.id === id);
    if (!chofer) {
      return;
    }
    this.choferForm.reset({
      nombre: chofer.nombre,
      apellido: chofer.apellido,
      documento: chofer.documento,
      direccion: chofer.direccion,
      telefono: chofer.telefono,
      edad: chofer.edad,
      fechaNacimiento: chofer.fechaNacimiento,
      licenciaTipo: chofer.licenciaTipo,
      licenciaVencimiento: chofer.licenciaVencimiento,
      camionId: chofer.camionId ?? '',
      fotoLicencia: chofer.fotoLicencia,
      fotoDniFrente: chofer.fotoDniFrente,
      fotoDniDorso: chofer.fotoDniDorso,
    });
    if (modo === 'ver') {
      this.choferForm.disable();
    }
  }

  private resetCamionForm(modo: DrawerModo, id: string | null): void {
    this.camionForm.enable();
    if (modo === 'crear') {
      this.camionForm.reset({
        dominio: '',
        marca: '',
        modelo: '',
        tipo: '',
        nroChasis: '',
        nroMotor: '',
        fotoTarjetaVerde: undefined,
      });
      return;
    }
    const camion = this.detalle()?.camiones.find((c) => c.id === id);
    if (!camion) {
      return;
    }
    this.camionForm.reset({
      dominio: camion.dominio,
      marca: camion.marca,
      modelo: camion.modelo,
      tipo: camion.tipo,
      nroChasis: camion.nroChasis,
      nroMotor: camion.nroMotor,
      fotoTarjetaVerde: camion.fotoTarjetaVerde,
    });
    if (modo === 'ver') {
      this.camionForm.disable();
    }
  }

  private cerrarConfigModalForzado(): void {
    this.configModalAbierto.set(false);
    this.seleccionadoId.set(null);
    this.masterDirty.set(false);
  }

  private cerrarDrawerForzado(): void {
    this.drawerAbierto.set(false);
    this.entidadId.set(null);
    this.formDirty.set(false);
    this.empresaForm.enable();
    this.choferForm.enable();
    this.camionForm.enable();
  }
}
