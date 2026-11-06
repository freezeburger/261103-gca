import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { map, Observable } from 'rxjs';

/**
 * Contrat minimal d'un schéma de validation, compatible notamment avec Zod.
 * `parse` vérifie les données à l'exécution et peut lever une erreur si elles sont invalides.
 */
export interface ResponseSchema<T> {
  parse(input: unknown): T;
}

/**
 * Chemin relatif à `baseUrl`. Un tableau distingue les segments :
 * `['a/b', 7]` produit le suffixe `a%2Fb/7`, alors qu'une chaîne forme un seul segment.
 */
export type ApiPath = string | number | readonly (string | number)[];

/** Paramètres de requête : `null`, `undefined` et `''` sont ignorés, mais pas `0` ni `false`. */
export type ApiQuery = Readonly<Record<string, string | number | boolean | null | undefined>>;

/** Éléments validés et total fourni par `X-Total-Count` ou, à défaut, par la taille de la page. */
export interface ApiPage<T> {
  readonly items: readonly T[];
  readonly total: number;
}

/**
 * Ce marqueur reste côté Angular : il n'est pas envoyé comme en-tête HTTP.
 * Les intercepteurs l'utilisent pour préfixer l'URL et ajouter un jeton s'il existe.
 * Par défaut, une requête n'est pas marquée (`false`).
 */
export const API_REQUEST = new HttpContextToken<boolean>(() => false);

/**
 * Base commune aux API métier : chaque service enfant définit `baseUrl` et ses opérations.
 * Les Observables HTTP sont froids : chaque souscription déclenche une requête.
 * Les erreurs HTTP et les erreurs de validation sont transmises à l'abonné.
 */
export abstract class ApiService {
  protected readonly http = inject(HttpClient);

  /** Chemin relatif de la ressource (ex. `products`), préfixé par l'interceptor `apiUrlInterceptor`. */
  protected abstract readonly baseUrl: string;

  /** Une réponse externe est `unknown` jusqu'à sa validation par le schéma. */
  protected get<T>(path: ApiPath, schema: ResponseSchema<T>, query?: ApiQuery): Observable<T> {
    return this.http
      .get<unknown>(this.url(path), this.options(query))
      .pipe(map((body) => schema.parse(body)));
  }

  /**
   * `observe: 'response'` donne accès à l'en-tête `X-Total-Count` de json-server.
   * S'il manque ou ne se convertit pas en nombre fini, on utilise `items.length` :
   * ce repli décrit seulement la page reçue, pas le total réel de la collection.
   */
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

  /**
   * Les corps envoyés ne sont pas validés ici : ils sont acceptés comme `unknown`.
   * POST, PUT et PATCH valident en revanche leur réponse avec le schéma fourni.
   */
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

  /** Ignore le corps de la réponse : l'appelant reçoit uniquement le succès ou l'erreur. */
  protected delete(path: ApiPath, query?: ApiQuery): Observable<void> {
    return this.http
      .delete<unknown>(this.url(path), this.options(query))
      .pipe(map(() => undefined));
  }

  /** Signale aux intercepteurs que la requête est destinée au backend. */
  private options(query: ApiQuery | undefined): { params: HttpParams; context: HttpContext } {
    return { params: toParams(query), context: new HttpContext().set(API_REQUEST, true) };
  }

  /**
   * Encode chaque segment séparément pour qu'un `/` dans une valeur ne crée pas de segment.
   * Un chemin vide désigne directement la ressource définie par `baseUrl`.
   */
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
  // HttpParams est immuable : `set` renvoie une nouvelle instance à conserver.
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
