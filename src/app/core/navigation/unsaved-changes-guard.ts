import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { GcaConfirmService } from 'gca';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  inject(GcaConfirmService).confirm({
    header: 'Quitter sans enregistrer ?',
    message: 'Vos modifications seront perdues.',
    acceptLabel: 'Quitter',
    rejectLabel: 'Rester sur la page',
    severity: 'danger',
  });
