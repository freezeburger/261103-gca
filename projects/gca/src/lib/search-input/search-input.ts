import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  model,
  output,
} from '@angular/core';

/**
 * Recherche plein texte avec effacement et anti-rebond.
 *
 * `search` est émis après `debounce` ms sans frappe (ou sur Entrée) lorsque le
 * terme atteint `minLength` caractères, ou lorsqu'il est vidé.
 *
 * `<gca-search-input [(value)]="q" (search)="onSearch($event)" />`
 */
@Component({
  selector: 'gca-search-input',
  templateUrl: './search-input.html',
  styleUrl: './search-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GcaSearchInput {
  readonly value = model('');
  readonly placeholder = input('Rechercher…');
  readonly ariaLabel = input('Recherche');
  readonly clearLabel = input('Effacer la recherche');
  readonly debounce = input(300);
  readonly minLength = input(2);
  readonly search = output<string>();

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected onInput(term: string): void {
    this.value.set(term);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.emit(), this.debounce());
  }

  protected onEnter(): void {
    clearTimeout(this.timer);
    this.emit();
  }

  clear(): void {
    clearTimeout(this.timer);
    this.value.set('');
    this.search.emit('');
  }

  private emit(): void {
    const term = this.value().trim();
    if (term.length === 0 || term.length >= this.minLength()) {
      this.search.emit(term);
    }
  }
}
