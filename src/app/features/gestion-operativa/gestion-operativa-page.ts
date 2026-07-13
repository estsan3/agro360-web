import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationStore } from '../../notifications/state/notification.store';
import { KpiCard } from '../../shared/ui/kpi-card/kpi-card';
import { MensajeriaStore } from '../mensajeria/data-access/mensajeria.store';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { ProgressBar, ProgressVariant } from '../../shared/ui/progress-bar/progress-bar';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../shared/ui/table/table';
import { TableCellDef } from '../../shared/ui/table/table-cell-def';
import { EstadoViaje, Viaje } from '../despachos/data-access/despacho.model';
import { DespachoStore } from '../despachos/data-access/despacho.store';

interface CampaniaVm {
  id: string;
  nombre: string;
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
const VIAJES_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID', width: '96px' },
  { key: 'chofer', label: 'Chofer / Patente', width: '170px' },
  { key: 'destino', label: 'Destino' },
  { key: 'toneladas', label: 'Toneladas', align: 'right', width: '90px' },
  { key: 'estado', label: 'Estado', width: '150px' },
  { key: 'progreso', label: 'Progreso', width: '230px' },
  { key: 'observaciones', label: 'Obs.', width: '150px' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '140px' },
];

const PROGRESS_VARIANT: Record<EstadoViaje, ProgressVariant> = {
  borrador: 'neutral',
  completado: 'success',
  'en-viaje': 'info',
  retrasado: 'danger',
  pendiente: 'neutral',
};

/**
 * Gestión operativa (Figma: 720:856 + Tabla gestion operativa del kit):
 * campañas activas expandibles con el detalle de sus viajes.
 */
@Component({
  selector: 'app-gestion-operativa-page',
  imports: [
    Badge,
    Button,
    Icon,
    KpiCard,
    ProgressBar,
    SearchBar,
    StateWrapper,
    Table,
    TableCellDef,
  ],
  templateUrl: './gestion-operativa-page.html',
  styleUrl: './gestion-operativa-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionOperativaPage {
  private readonly store = inject(DespachoStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationStore);
  private readonly mensajeriaStore = inject(MensajeriaStore);

  protected readonly viajesColumns = VIAJES_COLUMNS;
  protected readonly despachos = this.store.despachos;
  protected readonly busqueda = signal('');
  protected readonly expandidas = signal<Set<string>>(new Set());
  /** Filtro por estado activado desde los totalizadores (toggle) */
  protected readonly filtroEstado = signal<EstadoViaje | null>(null);

  protected readonly campanias = computed<CampaniaVm[]>(() => {
    const catalogos = this.store.catalogos().data;
    const filtro = this.busqueda().toLowerCase();
    const estado = this.filtroEstado();

    return this.store
      .enOperacion()
      .map((despacho) =>
        estado
          ? { ...despacho, viajes: despacho.viajes.filter((viaje) => viaje.estado === estado) }
          : despacho,
      )
      .filter((despacho) => despacho.viajes.length > 0)
      .map((despacho) => {
        const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
        const campo = productor?.campos.find((c) => c.id === despacho.campoId);
        return {
          id: despacho.id,
          nombre: despacho.nombre,
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
    const nuevo = this.filtroEstado() === estado ? null : estado;
    this.filtroEstado.set(nuevo);
    if (nuevo) {
      // Expandir todas las campañas con coincidencias para ver los viajes
      this.expandidas.set(new Set(this.campanias().map((campania) => campania.id)));
    }
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

  protected viajesRows(campania: CampaniaVm): Record<string, unknown>[] {
    return campania.viajes.map((viaje) => ({ ...viaje }));
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
