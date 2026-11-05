import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface GcaSelectButtonOption<T> {
  readonly label: string;
  readonly value: T;
  /** Compteur affiché après le libellé : « Non lues (3) ». */
  readonly count?: number;
  readonly disabled?: boolean;
}

/**
 * Choix exclusif en boutons segmentés (filtres de statut).
 *
 * `<gca-select-button [options]="statusOptions" [(value)]="status" ariaLabel="Statut" />`
 */
@Component({
  selector: 'gca-select-button',
  template: `
    @for (option of options(); track $index) {
      <button
        type="button"
        [class.active]="option.value === value()"
        [attr.aria-pressed]="option.value === value()"
        [disabled]="option.disabled"
        (click)="value.set(option.value)"
      >
        {{ option.label }}
        @if (option.count != null) {
          <span class="count">{{ option.count }}</span>
        }
      </button>
    }
  `,
  styleUrl: './select-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': 'ariaLabel()' },
})
export class GcaSelectButton<T> {
  readonly options = input.required<readonly GcaSelectButtonOption<T>[]>();
  readonly value = model<T>();
  readonly ariaLabel = input<string>();
}
