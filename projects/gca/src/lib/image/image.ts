import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';

/**
 * Image avec cadre de repli si le chargement échoue (réinitialisé à chaque `src`).
 *
 * `<gca-image [src]="product.thumbnail" [alt]="product.title" width="300px" height="300px" />`
 */
@Component({
  selector: 'gca-image',
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="alt()" loading="lazy" (error)="failed.set(true)" />
    } @else {
      <span class="fallback" role="img" [attr.aria-label]="alt() || fallbackLabel()">
        <span class="fallback-icon" aria-hidden="true">🖼</span>
        @if (!compact()) {
          <span>{{ fallbackLabel() }}</span>
        }
      </span>
    }
  `,
  styleUrl: './image.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': 'radius()',
  },
})
export class GcaImage {
  readonly src = input<string | null>();
  readonly alt = input('');
  readonly width = input<string>();
  readonly height = input<string>();
  readonly radius = input<string>();
  readonly fallbackLabel = input('Image indisponible');
  /** Masque le texte de repli (miniatures). */
  readonly compact = input(false, { transform: (v: boolean | string) => v !== false });

  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
}
