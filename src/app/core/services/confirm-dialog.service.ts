import { Injectable, signal } from '@angular/core';

export type ConfirmDialogVariant = 'default' | 'danger';

export interface ConfirmChecklistItem {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Si false, el ítem bloquea el inicio (falta un requisito). */
  ok?: boolean;
  checked?: boolean;
  locked?: boolean;
}

export interface ConfirmDialogOptions {
  titulo?: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variant?: ConfirmDialogVariant;
  items?: ConfirmChecklistItem[];
}

/**
 * Diálogo de confirmación global (sustituye window.confirm).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly abierto = signal(false);
  readonly titulo = signal('Confirmar');
  readonly mensaje = signal('');
  readonly textoConfirmar = signal('Confirmar');
  readonly textoCancelar = signal('Cancelar');
  readonly variant = signal<ConfirmDialogVariant>('default');
  readonly items = signal<ConfirmChecklistItem[]>([]);

  private resolver: ((value: boolean) => void) | null = null;

  abrir(options: ConfirmDialogOptions): Promise<boolean> {
    if (this.resolver) {
      this.resolver(false);
    }

    this.titulo.set(options.titulo ?? 'Confirmar');
    this.mensaje.set(options.mensaje);
    this.textoConfirmar.set(options.textoConfirmar ?? 'Confirmar');
    this.textoCancelar.set(options.textoCancelar ?? 'Cancelar');
    this.variant.set(options.variant ?? 'default');
    this.items.set(
      (options.items ?? []).map((item) => ({
        ...item,
        checked: item.ok === false ? false : (item.checked ?? item.ok === true),
        locked: item.locked ?? item.ok !== undefined,
      })),
    );
    this.abierto.set(true);

    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  confirmarCierreSinGuardar(): Promise<boolean> {
    return this.abrir({
      titulo: 'Cambios sin guardar',
      mensaje: 'Hay cambios sin guardar. ¿Desea cerrar igualmente?',
      textoConfirmar: 'Cerrar sin guardar',
      textoCancelar: 'Seguir editando',
    });
  }

  toggleItem(id: string): void {
    this.items.update((items) =>
      items.map((item) =>
        item.id === id && !item.locked ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  puedeConfirmar(): boolean {
    const items = this.items();
    if (items.some((item) => item.ok === false)) {
      return false;
    }
    return items.every((item) => !item.required || item.checked);
  }

  confirmar(): void {
    if (!this.puedeConfirmar()) {
      return;
    }
    this.cerrar(true);
  }

  cancelar(): void {
    this.cerrar(false);
  }

  private cerrar(resultado: boolean): void {
    this.abierto.set(false);
    const resolver = this.resolver;
    this.resolver = null;
    resolver?.(resultado);
  }
}
