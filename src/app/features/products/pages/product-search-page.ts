import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  GcaButton,
  GcaCard,
  GcaEmptyState,
  GcaImage,
  GcaPageEvent,
  GcaPaginator,
  GcaSearchInput,
  GcaSelect,
  GcaSkeleton,
  GcaSort,
  GcaSortHeader,
  GcaTable,
} from 'gca';
import { ProductApi, SortOrder } from '../product-api';

const DEFAULT_SIZE = 20;
const SORT_OPTIONS = [
  { value: '', label: 'Pertinence' },
  { value: 'title:asc', label: 'Titre A → Z' },
  { value: 'title:desc', label: 'Titre Z → A' },
  { value: 'price:asc', label: 'Prix croissant' },
  { value: 'price:desc', label: 'Prix décroissant' },
] as const;

@Component({
  selector: 'app-product-search-page',
  imports: [
    CurrencyPipe,
    RouterLink,
    GcaButton,
    GcaCard,
    GcaEmptyState,
    GcaImage,
    GcaPaginator,
    GcaSearchInput,
    GcaSelect,
    GcaSkeleton,
    GcaSortHeader,
    GcaTable,
  ],
  templateUrl: './product-search-page.html',
  styleUrl: './product-search-page.scss',
})
export default class ProductSearchPage {
  private readonly api = inject(ProductApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Paramètres d'URL reçus via withComponentInputBinding()
  readonly q = input('', { transform: (value: string | undefined) => value ?? '' });
  readonly page = input(1, { transform: (value: unknown) => Math.max(1, numberAttribute(value, 1)) });
  readonly size = input(DEFAULT_SIZE, { transform: (value: unknown) => numberAttribute(value, DEFAULT_SIZE) });
  readonly sortBy = input<string>();
  readonly order = input<SortOrder>();

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];
  protected readonly sort = computed<GcaSort | null>(() => {
    const field = this.sortBy();
    return field ? { field, order: this.order() ?? 'asc' } : null;
  });
  protected readonly sortKey = computed(() => {
    const sort = this.sort();
    return sort ? `${sort.field}:${sort.order}` : '';
  });

  protected readonly products = rxResource({
    params: () => ({ q: this.q(), page: this.page(), size: this.size(), sortBy: this.sortBy(), order: this.order() }),
    stream: ({ params }) => this.api.search(params),
  });

  protected navigate(queryParams: Params): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  protected search(q: string): void {
    this.navigate({ q: q.trim() || null, page: null });
  }

  protected changeSort(sort: GcaSort | null): void {
    this.navigate({ sortBy: sort?.field ?? null, order: sort?.order ?? null, page: null });
  }

  protected changeSortKey(event: Event): void {
    const [field, order] = (event.target as HTMLSelectElement).value.split(':');
    this.changeSort(field ? { field, order: order === 'desc' ? 'desc' : 'asc' } : null);
  }

  protected changePage({ page, pageSize }: GcaPageEvent): void {
    this.navigate({ page: page > 1 ? page : null, size: pageSize === DEFAULT_SIZE ? null : pageSize });
  }

  protected reset(): void {
    void this.router.navigate([], { relativeTo: this.route });
  }

  protected open(id: number): void {
    void this.router.navigate([id], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
