import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../infra/api/api-service';
import {
  ProductChanges,
  productListSchema,
  productSchema,
  ProductSchema,
} from '../../core/schemas/products';

export type { ProductChanges } from '../../core/schemas/products';

export type SortOrder = 'asc' | 'desc';

export interface ProductQuery {
  readonly q: string;
  readonly page: number;
  readonly size: number;
  readonly sortBy?: string;
  readonly order?: SortOrder;
}

export interface ProductSearchResult {
  readonly products: readonly ProductSchema[];
  readonly total: number;
}

@Injectable({ providedIn: 'root' })
export class ProductApi extends ApiService {
  protected readonly baseUrl = 'products';

  /** Recherche plein texte paginée (json-server : `q`, `_page`, `_limit`, `_sort`, `_order`). */
  search({ q, page, size, sortBy, order }: ProductQuery): Observable<ProductSearchResult> {
    return this.getPage('', productListSchema, {
      q: q.trim(),
      _page: page,
      _limit: size,
      _sort: sortBy,
      _order: sortBy ? (order ?? 'asc') : undefined,
    }).pipe(map(({ items, total }) => ({ products: items, total })));
  }

  byId(id: number): Observable<ProductSchema> {
    return this.get(id, productSchema);
  }

  update(id: number, changes: ProductChanges): Observable<ProductSchema> {
    return this.patch(id, changes, productSchema);
  }
}
