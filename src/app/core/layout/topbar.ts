import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { MensajeriaStore } from '../../features/mensajeria/data-access/mensajeria.store';
import { DespachoStore } from '../../features/despachos/data-access/despacho.store';
import { Icon } from '../../shared/ui/icon/icon';
import { Logo } from '../../shared/ui/logo/logo';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { AuthStore } from '../state/auth.store';

const TITULOS: Record<string, string> = {
  despachos: 'Despachos',
  borradores: 'Borrador despachos',
  'gestion-operativa': 'Gestión Operativa',
  reportes: 'Reportería',
  mensajeria: 'Mensajería',
  configuracion: 'Configuración',
};

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface ResultadoViaje {
  id: string;
  chofer: string;
  destino: string;
  campania: string;
}

/**
 * Header global (Figma: header de Gestión Operativa): título de la
 * sección + fecha, búsqueda de viajes, notificaciones y perfil.
 */
@Component({
  selector: 'app-topbar',
  imports: [Icon, Logo, SearchBar],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  private readonly router = inject(Router);
  private readonly despachoStore = inject(DespachoStore);

  protected readonly authStore = inject(AuthStore);
  protected readonly mensajeriaStore = inject(MensajeriaStore);

  protected readonly busquedaAbierta = signal(false);
  protected readonly terminoBusqueda = signal('');
  protected readonly menuPerfilAbierto = signal(false);

  /** Toggle de la sidebar (hamburguesa) — lo maneja el shell */
  readonly menuToggled = output<void>();

  protected readonly titulo = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.tituloActual()),
    ),
    { initialValue: this.tituloActual() },
  );

  protected readonly fecha = (() => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${DIAS[hoy.getDay()]}, ${dia} de ${MESES[hoy.getMonth()]} del ${hoy.getFullYear()}`;
  })();

  protected readonly resultados = computed<ResultadoViaje[]>(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();
    if (!termino) {
      return [];
    }
    return this.despachoStore
      .enOperacion()
      .flatMap((despacho) =>
        despacho.viajes.map((viaje) => ({
          id: viaje.id,
          chofer: viaje.chofer,
          destino: viaje.destino,
          campania: despacho.nombre,
        })),
      )
      .filter(
        (viaje) =>
          viaje.id.toLowerCase().includes(termino) ||
          viaje.chofer.toLowerCase().includes(termino) ||
          viaje.destino.toLowerCase().includes(termino),
      )
      .slice(0, 8);
  });

  constructor() {
    // El badge de la campanita necesita las conversaciones desde el inicio
    this.mensajeriaStore.cargarConversaciones();
    this.despachoStore.cargarDespachos();
  }

  protected abrirBusqueda(): void {
    this.terminoBusqueda.set('');
    this.busquedaAbierta.set(true);
  }

  protected irAViaje(viaje: ResultadoViaje): void {
    this.busquedaAbierta.set(false);
    this.router.navigate(['/gestion-operativa'], { queryParams: { q: viaje.id } });
  }

  protected irAMensajeria(): void {
    this.router.navigate(['/mensajeria']);
  }

  protected irAMiPerfil(): void {
    this.menuPerfilAbierto.set(false);
    this.router.navigate(['/configuracion'], { queryParams: { tab: 'cuenta' } });
  }

  protected irAConfiguracion(): void {
    this.menuPerfilAbierto.set(false);
    this.router.navigate(['/configuracion']);
  }

  protected cerrarSesion(): void {
    this.menuPerfilAbierto.set(false);
    this.authStore.logout().subscribe(() => this.router.navigate(['/login']));
  }

  private tituloActual(): string {
    const seccion = this.router.url.split('/')[1]?.split('?')[0] ?? '';
    return TITULOS[seccion] ?? 'Agro360';
  }
}
