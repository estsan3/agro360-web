import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationStore } from '../../notifications/state/notification.store';
import { Badge, BadgeVariant } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { ProgressBar, ProgressVariant } from '../../shared/ui/progress-bar/progress-bar';
import { StateWrapper } from '../../shared/ui/state-wrapper/state-wrapper';
import { DespachoService } from '../despachos/data-access/despacho.service';
import {
  Despacho,
  EstadoViaje,
  TipoAdjuntoViaje,
  Viaje,
  ViajeAdjunto,
} from '../despachos/data-access/despacho.model';
import { DespachoStore } from '../despachos/data-access/despacho.store';

const ESTADO_LABEL: Record<EstadoViaje, string> = {
  borrador: 'Borrador',
  'en-busqueda-transportistas': 'En búsqueda',
  pendiente: 'Pendiente',
  'en-viaje': 'En viaje',
  retrasado: 'Retrasado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const ESTADO_BADGE: Record<EstadoViaje, BadgeVariant> = {
  borrador: 'neutral',
  'en-busqueda-transportistas': 'info',
  pendiente: 'warning',
  'en-viaje': 'info',
  retrasado: 'danger',
  completado: 'success',
  cancelado: 'neutral',
};

const PROGRESS_VARIANT: Record<EstadoViaje, ProgressVariant> = {
  borrador: 'neutral',
  'en-busqueda-transportistas': 'info',
  pendiente: 'neutral',
  'en-viaje': 'info',
  retrasado: 'danger',
  completado: 'success',
  cancelado: 'neutral',
};

const TIPO_LABEL: Record<TipoAdjuntoViaje, string> = {
  ticket_gasoil: 'Ticket gasoil',
  cpe_escaneada: 'CPE escaneada',
  otro: 'Otro',
};

/**
 * Detalle dedicado de un viaje: datos operativos, adjuntos y generación de documentos.
 */
