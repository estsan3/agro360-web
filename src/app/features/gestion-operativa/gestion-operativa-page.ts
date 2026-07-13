import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

const VIAJES_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'chofer', label: 'Chofer / Patente' },
  { key: 'destino', label: 'Destino' },
  { key: 'toneladas', label: 'Toneladas', align: 'right' },
  { key: 'estado', label: 'Estado' },
  { key: 'progreso', label: 'Progreso' },
  { key: 'observaciones', label: 'Observaciones' },
];

const PROGRESS_VARIANT: Record<EstadoViaje, ProgressVariant> = {
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
  imports: [Badge, Button, Icon, ProgressBar, SearchBar, StateWrapper, Table, TableCellDef],
  templateUrl: './gestion-operativa-page.html',
  styleUrl: './gestion-operativa-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionOperativaPage {
  private readonly store = inject(DespachoStore);

  protected readonly viajesColumns = VIAJES_COLUMNS;
  protected readonly despachos = this.store.despachos;
  protected readonly busqueda = signal('');
  protected readonly expandidas = signal<Set<string>>(new Set());

  protected readonly campanias = computed<CampaniaVm[]>(() => {
    const catalogos = this.store.catalogos().data;
    const filtro = this.busqueda().toLowerCase();

    return this.store
      .activos()
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
          campania.viajes.some((viaje) => viaje.chofer.toLowerCase().includes(filtro)),
      );
  });

  constructor() {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
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
}
