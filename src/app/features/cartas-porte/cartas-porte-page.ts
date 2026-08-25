import { DatePipe, JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
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
import { TextInput } from '../../shared/ui/input/text-input';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { SelectInput, SelectOption } from '../../shared/ui/select/select-input';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { CartaPorte, EstadoCartaPorte } from './data-access/cartas-porte.model';
import { CartasPorteService } from './data-access/cartas-porte.service';

const ESTADOS_EDITABLES: ReadonlySet<EstadoCartaPorte> = new Set(['pendiente', 'error']);

const COLUMNS: TableColumn[] = [
  { key: 'tipoCpe', label: 'Tipo', width: '90px' },
  { key: 'estado', label: 'Estado', width: '110px' },
  { key: 'despachoId', label: 'Despacho', width: '90px' },
  { key: 'nroCtg', label: 'CTG', width: '130px' },
  { key: 'material', label: 'Material', width: '90px' },
  { key: 'dominio', label: 'Patente', width: '100px' },
  { key: 'origen', label: 'Origen' },
  { key: 'destino', label: 'Destino' },
  { key: 'toneladas', label: 'Tn', align: 'right', width: '70px' },
  { key: 'creadaEn', label: 'Creada', width: '140px' },
  { key: 'acciones', label: '', align: 'right', width: '200px' },
];

const FILTROS_VACIOS = {
  estado: '',
  tipoCpe: '',
  material: '',
  despachoId: '',
  dominio: '',
  origen: '',
  destino: '',
  nroCtg: '',
  documento: '',
  fechaDesde: '',
  fechaHasta: '',
};

@Component({
  selector: 'app-cartas-porte-page',
  imports: [
    DatePipe,
    JsonPipe,
    ReactiveFormsModule,
    Badge,
    Button,
    Icon,
    TextInput,
    SearchBar,
    SelectInput,
    StateWrapper,
    Table,
    TableCellDef,
  ],
  templateUrl: './cartas-porte-page.html',
  styleUrl: './cartas-porte-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartasPortePage implements OnInit {
  private readonly api = inject(CartasPorteService);
  private readonly notifications = inject(NotificationStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly columns = COLUMNS;
  protected readonly state = signal<AsyncState<CartaPorte[]>>(asyncIdle());
  protected readonly seleccionada = signal<CartaPorte | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtrosAbiertos = signal(false);
  private pdfObjectUrl: string | null = null;

  protected readonly filtrosForm = this.fb.group({ ...FILTROS_VACIOS });

  private readonly filtros = toSignal(this.filtrosForm.valueChanges, {
    initialValue: this.filtrosForm.getRawValue(),
  });

  protected readonly estadoOptions: SelectOption[] = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'error', label: 'Error' },
    { value: 'procesada', label: 'Procesada' },
    { value: 'autorizada', label: 'Autorizada' },
    { value: 'anulada', label: 'Anulada' },
  ];

  protected readonly tipoOptions: SelectOption[] = [
    { value: '74', label: '74 Automotor' },
    { value: '274', label: '274 Flete corto' },
  ];

  protected readonly documentoOptions: SelectOption[] = [
    { value: 'con', label: 'Con PDF' },
    { value: 'sin', label: 'Sin PDF' },
  ];

  protected readonly materialOptions = computed<SelectOption[]>(() => {
    const valores = new Set<string>();
    for (const carta of this.state().data ?? []) {
      if (carta.material) {
        valores.add(carta.material);
      }
    }
    return [...valores].sort().map((valor) => ({ value: valor, label: valor }));
  });

  protected readonly despachoOptions = computed<SelectOption[]>(() => {
    const valores = new Set<string>();
    for (const carta of this.state().data ?? []) {
      if (carta.despachoId) {
        valores.add(carta.despachoId);
      }
    }
    return [...valores].sort().map((valor) => ({ value: valor, label: valor }));
  });

  protected readonly origenOptions = computed<SelectOption[]>(() => {
    const valores = new Set<string>();
    for (const carta of this.state().data ?? []) {
      if (carta.origen) {
        valores.add(carta.origen);
      }
    }
    return [...valores].sort().map((valor) => ({ value: valor, label: valor }));
  });

  protected readonly destinoOptions = computed<SelectOption[]>(() => {
    const valores = new Set<string>();
    for (const carta of this.state().data ?? []) {
      if (carta.destino) {
        valores.add(carta.destino);
      }
    }
    return [...valores].sort().map((valor) => ({ value: valor, label: valor }));
  });

  protected readonly hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    return !!(
      f.estado ||
      f.tipoCpe ||
      f.material ||
      f.despachoId ||
      f.dominio ||
      f.origen ||
      f.destino ||
      f.nroCtg ||
      f.documento ||
      f.fechaDesde ||
      f.fechaHasta
    );
  });

  protected readonly filtradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const f = this.filtros();
    const desde = f.fechaDesde ? new Date(`${f.fechaDesde}T00:00:00`) : null;
    const hasta = f.fechaHasta ? new Date(`${f.fechaHasta}T23:59:59`) : null;
    const tipo = f.tipoCpe ? Number(f.tipoCpe) : null;
    const dominio = (f.dominio ?? '').trim().toLowerCase();
    const nroCtg = (f.nroCtg ?? '').trim().toLowerCase();

    return (this.state().data ?? []).filter((carta) => {
      if (f.estado && carta.estado !== f.estado) {
        return false;
      }
      if (tipo !== null && !Number.isNaN(tipo) && carta.tipoCpe !== tipo) {
        return false;
      }
      if (f.material && carta.material !== f.material) {
        return false;
      }
      if (f.despachoId && carta.despachoId !== f.despachoId) {
        return false;
      }
      if (dominio && !carta.dominio.toLowerCase().includes(dominio)) {
        return false;
      }
      if (f.origen && carta.origen !== f.origen) {
        return false;
      }
      if (f.destino && carta.destino !== f.destino) {
        return false;
      }
      if (nroCtg && !(carta.nroCtg ?? '').toLowerCase().includes(nroCtg)) {
        return false;
      }
      if (f.documento === 'con' && !carta.tieneDocumento) {
        return false;
      }
      if (f.documento === 'sin' && carta.tieneDocumento) {
        return false;
      }
      const creada = new Date(carta.creadaEn);
      if (desde && creada < desde) {
        return false;
      }
      if (hasta && creada > hasta) {
        return false;
      }
      if (
        texto &&
        !(
          carta.despachoId.toLowerCase().includes(texto) ||
          carta.viajeId.toLowerCase().includes(texto) ||
          carta.dominio.toLowerCase().includes(texto) ||
          carta.material.toLowerCase().includes(texto) ||
          carta.origen.toLowerCase().includes(texto) ||
          carta.destino.toLowerCase().includes(texto) ||
          (carta.nroCtg ?? '').toLowerCase().includes(texto) ||
          (carta.nroCartaPorte ?? '').toLowerCase().includes(texto) ||
          carta.estado.toLowerCase().includes(texto)
        )
      ) {
        return false;
      }
      return true;
    });
  });

  protected readonly rows = computed(() =>
    this.filtradas().map((c) => ({ ...c }) as Record<string, unknown>),
  );

  protected readonly emptyMessage = computed(() =>
    this.hayFiltrosActivos() || this.busqueda()
      ? 'No hay intenciones que coincidan con los filtros'
      : 'No hay intenciones de carta de porte. Creá una desde un despacho con CPE habilitada.',
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected toggleFiltros(): void {
    this.filtrosAbiertos.update((abierto) => !abierto);
  }

  protected limpiarFiltros(): void {
    this.filtrosForm.reset({ ...FILTROS_VACIOS });
    this.busqueda.set('');
  }

  protected cargar(): void {
    this.state.set(asyncLoading());
    this.api.listar().subscribe({
      next: (items) => this.state.set(asyncSuccess(items)),
      error: (err) =>
        this.state.set(
          asyncError(err?.error?.error?.mensaje ?? 'No se pudieron cargar las cartas de porte'),
        ),
    });
  }

  protected ver(carta: CartaPorte): void {
    this.revokePdf();
    this.seleccionada.set(carta);
    this.api.obtener(carta.id).subscribe({
      next: (detalle) => {
        this.seleccionada.set(detalle);
        if (detalle.tieneDocumento) {
          this.cargarPdf(detalle);
        }
      },
      error: (err) =>
        this.notifications.error(
          'Error al cargar detalle',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  protected cerrarDetalle(): void {
    this.revokePdf();
    this.seleccionada.set(null);
  }

  protected verDocumento(carta: CartaPorte): void {
    this.busyId.set(carta.id);
    this.api.documento(carta.id).subscribe({
      next: (blob) => {
        this.busyId.set(null);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        this.busyId.set(null);
        this.notifications.error('Documento no disponible', 'No se pudo abrir el PDF');
      },
    });
  }

  protected descargarDocumento(carta: CartaPorte): void {
    this.busyId.set(carta.id);
    this.api.documento(carta.id).subscribe({
      next: (blob) => {
        this.busyId.set(null);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cpe_${carta.nroCtg || carta.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.busyId.set(null);
        this.notifications.error('Documento no disponible', 'No se pudo descargar el PDF');
      },
    });
  }

  protected esEditable(estado: string): boolean {
    return ESTADOS_EDITABLES.has(estado as EstadoCartaPorte);
  }

  protected editarIntencion(carta: CartaPorte): void {
    if (!this.esEditable(carta.estado)) {
      return;
    }
    this.router.navigate(['/despachos'], {
      queryParams: {
        editar: carta.despachoId,
        carta: carta.id,
        viaje: carta.viajeId,
      },
    });
  }

  protected esProcesada(estado: string): boolean {
    return estado === 'procesada' || estado === 'autorizada';
  }

  protected enviar(carta: CartaPorte): void {
    this.busyId.set(carta.id);
    this.api.enviar(carta.id).subscribe({
      next: (actualizada) => {
        this.busyId.set(null);
        this.notifications.success(
          'CPE autorizada',
          actualizada.nroCtg ? `CTG ${actualizada.nroCtg}` : carta.dominio,
        );
        if (this.seleccionada()?.id === carta.id) {
          this.seleccionada.set(actualizada);
          if (actualizada.tieneDocumento) {
            this.cargarPdf(actualizada);
          }
        }
        this.cargar();
      },
      error: (err) => {
        this.busyId.set(null);
        this.notifications.error(
          'ARCA rechazó la CPE',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        );
        this.cargar();
      },
    });
  }

  protected anular(carta: CartaPorte): void {
    if (!confirm(`¿Anular la CPE ${carta.nroCtg || carta.dominio} ante ARCA?`)) {
      return;
    }
    this.busyId.set(carta.id);
    this.api.anular(carta.id).subscribe({
      next: (actualizada) => {
        this.busyId.set(null);
        this.notifications.success('CPE anulada', actualizada.nroCtg || carta.dominio);
        if (this.seleccionada()?.id === carta.id) {
          this.seleccionada.set(actualizada);
        }
        this.cargar();
      },
      error: (err) => {
        this.busyId.set(null);
        this.notifications.error(
          'No se pudo anular',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        );
        this.cargar();
      },
    });
  }

  protected reintentar(carta: CartaPorte): void {
    this.busyId.set(carta.id);
    this.api.reintentar(carta.id).subscribe({
      next: (actualizada) => {
        this.busyId.set(null);
        this.notifications.success('Payload regenerado', `Intento #${actualizada.intentos}`);
        if (this.seleccionada()?.id === carta.id) {
          this.seleccionada.set(actualizada);
        }
        this.cargar();
      },
      error: (err) => {
        this.busyId.set(null);
        this.notifications.error(
          'No se pudo reintentar',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        );
        this.cargar();
      },
    });
  }

  protected eliminar(carta: CartaPorte): void {
    if (!confirm(`¿Eliminar la intención CPE de ${carta.dominio} → ${carta.destino}?`)) {
      return;
    }
    this.busyId.set(carta.id);
    this.api.eliminar(carta.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.notifications.success('Intención eliminada', carta.dominio);
        if (this.seleccionada()?.id === carta.id) {
          this.cerrarDetalle();
        }
        this.cargar();
      },
      error: (err) => {
        this.busyId.set(null);
        this.notifications.error(
          'No se pudo eliminar',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        );
      },
    });
  }

  protected badgeVariant(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'pendiente') return 'warning';
    if (estado === 'procesada' || estado === 'autorizada') return 'success';
    if (estado === 'error' || estado === 'anulada') return 'danger';
    return 'neutral';
  }

  protected tipoEtiqueta(tipo: number): string {
    if (tipo === 274) return '274 flete corto';
    if (tipo === 74) return '74 automotor';
    return String(tipo);
  }

  private cargarPdf(carta: CartaPorte): void {
    this.api.documento(carta.id).subscribe({
      next: (blob) => {
        this.revokePdf();
        this.pdfObjectUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl));
      },
      error: () => this.pdfUrl.set(null),
    });
  }

  private revokePdf(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
    this.pdfUrl.set(null);
  }
}
