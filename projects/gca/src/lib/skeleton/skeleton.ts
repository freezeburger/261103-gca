import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloc de chargement animé.
 *
 * `<gca-skeleton width="60%" height="1rem" />` · `<gca-skeleton shape="circle" width="36px" />`
 */
@Component({
  selector: 'gca-skeleton',
  template: '',
  styleUrl: './skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.gca-circle]': 'shape() === "circle"',
    '[style.width]': 'width()',
    '[style.height]': 'shape() === "circle" ? width() : height()',
    '[style.border-radius]': 'radius()',
  },
})
export class GcaSkeleton {
  readonly shape = input<'rect' | 'circle'>('rect');
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly radius = input<string>();
}