@Component({
  selector: 'app-viaje-detalle-page',
  imports: [Badge, Button, DatePipe, Icon, ProgressBar, RouterLink, StateWrapper],
  templateUrl: './viaje-detalle-page.html',
  styleUrl: './viaje-detalle-page.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViajeDetallePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(DespachoStore);
  private readonly api = inject(DespachoService);
  private readonly notifications = inject(NotificationStore);
  private readonly datePipe = inject(DatePipe);

  protected readonly despachosState = this.store.despachos;
  protected readonly despachoId = signal('');
  protected readonly viajeId = signal('');
  protected readonly adjuntos = signal<ViajeAdjunto[]>([]);
  protected readonly cargandoAdjuntos = signal(false);

  protected readonly contexto = computed(() => {
    const dId = this.despachoId();
    const vId = this.viajeId();
    const despachos = this.store.despachos().data ?? [];
    const despacho = despachos.find((d) => d.id === dId) ?? null;
    const viaje = despacho?.viajes.find((v) => v.id === vId) ?? null;
    return { despacho, viaje };
  });

  protected readonly productorCampo = computed(() => {
    const despacho = this.contexto().despacho;
    const catalogos = this.store.catalogos().data;
    if (!despacho || !catalogos) {
      return '—';
    }
    const productor = catalogos.productores.find((p) => p.id === despacho.productorId);
    const campo = productor?.campos.find((c) => c.id === despacho.campoId);
    return `${productor?.nombre ?? '—'} · ${campo?.nombre ?? '—'}`;
  });

  ngOnInit(): void {
    this.store.cargarDespachos();
    this.store.cargarCatalogos();
    this.despachoId.set(this.route.snapshot.paramMap.get('despachoId') ?? '');
    this.viajeId.set(this.route.snapshot.paramMap.get('viajeId') ?? '');
    this.recargarAdjuntos();
  }

  protected estadoLabel(estado: EstadoViaje): string {
    return ESTADO_LABEL[estado];
  }

  protected estadoBadge(estado: EstadoViaje): BadgeVariant {
    return ESTADO_BADGE[estado];
  }

  protected progressVariant(estado: EstadoViaje): ProgressVariant {
    return PROGRESS_VARIANT[estado];
  }

  protected tipoLabel(tipo: TipoAdjuntoViaje): string {
    return TIPO_LABEL[tipo];
  }

  protected fechaCorta(valor: Date | undefined): string {
    return valor ? (this.datePipe.transform(valor, 'dd/MM/yyyy') ?? '—') : '—';
  }

  protected volver(): void {
    this.router.navigate(['/gestion-operativa']);
  }

  protected emitirCpe(despacho: Despacho, viaje: Viaje): void {
    this.api.emitirCartaPorte(despacho.id, viaje.id).subscribe({
      next: (cpe) =>
        this.notifications.success(
          'Carta de porte emitida',
          cpe.nro_ctg ? `CTG ${cpe.nro_ctg}` : `Estado: ${cpe.estado}`,
        ),
      error: (err) =>
        this.notifications.error(
          'No se pudo emitir CPE',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  protected generarTicket(despacho: Despacho, viaje: Viaje): void {
    this.api.generarTicketGasoil(despacho.id, viaje.id).subscribe({
      next: (adj) => {
        this.notifications.success('Ticket de gasoil generado', adj.nombre);
        this.recargarAdjuntos();
      },
      error: (err) =>
        this.notifications.error(
          'No se pudo generar ticket',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  protected subirAdjunto(tipo: TipoAdjuntoViaje): void {
    const dId = this.despachoId();
    const vId = this.viajeId();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*,.txt';
    input.onchange = () => {
      const archivo = input.files?.[0];
      if (!archivo) {
        return;
      }
      leerArchivoComoDataUrl(archivo).then((dataUrl) => {
        this.api
          .subirAdjunto(dId, vId, {
            tipo,
            nombre: archivo.name,
            mime: archivo.type || 'application/octet-stream',
            dataUrl,
          })
          .subscribe({
            next: (adj) => {
              this.notifications.success('Adjunto subido', adj.nombre);
              this.recargarAdjuntos();
            },
            error: (err) =>
              this.notifications.error(
                'No se pudo subir',
                err?.error?.error?.mensaje ?? 'Error de negocio',
              ),
          });
      });
    };
    input.click();
  }

  protected abrirAdjunto(adjunto: ViajeAdjunto): void {
    this.api.obtenerAdjunto(this.despachoId(), this.viajeId(), adjunto.id).subscribe({
      next: (detalle) => {
        if (!detalle.dataUrl) {
          this.notifications.warning('Sin contenido', 'El adjunto no tiene datos');
          return;
        }
        const win = window.open();
        if (win) {
          win.document.write(
            `<iframe src="${detalle.dataUrl}" style="width:100%;height:100%;border:0"></iframe>`,
          );
        } else {
          const a = document.createElement('a');
          a.href = detalle.dataUrl;
          a.download = detalle.nombre;
          a.click();
        }
      },
      error: (err) =>
        this.notifications.error(
          'No se pudo abrir',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  protected eliminarAdjunto(adjunto: ViajeAdjunto): void {
    this.api.eliminarAdjunto(this.despachoId(), this.viajeId(), adjunto.id).subscribe({
      next: () => {
        this.notifications.warning('Adjunto eliminado', adjunto.nombre);
        this.recargarAdjuntos();
      },
      error: (err) =>
        this.notifications.error(
          'No se pudo eliminar',
          err?.error?.error?.mensaje ?? 'Error de negocio',
        ),
    });
  }

  private recargarAdjuntos(): void {
    const dId = this.despachoId();
    const vId = this.viajeId();
    if (!dId || !vId) {
      return;
    }
    this.cargandoAdjuntos.set(true);
    this.api.listarAdjuntos(dId, vId).subscribe({
      next: (items) => {
        this.adjuntos.set(items);
        this.cargandoAdjuntos.set(false);
      },
      error: () => this.cargandoAdjuntos.set(false),
    });
  }
}

function leerArchivoComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(archivo);
  });
}
