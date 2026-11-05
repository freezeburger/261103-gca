import { Injectable, signal } from '@angular/core';
import { GcaSeverity } from '../core/gca-core';

export interface GcaToastAction {
  readonly label: string;
  readonly run: () => void;
}

export interface GcaToastOptions {
  readonly severity?: GcaSeverity;
  readonly summary: string;
  readonly detail?: string;
  /** Durée d'affichage en ms ; `0` = reste affiché jusqu'à fermeture. */
  readonly life?: number;
  /** Action secondaire (ex. « Annuler ») ; le toast se ferme après exécution. */
  readonly action?: GcaToastAction;
}

export interface GcaToastMessage extends GcaToastOptions {
  readonly id: number;
  readonly severity: GcaSeverity;
  readonly life: number;
}

/**
 * Messages temporaires empilés ; afficher `<gca-toast />` une fois dans l'application.
 *
 * `inject(GcaToastService).success('Produit enregistré')`
 */
@Injectable({ providedIn: 'root' })
export class GcaToastService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly state = signal<readonly GcaToastMessage[]>([]);

  readonly messages = this.state.asReadonly();

  show(options: GcaToastOptions): number {
    const message: GcaToastMessage = {
      ...options,
      id: ++this.nextId,
      severity: options.severity ?? 'info',
      life: options.life ?? 4000,
    };
    this.state.update((messages) => [...messages, message]);
    if (message.life > 0) {
      this.timers.set(message.id, setTimeout(() => this.dismiss(message.id), message.life));
    }
    return message.id;
  }

  success(summary: string, detail?: string): number {
    return this.show({ severity: 'success', summary, detail });
  }

  info(summary: string, detail?: string): number {
    return this.show({ severity: 'info', summary, detail });
  }

  warn(summary: string, detail?: string): number {
    return this.show({ severity: 'warn', summary, detail });
  }

  error(summary: string, detail?: string): number {
    return this.show({ severity: 'danger', summary, detail, life: 0 });
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.state.update((messages) => messages.filter((message) => message.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.state.set([]);
  }
}
