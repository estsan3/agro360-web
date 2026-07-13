import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { StateWrapper } from '../../../shared/ui/state-wrapper/state-wrapper';
import { Table, TableColumn } from '../../../shared/ui/table/table';
import { TableCellDef } from '../../../shared/ui/table/table-cell-def';
import { DespachoStore } from '../data-access/despacho.store';

const COLUMNS: TableColumn[] = [
  { key: 'nombre', label: 'Campaña' },
  { key: 'productor', label: 'Productor / Campo' },
  { key: 'material', label: 'Material' },
  { key: 'fechaInicio', label: 'Fecha de inicio' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '120px' },
];

/**
 * Pantalla Borrador despachos (Figma: Borrador despachos 720:868).
 */
@Component({
  selector: 'app-borrador-despachos-page',
  imports: [Badge, Button, Icon, StateWrapper, Table, TableCellDef],
  templateUrl: './borrador-despachos-page.html',
  styleUrl: './borrador-despachos-page.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorradorDespachosPage {
  private readonly store = inject(DespachoStore);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);

  protected readonly columns = COLUMNS;
  protected readonly despachos = this.store.despachos;

  protected readonly rows = computed(() => {
    const catalogos = this.store.catalogos().data;
    return this.store.borradores().map((despacho) => {
      const productor = catalogos?.productores.find((p) => p.id === despacho.productorId);
      const campo = productor?.campos.find((c) => c.id === despacho.campoId);
      return {
        id: despacho.id,
        nombre: despacho.nombre,
        productor: `${productor?.nombre ?? '—'} / ${campo?.nombre ?? '—'}`,
        material: despacho.material,
        fechaInicio: this.datePipe.transform(despacho.fechaInicio, 'dd/MM/yyyy') ?? '—',
      } as Record<string, unknown>;
    });
  });

  constructor() {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
  }

  protected crearNuevo(): void {
    this.router.navigate(['/despachos']);
  }

  protected eliminar(id: string): void {
    this.store.eliminarDespacho(id).subscribe();
  }
}
