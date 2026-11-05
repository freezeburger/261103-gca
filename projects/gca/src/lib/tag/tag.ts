import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GcaSeverity } from '../core/gca-core';

/**
 * Étiquette de statut ou de niveau : le texte porte toujours l'information.
 *
 * `<gca-tag severity="warn">AVERT.</gca-tag>` · `<gca-tag severity="success" icon="●">Non enregistré</gca-tag>`
 */
@Component({
  selector: 'gca-tag',
  template: `
    @if (icon()) {
      <span class="icon" aria-hidden="true">{{ icon() }}</span>
    }
    <ng-content />
  `,
  styleUrl: './tag.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"gca-" + severity()', '[class.gca-pill]': 'rounded()' },
})
export class GcaTag {
  readonly severity = input<GcaSeverity>('primary');
  readonly icon = input<string>();
  readonly rounded = input(false, { transform: (v: boolean | string) => v !== false });
}
