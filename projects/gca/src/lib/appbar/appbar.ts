import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Barre d'application : bouton de menu, marque, zone de début (fil d'Ariane)
 * et zone de fin (notifications, menu utilisateur).
 *
 * ```html
 * <gca-appbar brand="Atelier">
 *   <gca-breadcrumb gcaAppbarStart [items]="crumbs" />
 *   <gca-menu gcaAppbarEnd label="M. Laurent" [items]="userMenu" />
 * </gca-appbar>
 * ```
 */
@Component({
  selector: 'gca-appbar',
  imports: [RouterLink],
  templateUrl: './appbar.html',
  styleUrl: './appbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GcaAppbar {
  readonly brand = input.required<string>();
  readonly brandLink = input<string | readonly unknown[]>('/');
  /** URL du logo ; à défaut, initiale de la marque sur pastille. */
  readonly logo = input<string>();
  readonly showMenuButton = input(false);
  readonly menuExpanded = input(false);
  readonly menuLabel = input('Menu principal');
  readonly menuToggle = output<void>();
}
