import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Case à cocher stylée sur `<input type="checkbox">` natif, compatible `[formField]`.
 *
 * `<label><input type="checkbox" gcaCheckbox [formField]="form.remember" /> Rester connecté</label>`
 */
@Component({
  selector: 'input[type=checkbox][gcaCheckbox]',
  template: '',
  styleUrl: './checkbox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'gca-checkbox' },
})
export class GcaCheckbox {}
