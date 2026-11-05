import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GcaSeverity } from '../core/gca-core';

export type GcaButtonVariant = 'solid' | 'outlined' | 'text' | 'gradient';
export type GcaButtonSize = 'sm' | 'md' | 'lg';

/**
 * Bouton stylé posé sur un `<button>` ou un `<a>` natif.
 *
 * `<button gcaButton severity="danger" [loading]="saving()">Supprimer</button>`
 */
@Component({
  selector: 'button[gcaButton], a[gcaButton]',
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-busy]': 'loading() || null',
  },
})
export class GcaButton {
  readonly severity = input<GcaSeverity>('primary');
  readonly variant = input<GcaButtonVariant>('solid');
  readonly size = input<GcaButtonSize>('md');
  /** Texte ou symbole affiché avant le libellé (aucune police d'icônes requise). */
  readonly icon = input<string>();
  /** Affiche un indicateur et bloque les clics (double soumission). */
  readonly loading = input(false);
  readonly disabled = input(false);
  /** Bouton carré sans libellé : renseigner `aria-label`. */
  readonly rounded = input(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
  protected readonly hostClass = computed(
    () =>
      `gca-button gca-${this.severity()} gca-${this.variant()} gca-${this.size()}` +
      (this.rounded() ? ' gca-rounded' : ''),
  );
}
