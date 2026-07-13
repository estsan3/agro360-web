import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Página temporal "en construcción" — se reemplaza al implementar
 * cada feature en los pasos 8-12.
 */
@Component({
  selector: 'app-page-placeholder',
  template: `
    <section class="placeholder">
      <h1>{{ title() }}</h1>
      <p>Sección en construcción</p>
    </section>
  `,
  styles: [
    `
      @use 'tokens' as t;
      @use 'typography' as ty;

      .placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: t.$space-sm;
        font-family: ty.$font-family-base;

        h1 {
          margin: 0;
          font-size: ty.$font-size-2xl;
          color: t.$color-text;
        }

        p {
          margin: 0;
          color: t.$color-text-muted;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagePlaceholder {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['title'] as string) ?? 'Página')),
    { initialValue: 'Página' },
  );
}
