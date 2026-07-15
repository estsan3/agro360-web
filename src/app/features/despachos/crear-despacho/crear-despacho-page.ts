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
import { NotificationStore } from '../../../notifications/state/notification.store';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { SelectInput, SelectOption } from '../../../shared/ui/select/select-input';
import { StateWrapper } from '../../../shared/ui/state-wrapper/state-wrapper';
import { TextInput } from '../../../shared/ui/input/text-input';
import { Toast } from '../../../shared/ui/toast/toast';
import { Despacho, EstadoDespacho, NuevoDespacho } from '../data-access/despacho.model';
import { DespachoStore } from '../data-access/despacho.store';

// TODO(backend): las entradas deberían venir por campo desde el catálogo
const ENTRADAS_CAMPO: SelectOption[] = [
  {
    value: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
    label: 'Entrada Norte (Lat: -32.9442, Lng: -60.6505)',
  },
  {
    value: 'Entrada Sur (Lat: -33.0100, Lng: -60.7200)',
    label: 'Entrada Sur (Lat: -33.0100, Lng: -60.7200)',
  },
];

type ViajeGroup = FormGroup<{
  choferId: FormControl<string>;
  dominio: FormControl<string>;
  destino: FormControl<string>;
  toneladas: FormControl<string>;
}>;

/**
 * Pantalla Crear despacho v2 (Figma): información general con tabs +
 * tabla editable de viajes (master-detail) con acciones masivas.
 */
