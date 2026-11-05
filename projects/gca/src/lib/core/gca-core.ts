import { InjectionToken, Signal } from '@angular/core';

/** Niveau visuel partagé par les boutons, messages, tags, badges et toasts. */
export type GcaSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';

/** Libellé lisible du niveau : l'information n'est jamais portée par la seule couleur. */
export const GCA_SEVERITY_LABELS: Readonly<Record<GcaSeverity, string>> = {
  primary: 'Info',
  secondary: 'Neutre',
  success: 'Succès',
  info: 'Info',
  warn: 'Avertissement',
  danger: 'Erreur',
  contrast: 'Note',
};

export const GCA_SEVERITY_ICONS: Readonly<Record<GcaSeverity, string>> = {
  primary: 'ℹ',
  secondary: '•',
  success: '✓',
  info: 'ℹ',
  warn: '⚠',
  danger: '✕',
  contrast: '•',
};

let nextId = 0;

export function gcaUniqueId(prefix: string): string {
  return `${prefix}-${++nextId}`;
}

/** Erreur de validation au format Signal Forms (`{ kind, message }`). */
export interface GcaValidationError {
  readonly kind: string;
  readonly message?: string;
}

/** Contrôle de saisie pouvant être placé dans un `gca-field`. */
export interface GcaFieldControl {
  readonly controlId: Signal<string>;
  readonly showError: Signal<boolean>;
  readonly firstError: Signal<string | null>;
  readonly isRequired: Signal<boolean>;
}

export const GCA_FIELD_CONTROL = new InjectionToken<GcaFieldControl>('GCA_FIELD_CONTROL');

/** Contexte exposé par `gca-field` aux contrôles projetés. */
export interface GcaFieldContext {
  readonly describedBy: Signal<string | null>;
  readonly hasError: Signal<boolean>;
}

export const GCA_FIELD = new InjectionToken<GcaFieldContext>('GCA_FIELD');
