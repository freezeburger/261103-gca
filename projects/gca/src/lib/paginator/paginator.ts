import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

type PageItem = number | 'gap';

export interface GcaPageEvent {
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Pagination : résumé « 1–20 sur 128 », Précédent / Suivant, pages et taille de page.
 * `page` commence à 1 ; changer la taille revient à la page 1.
 *
 * `<gca-paginator [total]="total()" [(page)]="page" [(pageSize)]="size" />`
 * ou, avec l'état dans l'URL : `(paginate)="navigate($event)"`.
 */
@Component({
  selector: 'gca-paginator',
  templateUrl: './paginator.html',
  styleUrl: './paginator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'navigation', '[attr.aria-label]': 'ariaLabel()' },
})
export class GcaPaginator {
  readonly total = input.required<number>();
  readonly page = model(1);
  readonly pageSize = model(20);
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50]);
  readonly ariaLabel = input('Pagination');
  readonly previousLabel = input('‹ Précédent');
  readonly nextLabel = input('Suivant ›');
  readonly pageSizeLabel = input('Par page');
  /** Émis une seule fois par action utilisateur (page et taille à jour). */
  readonly paginate = output<GcaPageEvent>();

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly first = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly last = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  protected readonly pages = computed<PageItem[]>(() => {
    const count = this.pageCount();
    const current = this.page();
    const items: PageItem[] = [];
    for (let p = 1; p <= count; p++) {
      if (p === 1 || p === count || Math.abs(p - current) <= 1) {
        items.push(p);
      } else if (items.at(-1) !== 'gap') {
        items.push('gap');
      }
    }
    return items;
  });

  goTo(page: number): void {
    const target = Math.min(Math.max(1, page), this.pageCount());
    if (target === this.page()) return;
    this.page.set(target);
    this.paginate.emit({ page: target, pageSize: this.pageSize() });
  }

  protected changeSize(size: string): void {
    this.pageSize.set(Number(size));
    this.page.set(1);
    this.paginate.emit({ page: 1, pageSize: this.pageSize() });
  }
}
