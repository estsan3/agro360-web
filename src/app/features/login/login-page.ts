import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/state/auth.store';
import { Button } from '../../shared/ui/button/button';
import { Logo } from '../../shared/ui/logo/logo';

/**
 * Placeholder de login — el formulario real (Figma: Login) llega en el Paso 8.
 * Permite entrar con el usuario mock para navegar el shell.
 */
@Component({
  selector: 'app-login-page',
  imports: [Button, Logo],
  template: `
    <div class="login">
      <app-logo />
      <p>Pantalla de login en construcción (Paso 8)</p>
      <app-button size="xl" [disabled]="loading()" (clicked)="enter()">
        Entrar con usuario demo
      </app-button>
    </div>
  `,
  styles: [
    `
      @use 'tokens' as t;
      @use 'typography' as ty;

      .login {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: t.$space-lg;
        height: 100vh;
        font-family: ty.$font-family-base;

        p {
          margin: 0;
          color: t.$color-text-muted;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);

  protected enter(): void {
    this.loading.set(true);
    this.authStore.login({ email: 'admin@agro360.com', password: 'demo1234' }).subscribe({
      next: () => this.router.navigate(['/despachos']),
      error: () => this.loading.set(false),
    });
  }
}
