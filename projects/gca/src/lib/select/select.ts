import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GcaControlBase } from '../core/control-base';
import { GCA_FIELD_CONTROL } from '../core/gca-core';

/**
 * Liste déroulante stylée sur `<select>` natif, compatible `[formField]`.
 *
 * `<select gcaSelect [formField]="form.sort"><option value="">Pertinence</option></select>`
 */
@Component({
  selector: 'select[gcaSelect]',
  template: '<ng-content />',
  styleUrl: './select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: GCA_FIELD_CONTROL, useExisting: GcaSelect }],
  host: { class: 'gca-select' },
})
export class GcaSelect extends GcaControlBase {}
