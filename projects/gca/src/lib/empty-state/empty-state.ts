import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * État vide ou d'erreur d'une zone de contenu, avec actions projetées.
 *
 * `<gca-empty-state icon="⌕" heading="Aucun résultat" description="…"><button gcaButton>Réinitialiser</button></gca-empty-state>`
 */
@Component({
  selector: 'gca-empty-state',
  template: `
    <span class="icon" aria-hidden="true">{{ icon() }}</span>
    @if (heading()) {
      <p class="heading">{{ heading() }}</p>
    }
    @if (description()) {
      <p class="description">{{ description() }}</p>
    }
    <div class="actions"><ng-content /></div>
  `,
  styleUrl: './empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status' },
})
export class GcaEmptyState {
  readonly icon = input('∅');
  readonly heading = input<string>();
  readonly description = input<string>();
}
