import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import { gcaUniqueId } from '../core/gca-core';
import { gcaFocusOnOpen, gcaTrapTab } from '../core/overlay';

/**
 * Fenêtre modale : focus piégé, Échap et clic sur le masque ferment (si `dismissable`).
 *
 * ```html
 * <gca-dialog [(visible)]="open" header="Quitter sans enregistrer ?">
 *   Vos modifications seront perdues.
 *   <ng-container gcaDialogFooter>…boutons…</ng-container>
 * </gca-dialog>
 * ```
 */
@Component({
  selector: 'gca-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GcaDialog {
  readonly visible = model(false);
  readonly header = input<string>();
  readonly width = input('32rem');
  readonly closable = input(true);
  readonly dismissable = input(true);
  readonly closeLabel = input('Fermer');
  readonly dialogRole = input<'dialog' | 'alertdialog'>('dialog');

  protected readonly headerId = gcaUniqueId('gca-dialog-header');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    gcaFocusOnOpen(this.panel);
  }

  close(): void {
    this.visible.set(false);
  }

  protected onKeydown(event: KeyboardEvent, panel: HTMLElement): void {
    if (event.key === 'Escape' && this.dismissable()) {
      event.stopPropagation();
      this.close();
    }
    gcaTrapTab(event, panel);
  }
}
