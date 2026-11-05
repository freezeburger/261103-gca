import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GcaButton } from '../button/button';
import { GcaDialog } from '../dialog/dialog';
import { GcaConfirmService } from './confirm.service';

/** Rendu des demandes de `GcaConfirmService` ; à placer une seule fois (composant racine). */
@Component({
  selector: 'gca-confirm-dialog',
  imports: [GcaDialog, GcaButton],
  template: `
    @let request = confirm.current();
    <gca-dialog
      dialogRole="alertdialog"
      width="28rem"
      [visible]="!!request"
      [header]="request?.header"
      (visibleChange)="!$event && confirm.respond(false)"
    >
      @if (request?.message) {
        <p class="message">{{ request?.message }}</p>
      }
      <ng-container gcaDialogFooter>
        <button gcaButton variant="text" severity="secondary" (click)="confirm.respond(false)">
          {{ request?.rejectLabel ?? 'Annuler' }}
        </button>
        <button gcaButton autofocus [severity]="severity()" (click)="confirm.respond(true)">
          {{ request?.acceptLabel ?? 'Confirmer' }}
        </button>
      </ng-container>
    </gca-dialog>
  `,
  styles: '.message { margin: 0; color: var(--gca-text-muted, #64748b); }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GcaConfirmDialog {
  protected readonly confirm = inject(GcaConfirmService);
  protected readonly severity = computed(() => this.confirm.current()?.severity ?? 'primary');
}
