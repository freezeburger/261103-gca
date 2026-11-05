import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GcaSeverity } from '../core/gca-core';

/**
 * Pastille numérique (compteur de non lues, nombre de résultats).
 *
 * `<gca-badge [value]="unread()" severity="danger" ariaLabel="notifications non lues" />`
 */
@Component({
  selector: 'gca-badge',
  template: '{{ value() }}',
  styleUrl: './badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"gca-" + severity()',
    '[attr.aria-label]': 'ariaLabel() ? value() + " " + ariaLabel() : null',
  },
})
export class GcaBadge {
  readonly value = input.required<string | number>();
  readonly severity = input<GcaSeverity>('danger');
  readonly ariaLabel = input<string>();
}
