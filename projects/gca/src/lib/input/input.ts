import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { GcaControlBase } from '../core/control-base';
import { GCA_FIELD_CONTROL } from '../core/gca-core';

/**
 * Champ texte stylé sur `<input>` ou `<textarea>` natif, compatible `[formField]`.
 *
 * `<input gcaInput type="email" [formField]="form.email" />`
 */
@Component({
  selector: 'input[gcaInput], textarea[gcaInput]',
  template: '',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: GCA_FIELD_CONTROL, useExisting: GcaInput }],
  host: { class: 'gca-input' },
})
export class GcaInput extends GcaControlBase {
  readonly element: HTMLInputElement | HTMLTextAreaElement = inject(ElementRef).nativeElement;
}
