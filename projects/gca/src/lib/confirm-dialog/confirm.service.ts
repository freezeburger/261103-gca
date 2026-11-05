import { Injectable, signal } from '@angular/core';
import { GcaSeverity } from '../core/gca-core';

export interface GcaConfirmOptions {
  readonly header: string;
  readonly message?: string;
  readonly acceptLabel?: string;
  readonly rejectLabel?: string;
  /** Niveau du bouton d'acceptation (`danger` pour une action destructrice). */
  readonly severity?: GcaSeverity;
}

export interface GcaConfirmRequest extends GcaConfirmOptions {
  readonly resolve: (accepted: boolean) => void;
}

/**
 * Confirmation modale asynchrone ; afficher `<gca-confirm-dialog />` une fois.
 *
 * ```ts
 * export const unsavedChangesGuard: CanDeactivateFn<{ isDirty(): boolean }> = (page) =>
 *   !page.isDirty() || inject(GcaConfirmService).confirm({ header: 'Quitter sans enregistrer ?' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class GcaConfirmService {
  private readonly state = signal<GcaConfirmRequest | null>(null);

  readonly current = this.state.asReadonly();

  confirm(options: GcaConfirmOptions): Promise<boolean> {
    this.state()?.resolve(false);
    return new Promise<boolean>((resolve) => this.state.set({ ...options, resolve }));
  }

  /** Résout la demande en cours et ferme le dialogue. */
  respond(accepted: boolean): void {
    const request = this.state();
    this.state.set(null);
    request?.resolve(accepted);
  }
}
