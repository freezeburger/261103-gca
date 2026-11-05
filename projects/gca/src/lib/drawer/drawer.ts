import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import { gcaUniqueId } from '../core/gca-core';
import { gcaFocusOnOpen, gcaTrapTab } from '../core/overlay';

export type GcaDrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * Panneau latéral coulissant (navigation mobile, filtres, aperçu).
 * Échap et clic sur le masque ferment si `dismissable` ; focus piégé si `modal`.
 *
 * ```html
 * <button gcaButton (click)="filters.set(true)">Filtres</button>
 * <gca-drawer [(visible)]="filters" header="Filtres" position="right">
 *   …contenu…
 *   <ng-container gcaDrawerFooter><button gcaButton (click)="filters.set(false)">Appliquer</button></ng-container>
 * </gca-drawer>
 * ```
 */
@Component({
  selector: 'gca-drawer',
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GcaDrawer {
  readonly visible = model(false);
  readonly position = input<GcaDrawerPosition>('left');
  readonly header = input<string>();
  /** Largeur (gauche / droite) ou hauteur (haut / bas). */
  readonly size = input('20rem');
  readonly modal = input(true);
  readonly dismissable = input(true);
  readonly closable = input(true);
  readonly closeLabel = input('Fermer');

  protected readonly headerId = gcaUniqueId('gca-drawer-header');
  protected readonly horizontal = computed(() => this.position() === 'left' || this.position() === 'right');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    gcaFocusOnOpen(this.panel);
  }

  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  protected onKeydown(event: KeyboardEvent, panel: HTMLElement): void {
    if (event.key === 'Escape' && this.dismissable()) {
      event.stopPropagation();
      this.close();
    }
    if (this.modal()) gcaTrapTab(event, panel);
  }
}
