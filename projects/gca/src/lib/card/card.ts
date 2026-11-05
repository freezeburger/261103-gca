import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Conteneur de section avec en-tête optionnel et zone d'actions.
 *
 * ```html
 * <gca-card header="Informations" accent>
 *   <button gcaButton gcaCardActions>Modifier</button>
 *   …contenu…
 * </gca-card>
 * ```
 */
@Component({
  selector: 'gca-card',
  templateUrl: './card.html',
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.gca-accent]': 'accent()' },
})
export class GcaCard {
  readonly header = input<string>();
  readonly subtitle = input<string>();
  /** Liseré dégradé en haut de carte. */
  readonly accent = input(false, { transform: (v: boolean | string) => v !== false });
}
