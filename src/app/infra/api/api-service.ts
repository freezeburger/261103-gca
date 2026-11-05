import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, Observable } from 'rxjs';

/** Schéma de validation d'une réponse (compatible avec les schémas Zod). */
export interface ResponseSchema<T> {
  parse(input: unknown): T;
}

/** Segments de chemin relatifs à `baseUrl`, encodés individuellement. */
export type ApiPath = string | number | readonly (string | number)[];

/** Paramètres de requête ; `null`, `undefined` et chaîne vide sont ignorés. */
export type ApiQuery = Readonly<Record<string, string | number | boolean | null | undefined>>;

/** Page de résultats : éléments validés et total fourni par l'en-tête `X-Total-Count`. */
export interface ApiPage<T> {
  readonly items: readonly T[];
  readonly total: number;
}

/**
 * Marque une requête comme destinée au backend : seules ces requêtes sont préfixées par
 * `API_BASE_URL` (proxification) et reçoivent le jeton d'authentification.
 */
export const API_REQUEST = new HttpContextToken<boolean>(() => false);

export abstract class ApiService {
  protected readonly http = inject(HttpClient);

  /** Chemin relatif de la ressource (ex. `products`), préfixé par l'interceptor `apiUrlInterceptor`. */
  protected abstract readonly baseUrl: string;

  protected get<T>(path: ApiPath, schema: ResponseSchema<T>, query?: ApiQuery): Observable<T> {
    return this.http
      .get<unknown>(this.url(path), this.options(query))
      .pipe(map((body) => schema.parse(body)));
  }

  /** Lecture paginée : le total est lu dans l'en-tête `X-Total-Count` (json-server). */
  protected getPage<T>(
    path: ApiPath,
    schema: ResponseSchema<readonly T[]>,
    query?: ApiQuery,
  ): Observable<ApiPage<T>> {
    return this.http
      .get<unknown>(this.url(path), { ...this.options(query), observe: 'response' })
      .pipe(
        map((response) => {
          const items = schema.parse(response.body);
          const total = Number(response.headers.get('X-Total-Count') ?? Number.NaN);
          return { items, total: Number.isFinite(total) ? total : items.length };
        }),
      );
  }

  protected post<T>(path: ApiPath, body: unknown, schema: ResponseSchema<T>, query?: ApiQuery): Observable<T> {
    return this.http
      .post<unknown>(this.url(path), body, this.options(query))
      .pipe(map((response) => schema.parse(response)));
  }

  protected put<T>(path: ApiPath, body: unknown, schema: ResponseSchema<T>, query?: ApiQuery): Observable<T> {
    return this.http
      .put<unknown>(this.url(path), body, this.options(query))
      .pipe(map((response) => schema.parse(response)));
  }

  protected patch<T>(path: ApiPath, body: unknown, schema: ResponseSchema<T>, query?: ApiQuery): Observable<T> {
    return this.http
      .patch<unknown>(this.url(path), body, this.options(query))
      .pipe(map((response) => schema.parse(response)));
  }

  protected delete(path: ApiPath, query?: ApiQuery): Observable<void> {
    return this.http
      .delete<unknown>(this.url(path), this.options(query))
      .pipe(map(() => undefined));
  }

  private options(query: ApiQuery | undefined): { params: HttpParams; context: HttpContext } {
    return { params: toParams(query), context: new HttpContext().set(API_REQUEST, true) };
  }

  private url(path: ApiPath): string {
    const segments: readonly (string | number)[] = Array.isArray(path) ? path : [path];
    const suffix = segments
      .map((segment) => String(segment))
      .filter((segment) => segment !== '')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const base = this.baseUrl.replace(/\/+$/, '');
    return suffix ? `${base}/${suffix}` : base;
  }
}

function toParams(query: ApiQuery | undefined): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
