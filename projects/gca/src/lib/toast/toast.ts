import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { GCA_SEVERITY_ICONS } from '../core/gca-core';
import { GcaToastMessage, GcaToastService } from './toast.service';

export type GcaToastPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

/** Conteneur des toasts à placer une seule fois (composant racine). */
@Component({
  selector: 'gca-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"gca-" + position()' },
})
export class GcaToast {
  protected readonly toasts = inject(GcaToastService);
  protected readonly icons = GCA_SEVERITY_ICONS;

  readonly position = input<GcaToastPosition>('top-right');
  readonly closeLabel = input('Fermer');

  protected runAction(message: GcaToastMessage): void {
    message.action?.run();
    this.toasts.dismiss(message.id);
  }
}
