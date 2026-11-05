import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { GcaInput } from '../input/input';

/**
 * Bascule « Afficher / Masquer » d'un champ mot de passe sans perdre la saisie.
 *
 * `<input #pwd gcaInput type="password" /> <gca-password-toggle gcaSuffix [for]="pwd" />`
 */
@Component({
  selector: 'gca-password-toggle',
  template: `
    <button
      type="button"
      [attr.aria-controls]="target().id"
      [attr.aria-pressed]="visible()"
      (click)="toggle()"
    >
      {{ visible() ? hideLabel() : showLabel() }}
    </button>
  `,
  styleUrl: './password-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GcaPasswordToggle {
  readonly for = input.required<GcaInput | HTMLInputElement>();
  readonly showLabel = input('Afficher');
  readonly hideLabel = input('Masquer');

  protected readonly visible = signal(false);
  protected readonly target = computed(() => {
    const target = this.for();
    return target instanceof GcaInput ? target.element : target;
  });

  toggle(): void {
    this.visible.update((visible) => !visible);
    this.target().setAttribute('type', this.visible() ? 'text' : 'password');
  }
}
