import { ChangeDetectionStrategy, Component, computed, contentChild, input } from '@angular/core';
import { GCA_FIELD, GCA_FIELD_CONTROL, GcaFieldContext, gcaUniqueId } from '../core/gca-core';

/**
 * Habillage d'un contrÃ´le : libellÃ©, aide, erreur, compteur, prÃ©fixe et suffixe.
 *
 * Avec Signal Forms, l'astÃ©risque et le premier message d'erreur sont dÃ©duits du
 * contrÃ´le projetÃ© ; `error` force un message (erreur serveur par exemple).
 */
@Component({
  selector: 'gca-field',
  templateUrl: './field.html',
  styleUrl: './field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: GCA_FIELD, useExisting: GcaField }],
  host: { '[class.gca-field-invalid]': 'message() !== null' },
})
export class GcaField implements GcaFieldContext {
  private readonly control = contentChild(GCA_FIELD_CONTROL);
  private readonly baseId = gcaUniqueId('gca-field');

  readonly label = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null | undefined>();
  readonly required = input<boolean>();
  /** Valeur courante du compteur (longueur du texte saisi). */
  readonly count = input<number>();
  readonly maxLength = input<number>();

  protected readonly hintId = `${this.baseId}-hint`;
  protected readonly errorId = `${this.baseId}-error`;
  protected readonly controlId = computed(() => this.control()?.controlId() ?? null);
  protected readonly isRequired = computed(() => this.required() ?? this.control()?.isRequired() ?? false);
  protected readonly message = computed(() => {
    const explicit = this.error();
    if (explicit) return explicit;
    const control = this.control();
    return control?.showError() ? (control.firstError() ?? 'Valeur invalide.') : null;
  });

  readonly hasError = computed(() => !!this.error());
  readonly describedBy = computed(() => {
    if (this.message() !== null) return this.errorId;
    return this.hint() ? this.hintId : null;
  });
}
