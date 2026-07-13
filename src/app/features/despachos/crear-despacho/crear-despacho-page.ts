import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { SelectInput, SelectOption } from '../../../shared/ui/select/select-input';
import { StateWrapper } from '../../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../../shared/ui/table/table';
import { TableCellDef } from '../../../shared/ui/table/table-cell-def';
import { TextInput } from '../../../shared/ui/input/text-input';
import { Toast } from '../../../shared/ui/toast/toast';
import { EstadoDespacho, NuevoViaje } from '../data-access/despacho.model';
import { DespachoStore } from '../data-access/despacho.store';

const VIAJES_COLUMNS: TableColumn[] = [
  { key: 'chofer', label: 'Chofer' },
  { key: 'dominio', label: 'Dominio' },
  { key: 'destino', label: 'Destino' },
  { key: 'toneladas', label: 'Toneladas', align: 'right' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '90px' },
];

/**
 * Pantalla Crear despacho (Figma: Crear despacho 461:538).
 * Smart component: único que habla con DespachoStore en esta pantalla.
 */
@Component({
  selector: 'app-crear-despacho-page',
  imports: [
    ReactiveFormsModule,
    Button,
    Icon,
    SelectInput,
    StateWrapper,
    Table,
    TableCellDef,
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

  protected readonly viajesColumns = VIAJES_COLUMNS;
  protected readonly catalogos = this.store.catalogos;
  protected readonly guardando = signal(false);
  protected readonly mensajeExito = signal('');
  protected readonly viajes = signal<NuevoViaje[]>([]);

  protected readonly form = this.fb.group({
    nombre: ['', Validators.required],
    productorId: ['', Validators.required],
    campoId: [{ value: '', disabled: true }, Validators.required],
    origen: ['', Validators.required],
    entradaCampo: [''],
    material: ['', Validators.required],
    administradorId: ['', Validators.required],
    vendedorId: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaLlegadaEstimada: [''],
  });

  protected readonly viajeForm = this.fb.group({
    choferId: ['', Validators.required],
    destino: ['', Validators.required],
    toneladas: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
  });

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
  protected readonly choferOptions = computed<SelectOption[]>(() =>
    (this.catalogos().data?.choferes ?? []).map((ch) => ({
      value: ch.id,
      label: `${ch.nombre} (${ch.dominio})`,
    })),
  );

  // Campo depende de Productor: se habilita y filtra al elegir uno
  private readonly productorSeleccionado = toSignal(this.form.controls.productorId.valueChanges, {
    initialValue: '',
  });
  protected readonly campoOptions = computed<SelectOption[]>(() => {
    const productor = (this.catalogos().data?.productores ?? []).find(
      (p) => p.id === this.productorSeleccionado(),
    );
    return (productor?.campos ?? []).map((c) => ({ value: c.id, label: c.nombre }));
  });

  protected readonly viajesRows = computed(() =>
    this.viajes().map((viaje) => ({ ...viaje }) as unknown as Record<string, unknown>),
  );

  constructor() {
    this.store.cargarCatalogos();

    this.form.controls.productorId.valueChanges.subscribe(() => {
      const campo = this.form.controls.campoId;
      campo.reset('');
      campo.enable();
    });
  }

  protected fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    return control.touched && control.hasError('required') ? 'Este campo es obligatorio' : '';
  }

  protected agregarViaje(): void {
    if (this.viajeForm.invalid) {
      this.viajeForm.markAllAsTouched();
      return;
    }
    const { choferId, destino, toneladas } = this.viajeForm.getRawValue();
    const chofer = this.catalogos().data?.choferes.find((ch) => ch.id === choferId);
    if (!chofer) {
      return;
    }
    this.viajes.update((viajes) => [
      ...viajes,
      { chofer: chofer.nombre, dominio: chofer.dominio, destino, toneladas: Number(toneladas) },
    ]);
    this.viajeForm.reset();
  }

  protected quitarViaje(index: number): void {
    this.viajes.update((viajes) => viajes.filter((_, i) => i !== index));
  }

  protected guardar(estado: EstadoDespacho): void {
    this.mensajeExito.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.store
      .crearDespacho({ ...this.form.getRawValue(), estado, viajes: this.viajes() })
      .subscribe({
        next: (despacho) => {
          this.guardando.set(false);
          if (estado === 'borrador') {
            this.router.navigate(['/borradores']);
            return;
          }
          this.mensajeExito.set(`Despacho "${despacho.nombre}" creado correctamente`);
          this.form.reset();
          this.form.controls.campoId.disable();
          this.viajes.set([]);
        },
        error: () => this.guardando.set(false),
      });
  }
}
