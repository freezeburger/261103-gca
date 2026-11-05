import { computed, Directive, inject, input } from '@angular/core';
import { GCA_FIELD, GcaFieldControl, gcaUniqueId, GcaValidationError } from './gca-core';

/**
 * Base des contrôles natifs (`input`, `textarea`, `select`).
 *
 * Les entrées `invalid`, `touched`, `required` et `errors` sont renseignées
 * automatiquement par Signal Forms (`[formField]`) ; elles peuvent aussi être
 * liées à la main avec d'autres API de formulaire.
 */
@Directive({
  host: {
    '[id]': 'controlId()',
    '[attr.aria-invalid]': 'showError() || null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  },
})
export abstract class GcaControlBase implements GcaFieldControl {
  protected readonly field = inject(GCA_FIELD, { optional: true });
  private readonly generatedId = gcaUniqueId('gca-control');

  readonly id = input<string>();
  readonly invalid = input(false);
  /** `undefined` : erreur affichée dès que `invalid` est vrai. */
  readonly touched = input<boolean>();
  readonly required = input(false, { transform: (v: boolean | string) => v !== false });
  readonly errors = input<readonly GcaValidationError[]>([]);

  readonly controlId = computed(() => this.id() ?? this.generatedId);
  readonly isRequired = computed(() => this.required());
  readonly showError = computed(
    () => (this.invalid() && this.touched() !== false) || !!this.field?.hasError(),
  );
  readonly firstError = computed(() => {
    const [error] = this.errors();
    return error ? (error.message ?? error.kind) : null;
  });
}
