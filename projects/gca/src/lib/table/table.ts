import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';

export type GcaSortOrder = 'asc' | 'desc';

export interface GcaSort {
  readonly field: string;
  readonly order: GcaSortOrder;
}

/**
 * Tableau de données stylé sur `<table>` natif, avec tri par en-tête.
 *
 * Classes utilitaires : `gca-num` (aligné à droite), `gca-truncate` (une ligne),
 * `gca-row-link` (ligne cliquable), `gca-actions` (boutons de fin de ligne).
 *
 * ```html
 * <table gcaTable [(sort)]="sort" [loading]="products.isLoading()">
 *   <thead><tr><th gcaSortHeader="title">Titre</th></tr></thead>
 * </table>
 * ```
 */
@Component({
  selector: 'table[gcaTable]',
  template: '<ng-content />',
  styleUrl: './table.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gca-table',
    '[class.gca-striped]': 'striped()',
    '[attr.aria-busy]': 'loading() || null',
  },
})
export class GcaTable {
  readonly sort = model<GcaSort | null>(null);
  readonly loading = input(false);
  readonly striped = input(false, { transform: (v: boolean | string) => v !== false });

  toggleSort(field: string): void {
    const current = this.sort();
    const order: GcaSortOrder = current?.field === field && current.order === 'asc' ? 'desc' : 'asc';
    this.sort.set({ field, order });
  }
}

/** En-tête de colonne triable : `<th gcaSortHeader="price">Prix</th>`. */
@Component({
  selector: 'th[gcaSortHeader]',
  template: `
    <button type="button" class="gca-sort-button" (click)="table.toggleSort(gcaSortHeader())">
      <ng-content />
      <span class="gca-sort-icon" [class.gca-sort-active]="order()" aria-hidden="true">
        {{ order() === 'asc' ? '▲' : order() === 'desc' ? '▼' : '↕' }}
      </span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-sort]': 'ariaSort()' },
})
export class GcaSortHeader {
  protected readonly table = inject(GcaTable);
  readonly gcaSortHeader = input.required<string>();

  protected readonly order = computed(() => {
    const sort = this.table.sort();
    return sort?.field === this.gcaSortHeader() ? sort.order : null;
  });
  protected readonly ariaSort = computed(() => {
    const order = this.order();
    return order === 'asc' ? 'ascending' : order === 'desc' ? 'descending' : 'none';
  });
}
