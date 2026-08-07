import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AsyncState,
  asyncError,
  asyncIdle,
  asyncLoading,
  asyncSuccess,
} from '../../core/models/async-state';
import { NotificationStore } from '../../notifications/state/notification.store';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { SelectInput, SelectOption } from '../../shared/ui/select/select-input';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { TransportistaDetalle } from '../transportistas/data-access/transportistas.model';
import { TransportistasService } from '../transportistas/data-access/transportistas.service';
import { EntradaListaEspera } from './data-access/lista-espera.model';
import { ListaEsperaService } from './data-access/lista-espera.service';

const COLUMNS: TableColumn[] = [
  { key: 'orden', label: '#', width: '56px' },
  { key: 'choferNombre', label: 'Chofer', width: '160px' },
  { key: 'dominio', label: 'Patente', width: '110px' },
  { key: 'transportistaNombre', label: 'Transportista' },
  { key: 'capacidadTn', label: 'Cap. tn', align: 'right', width: '90px' },
  { key: 'tipoUnidad', label: 'Tipo', width: '100px' },
  { key: 'estado', label: 'Estado', width: '120px' },
  { key: 'anotadoEn', label: 'Anotado', width: '160px' },
  { key: 'acciones', label: '', align: 'right', width: '80px' },
];

@Component({
  selector: 'app-lista-espera-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    Button,
    Icon,
    SelectInput,
    StateWrapper,
    Table,
    TableCellDef,
    Badge,
  ],
  templateUrl: './lista-espera-page.html',
  styleUrl: './lista-espera-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaEsperaPage implements OnInit {
  private readonly api = inject(ListaEsperaService);
  private readonly transportistasApi = inject(TransportistasService);
  private readonly notifications = inject(NotificationStore);
  private readonly fb = inject(FormBuilder);

  protected readonly columns = COLUMNS;
  protected readonly listaState = signal<AsyncState<EntradaListaEspera[]>>(asyncIdle());
  protected readonly transportistas = signal<TransportistaDetalle[]>([]);

  protected readonly formAnotar = this.fb.group({
    transportistaId: ['', Validators.required],
    choferId: ['', Validators.required],
    camionId: ['', Validators.required],
  });

  protected readonly transportistaOptions = computed<SelectOption[]>(() =>
    this.transportistas()
      .filter((t) => t.activo && !t.esFlotaPropia)
      .map((t) => ({
        value: t.id,
        label: t.nombreFantasia || t.razonSocial,
      })),
  );

  protected readonly choferOptions = computed<SelectOption[]>(() => {
    const tid = this.formAnotar.controls.transportistaId.value;
    const t = this.transportistas().find((x) => x.id === tid);
    return (t?.choferes ?? [])
      .filter((c) => c.activo && !c.eliminado && c.camionId)
      .map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}`.trim() }));
  });

  protected readonly camionOptions = computed<SelectOption[]>(() => {
    const tid = this.formAnotar.controls.transportistaId.value;
    const choferId = this.formAnotar.controls.choferId.value;
    const t = this.transportistas().find((x) => x.id === tid);
    const chofer = t?.choferes.find((c) => c.id === choferId);
    return (t?.camiones ?? [])
      .filter((c) => c.activo && !c.eliminado && (!chofer?.camionId || c.id === chofer.camionId))
      .map((c) => ({ value: c.id, label: `${c.dominio} (${c.tipo || 'tolva'})` }));
  });

  protected readonly rows = computed(() =>
    (this.listaState().data ?? []).map((e, i) => ({
      ...e,
      orden: i + 1,
      capacidadTn: e.capacidadTn ?? '—',
    })),
  );

  ngOnInit(): void {
    this.cargar();
    this.formAnotar.controls.transportistaId.valueChanges.subscribe(() => {
      this.formAnotar.patchValue({ choferId: '', camionId: '' }, { emitEvent: false });
    });
    this.formAnotar.controls.choferId.valueChanges.subscribe((choferId) => {
      const tid = this.formAnotar.controls.transportistaId.value;
      const t = this.transportistas().find((x) => x.id === tid);
      const chofer = t?.choferes.find((c) => c.id === choferId);
      this.formAnotar.patchValue({ camionId: chofer?.camionId ?? '' }, { emitEvent: false });
    });
    this.transportistasApi.listar('activos', '').subscribe({
      next: (lista) => {
        const candidatos = lista.filter((t) => !t.esFlotaPropia).slice(0, 15);
        for (const t of candidatos) {
          this.transportistasApi.obtener(t.id).subscribe({
            next: (detalle) =>
              this.transportistas.update((actual) => [
                ...actual.filter((x) => x.id !== detalle.id),
                detalle,
              ]),
          });
        }
      },
    });
  }

  protected cargar(): void {
    this.listaState.set(asyncLoading());
    this.api.listar().subscribe({
      next: (data) => this.listaState.set(asyncSuccess(data)),
      error: (err) =>
        this.listaState.set(asyncError(err?.error?.error?.mensaje ?? 'Error al cargar lista')),
    });
  }

  protected anotar(): void {
    if (this.formAnotar.invalid) {
      this.formAnotar.markAllAsTouched();
      return;
    }
    const { choferId, camionId } = this.formAnotar.getRawValue();
    this.api.anotar(choferId!, camionId!).subscribe({
      next: () => {
        this.notifications.success('Anotado', 'Unidad agregada a la lista de espera');
        this.formAnotar.patchValue({ choferId: '', camionId: '' });
        this.cargar();
      },
      error: (err) =>
        this.notifications.error(
          'No se pudo anotar',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  protected quitar(entrada: EntradaListaEspera): void {
    this.api.quitar(entrada.id).subscribe({
      next: () => {
        this.notifications.success('Quitado', entrada.dominio);
        this.cargar();
      },
      error: (err) =>
        this.notifications.error(
          'No se pudo quitar',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  protected rechazar(entrada: EntradaListaEspera): void {
    this.api.rechazar(entrada.id).subscribe({
      next: () => {
        this.notifications.success('Al fondo', `${entrada.dominio} vuelve al final`);
        this.cargar();
      },
      error: (err) =>
        this.notifications.error(
          'No se pudo rechazar',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  protected badgeVariant(estado: string): 'success' | 'info' | 'neutral' {
    if (estado === 'ofertado') {
      return 'info';
    }
    if (estado === 'en_espera') {
      return 'success';
    }
    return 'neutral';
  }
}
