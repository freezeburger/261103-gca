import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Barre de progression ; indéterminée si `value` est absent.
 * `fixed` la place en haut de la fenêtre (navigation / resolver en cours).
 *
 * `<gca-progress-bar fixed ariaLabel="Chargement de la fiche" />`
 */
@Component({
  selector: 'gca-progress-bar',
  template: `<span class="bar" [style.width.%]="value() ?? null"></span>`,
  styleUrl: './progress-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'value() ?? null',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.gca-indeterminate]': 'value() == null',
    '[class.gca-fixed]': 'fixed()',
  },
})
export class GcaProgressBar {
  readonly value = input<number | null>();
  readonly fixed = input(false, { transform: (v: boolean | string) => v !== false });
  readonly ariaLabel = input('Chargement');
}