@Component({
  selector: 'app-crear-despacho-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationStore);

  protected readonly catalogos = this.store.catalogos;
  protected readonly guardando = signal(false);
  protected readonly mensajeExito = signal('');
  // Une las entradas conocidas con la del borrador cargado (si difiere)
  private readonly entradaExtra = signal<string | null>(null);
  protected readonly entradaOptions = computed<SelectOption[]>(() => {
    const extra = this.entradaExtra();
    if (extra && !ENTRADAS_CAMPO.some((opcion) => opcion.value === extra)) {
      return [{ value: extra, label: extra }, ...ENTRADAS_CAMPO];
    }
    return ENTRADAS_CAMPO;
  });

  /** Modo edición de borrador (?borrador=<id>) */
  protected readonly editando = signal<{ id: string; nombre: string } | null>(null);
  private precargado = false;

  /** Tab activa de Información General (contenido de la 2 aún sin definir) */
  protected readonly tab = signal<1 | 2>(1);

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
  });

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
    (this.catalogos().data?.materiales ?? []).map((m) => ({ value: m, label: m })),
  );

  private readonly productorSeleccionado = toSignal(this.form.controls.productorId.valueChanges, {
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
    });

    this.agregarViaje();

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
  }

  private precargarBorrador(despacho: Despacho): void {
    this.editando.set({ id: despacho.id, nombre: despacho.nombre });
    this.entradaExtra.set(despacho.entradaCampo || null);

    const fecha = (valor: Date) =>
      `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`;

    // productorId dispara el reset/enable de campoId: setear campo después
    this.form.patchValue({
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
    });
    this.form.controls.campoId.setValue(despacho.campoId);

    const choferes = this.catalogos().data?.choferes ?? [];
    this.viajes.clear();
    for (const viaje of despacho.viajes.filter((v) => v.estado === 'borrador')) {
      const choferId =
        viaje.choferId ??
        choferes.find((ch) => ch.dominio === viaje.dominio)?.id ??
        choferes.find((ch) => ch.nombre === viaje.chofer)?.id ??
        '';
      this.viajes.push(
        this.crearFila({
          choferId,
          dominio: viaje.dominio,
          destino: viaje.destino,
          toneladas: String(viaje.toneladas),
        }),
      );
    }
    if (this.viajes.length === 0) {
      this.agregarViaje();
    }
  }

  protected fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    return control.touched && control.hasError('required') ? 'Este campo es obligatorio' : '';
  }

  // --- Tabs ---
  protected siguienteTab(): void {
    this.tab.set(2);
  }

  protected volverTab(): void {
    this.tab.set(1);
  }

  // --- Filas de viajes ---
  protected agregarViaje(): void {
    this.viajes.push(this.crearFila());
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

  protected choferElegido(index: number, event: Event): void {
    const choferId = (event.target as HTMLSelectElement).value;
    const grupo = this.viajes.at(index);
    grupo.controls.choferId.setValue(choferId, { emitEvent: false });
    const chofer = this.catalogos().data?.choferes.find((ch) => ch.id === choferId);
    if (chofer) {
      const patente = chofer.camiones[0]?.dominio ?? chofer.dominio;
      if (patente) {
        grupo.controls.dominio.setValue(patente);
      }
    }
  }

  protected patentesChofer(choferId: string): string[] {
    const chofer = this.catalogos().data?.choferes.find((ch) => ch.id === choferId);
    if (!chofer) {
      return [];
    }
    const patentes = chofer.camiones.map((c) => c.dominio);
    if (chofer.dominio && !patentes.includes(chofer.dominio)) {
      patentes.unshift(chofer.dominio);
    }
    return patentes;
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

  // --- Acciones masivas y por fila (TODO backend: generación real) ---
  protected accionMasiva(accion: 'carta de porte' | 'ticket de gasoil'): void {
    const cantidad = this.seleccionados().size;
    if (cantidad === 0) {
      this.notifications.warning('Sin viajes seleccionados', 'Marcá al menos un viaje');
      return;
    }
    this.notifications.success(
      accion === 'carta de porte' ? 'Cartas de porte generadas' : 'Tickets de gasoil asignados',
      `${cantidad} ${cantidad === 1 ? 'viaje' : 'viajes'}`,
    );
  }

  protected accionFila(index: number, accion: 'carta de porte' | 'ticket de gasoil'): void {
    this.notifications.success(
      accion === 'carta de porte' ? 'Carta de porte generada' : 'Ticket de gasoil asignado',
      `Viaje #${index + 1}`,
    );
  }

  // --- Guardado ---
  protected guardar(estado: EstadoDespacho): void {
    this.mensajeExito.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.tab.set(1);
      return;
    }

    const viajes = this.viajes.controls
      .map((grupo) => grupo.getRawValue())
      .filter((viaje) => viaje.destino && Number(viaje.toneladas) > 0)
      .map((viaje) => ({
        choferId: viaje.choferId,
        dominio: viaje.dominio.trim().toUpperCase(),
        destino: viaje.destino,
        toneladas: Number(viaje.toneladas),
      }));

    if (viajes.length === 0) {
      this.notifications.warning('Sin viajes', 'Agregá al menos un viaje con destino y toneladas');
      this.tab.set(2);
      return;
    }

    const sinChofer = viajes.some((viaje) => !viaje.choferId);
    if (sinChofer) {
      this.notifications.warning('Chofer requerido', 'Debe seleccionar un chofer');
      this.tab.set(2);
      return;
    }

    this.guardando.set(true);
    const form = this.form.getRawValue();
    const payload: NuevoDespacho = {
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
      estado,
      viajes,
    };
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
        this.mensajeExito.set(`Despacho "${despacho.nombre}" creado correctamente`);
        this.form.reset();
        this.form.controls.campoId.disable();
        this.viajes.clear();
        this.agregarViaje();
        this.seleccionados.set(new Set());
        this.tab.set(1);
      },
      error: () => this.guardando.set(false),
    });
  }

  private crearFila(base?: {
    choferId: string;
    dominio: string;
    destino: string;
    toneladas: string;
  }): ViajeGroup {
    return this.fb.group({
      choferId: [base?.choferId ?? ''],
      dominio: [base?.dominio ?? ''],
      destino: [base?.destino ?? ''],
      toneladas: [base?.toneladas ?? ''],
    }) as ViajeGroup;
  }
}
