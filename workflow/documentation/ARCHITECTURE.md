# Architecture applicative

> **Cible :** Angular 22.2 (version installée), standalone, sans zone.js, composants `OnPush` par défaut.

> **Statut :** implémenté (tâche 007). Les extraits reprennent le code de `src/app` en le simplifiant ; le code fait foi en cas d'écart.
>
> Les écrans de référence sont les [maquettes fonctionnelles](../maquette) ; les composants d'interface proviennent de la librairie [`gca`](../../projects/gca/README.md).

## Sommaire

1. [Décisions clés](#1-décisions-clés)
2. [État actuel et points d'attention](#2-état-actuel-et-points-dattention)
3. [Organisation des fichiers](#3-organisation-des-fichiers)
4. [Conventions Angular 22](#4-conventions-angular-22)
5. [Données : lecture, écriture, état partagé](#5-données--lecture-écriture-état-partagé)
6. [Formulaires](#6-formulaires)
7. [Routing, guards et resolvers](#7-routing-guards-et-resolvers)
8. [HTTP et interceptors](#8-http-et-interceptors)
9. [Notifications](#9-notifications)
10. [Pipes, directives et composants partagés](#10-pipes-directives-et-composants-partagés)
11. [Tests](#11-tests)
12. [Mise en œuvre progressive](#12-mise-en-œuvre-progressive)
13. [Environnement de développement](#13-environnement-de-développement)

## 1. Décisions clés

| Sujet | Décision |
| --- | --- |
| Composants | Standalone, `inject()`, `input()` / `output()` / `model()`, contrôle de flux `@if` / `@for` / `@switch`. |
| Réactivité | Signaux pour l'état et les dérivations (`signal`, `computed`, `linkedSignal`). RxJS seulement pour les flux d'événements. |
| Accès HTTP | `HttpClient` encapsulé par la classe abstraite `ApiService` ; un service d'API par domaine en hérite (`ProductApi extends ApiService`). Les services n'adressent que des chemins **relatifs** (`products/12`). |
| Backend | `json-server` 0.17.4 utilisé comme module Express (`server/server.cjs`), port **5050**, avec middlewares d'authentification (§ 13). |
| Proxification | Interceptor `apiUrlInterceptor` : préfixe `API_BASE_URL` (`/api`) ajouté aux seules requêtes d'`ApiService` ; `ng serve` relaie `/api` vers `http://localhost:5050` (`proxy.conf.json`). Aucune URL de backend dans le code, aucun CORS. |
| Authentification | Jeton opaque obtenu par `POST /auth/login`, injecté par `authInterceptor` ; `401` → fermeture de session et retour à `/login` (`unauthorizedInterceptor`). |
| Lecture de données | Méthode `Observable` du service d'API, exposée à la page en signaux via `rxResource()` (paramètres issus de l'URL). |
| Écriture de données | Méthode `Observable` du service d'API, appelée depuis une action (soumission de formulaire). |
| Validation des réponses | Schémas Zod (`core/schemas`), appliqués à la frontière HTTP et à la relecture du stockage local. Import `import * as z from 'zod'` (arbre secoué). |
| Formulaires | Signal Forms (`@angular/forms/signals`) : `form()`, `[formField]`, `[formRoot]`. |
| État partagé | Service `providedIn: 'root'` à signaux, uniquement si plusieurs écrans partagent l'état (session, notifications). |
| Routing | Routes chargées à la demande, guards et resolvers fonctionnels, paramètres reçus en `input()` via `withComponentInputBinding()`. |
| HTTP | `provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor, unauthorizedInterceptor]))` ; backend Fetch par défaut (`withFetch()` est déprécié). |
| Interface | Composants de la librairie `gca` (`projects/gca`, alias `gca` → `dist/gca`) ; thème `gca-theme.css` déclaré dans `angular.json`. |
| HTTPS de développement | `ng serve` en HTTPS avec un certificat auto-signé `localhost` généré sur selfsignedcert.com (`certs/`, non versionné). |

## 2. État actuel et points d'attention

Les six étapes du § 12 sont implémentées : connexion, recherche, détail, modification de produit et notifications persistées fonctionnent contre json-server, en HTTPS, via le proxy de développement. `strict` et `strictTemplates` sont activés ; `zod` et `json-server` sont déclarés dans `package.json`.

Choix et limites à connaître :

- **Identifiant produit numérique** : `id: z.number().int().positive()` ; le resolver convertit le paramètre `:id` et redirige vers `/not-found` s'il n'est pas un entier positif.
- **Pagination** : json-server renvoie un tableau et le total dans l'en-tête `X-Total-Count` ; `ApiService.getPage()` les réunit (`{ items, total }`).
- **Recherche** : `q` de json-server est un plein texte sur tous les champs (titre, description, catégorie…), pas seulement le titre.
- **Sessions serveur en mémoire** : un redémarrage de json-server invalide les jetons ; le client reçoit `401` et revient à la connexion avec `returnUrl`.
- **Backend de développement uniquement** : mots de passe hachés (`scrypt`) mais comptes de démonstration ; le proxy et le certificat ne concernent que `ng serve`. Un déploiement fournit son propre backend et sa valeur d'`API_BASE_URL`.
- **Librairie construite avant l'application** : l'alias `gca` pointe vers `dist/gca` ; les scripts `npm start`, `npm run build` et `npm test` lancent `ng build gca` au préalable.

## 3. Organisation des fichiers

```text
server/
  server.cjs                    # json-server 0.17.4 + middlewares (auth, cloisonnement)
  db.seed.json                  # données de référence (versionnées)
  db.json                       # base de travail (générée, ignorée par Git)
certs/                          # certificat HTTPS de développement (README seul versionné)
proxy.conf.json                 # /api → http://localhost:5050
src/app/
  app.routes.ts                 # routes racines + pages de repli
  config/app.config.ts          # providers applicatifs (routeur, HTTP, locale)
  shell/                        # App (racine), AppLayout (gca-main-layout), NotFoundPage
  core/                         # singletons transverses, sans UI
    auth/                       # AuthApi, AuthService, authGuard / guestGuard, interceptors
    http/                       # API_BASE_URL, apiUrlInterceptor (proxification)
    navigation/                 # unsavedChangesGuard
    notifications/              # NotificationApi, NotificationStore
    schemas/                    # schémas Zod : products, auth, notifications
  features/
    products/
      product-api.ts            # ProductApi extends ApiService
      products.routes.ts        # routes du domaine (export default)
      product-resolver.ts
      pages/                    # product-search, product-detail, product-edit (.ts/.html/.scss)
    auth/pages/                 # login-page
    notifications/pages/        # notifications-page
  infra/
    api/api-service.ts          # classe abstraite encapsulant HttpClient
  components/ directives/ pipes/   # partagés, seulement après un 2e usage réel
```

Règles :

- Un fichier par composant (`product-search-page.ts` + `.html` si le template dépasse ~30 lignes).
- Commencer à plat dans la feature ; créer un sous-dossier quand il y a plusieurs fichiers du même type.
- `core` ne contient pas de composants visuels. Un composant ne migre vers `components/` qu'une fois réutilisé par un deuxième domaine.
- `infra/` regroupe les adaptateurs techniques sans logique métier : `ApiService` pour HTTP, puis, au besoin réel, stockage ou télémétrie.

## 4. Conventions Angular 22

**Composants**

- Standalone (implicite), `OnPush` implicite : ne pas renseigner `standalone` ni `changeDetection`.
- Dépendances via `inject()` dans les champs, jamais par le constructeur.
- Entrées / sorties : `input()`, `input.required()`, `output()`, `model()` pour un double binding. Pas de `@Input` / `@Output`.
- Liaisons d'hôte via la propriété `host` du décorateur, pas `@HostBinding` / `@HostListener`.
- Templates : `@if`, `@for` (avec `track`), `@switch`, `@let` ; `[class.x]` / `[style.x]` plutôt que `ngClass` / `ngStyle`.
- Pages : orchestration (route, données, navigation). Composants `ui/` : présentation pure par `input()` / `output()`.
- Membres utilisés uniquement par le template : `protected`.

**Signaux et RxJS**

| Besoin | Outil |
| --- | --- |
| État local modifiable | `signal()` |
| Valeur dérivée | `computed()` |
| État modifiable réinitialisé par une source (ex. modèle de formulaire depuis le produit résolu) | `linkedSignal()` |
| Données distantes en lecture | `rxResource()` sur une méthode du service d'API |
| Action ponctuelle (enregistrer, supprimer) | `Observable` de l'API, converti avec `firstValueFrom` dans une action async |
| Flux d'événements (debounce, annulation, websocket) | RxJS, puis `toSignal()` pour l'affichage |
| Effet de bord vers l'extérieur (stockage local, focus) | `effect()` — jamais pour synchroniser deux signaux |

**Nommage et typage**

- Classes sans suffixe technique superflu : `ProductSearchPage`, `ProductApi`, `NotificationStore` ; sélecteurs préfixés `app-`.
- Pas de `any`, pas de cast non vérifié : toute donnée externe passe par un schéma.
- Collections exposées en `readonly T[]`.
- Locale `fr-FR` fournie au niveau application pour les pipes `currency`, `date` et `number` (voir § 8).

<details>
<summary>Exemple : composant de présentation</summary>

```ts
@Component({
  selector: 'app-product-row',
  imports: [CurrencyPipe],
  host: { role: 'row', '[class.selected]': 'selected()' },
  template: `
    <span>{{ product().title }}</span>
    <span>{{ product().price | currency: 'EUR' }}</span>
    <button type="button" (click)="edit.emit(product().id)">Modifier</button>
  `,
})
export class ProductRow {
  readonly product = input.required<ProductSchema>();
  readonly selected = input(false);
  readonly edit = output<number>();
}
```

</details>

## 5. Données : lecture, écriture, état partagé

Un socle (`ApiService`) et trois patterns d'usage suffisent à ce stade. Le choix dépend de l'usage, pas de la ressource.

| Cas | Pattern | Écran |
| --- | --- | --- |
| Accéder au backend | Service d'API héritant d'`ApiService` | Tous |
| Lire des données qui dépendent de l'écran | `rxResource()` dans la page | Recherche produits |
| Lire des données indispensables à l'affichage d'une route | Resolver + `input()` | Détail, modification |
| Modifier des données | Méthode du service d'API dans l'action de soumission | Modification |
| Partager un état entre écrans | Store à signaux `providedIn: 'root'` | Notifications, session |

### 5.1 Services d'API : `ApiService`

Tout accès HTTP passe par un service de domaine héritant de la classe abstraite `ApiService` (`infra/api/api-service.ts`). Elle encapsule `HttpClient` et fournit des helpers protégés qui :

- construisent un chemin **relatif** à partir de `baseUrl` (ex. `products`) et de segments encodés (`encodeURIComponent`) ;
- marquent la requête avec le jeton de contexte `API_REQUEST` : seules ces requêtes sont préfixées par `API_BASE_URL` et reçoivent le jeton d'authentification (§ 8) ;
- ignorent les paramètres de requête `null`, `undefined` ou vides ;
- valident chaque réponse avec un schéma (`parse`), compatible avec les schémas Zod de `core/schemas` ;
- lisent une page de résultats (`getPage`) : corps validé + total de l'en-tête `X-Total-Count` ;
- retournent des `Observable` froids : aucune requête sans souscription, ni état interne, ni retry. Les erreurs HTTP et de validation sont propagées telles quelles.

Un service concret ne déclare que son `baseUrl` et des méthodes métier d'une ligne. Les composants ne manipulent jamais `HttpClient` directement.

<details>
<summary>Exemple : classe abstraite <code>ApiService</code></summary>

```ts
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

/** Marque une requête destinée au backend (proxification et jeton, § 8). */
export const API_REQUEST = new HttpContextToken<boolean>(() => false);

export abstract class ApiService {
  protected readonly http = inject(HttpClient);

  /** Chemin relatif de la ressource (ex. `products`), préfixé par `apiUrlInterceptor`. */
  protected abstract readonly baseUrl: string;

  protected get<T>(path: ApiPath, schema: ResponseSchema<T>, query?: ApiQuery): Observable<T> {
    return this.http
      .get<unknown>(this.url(path), this.options(query))
      .pipe(map((body) => schema.parse(body)));
  }

  protected getPage<T>(path: ApiPath, schema: ResponseSchema<readonly T[]>, query?: ApiQuery): Observable<ApiPage<T>> {
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

  // put() et patch() suivent le même modèle que post().

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
```

Les helpers sont `protected` : seule l'API métier du service concret est publique.

</details>

<details>
<summary>Exemple : <code>ProductApi extends ApiService</code> (json-server)</summary>

```ts
export interface ProductQuery {
  readonly q: string;
  readonly page: number;
  readonly size: number;
  readonly sortBy?: string;
  readonly order?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class ProductApi extends ApiService {
  protected readonly baseUrl = 'products';

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
```

`PATCH` plutôt que `PUT` : json-server remplace la ressource entière sur `PUT`, ce qui effacerait les champs non éditables (catégorie, stock…).

</details>

Règles :

- Un service d'API par domaine (`ProductApi`, `AuthApi`, `NotificationApi`), `providedIn: 'root'`, sans état.
- Ne pas exposer de méthode générique `list` / `create` dans `ApiService` : chaque domaine décrit les opérations réellement offertes par son backend.
- Une réponse enveloppée (ex. `{ products: [...] }`) est validée par son propre schéma ; le service peut la déballer avec `map` si les écrans n'ont besoin que de la liste.
- Le préfixe d'URL, le jeton, la gestion du `401` et la journalisation relèvent des interceptors (§ 8), pas d'`ApiService`.

### 5.2 Lecture dans la page avec `rxResource`

L'état de la page est dans l'URL (partageable, restauré au retour depuis une fiche). Les paramètres arrivent en `input()`, et `rxResource()` appelle la méthode du service d'API à chaque changement : la requête précédente est annulée, la ressource est détruite avec le composant, et le template lit les états en signaux : `isLoading()`, `error()`, `hasValue()`, `value()`, `reload()`.

<details>
<summary>Exemple : page de recherche (maquette 02)</summary>

```ts
@Component({
  selector: 'app-product-search-page',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <form role="search" (submit)="$event.preventDefault(); search(box.value)">
      <input #box type="search" [value]="q()" aria-label="Rechercher un produit" />
    </form>

    @if (products.error()) {
      <p role="alert">Impossible de charger les produits.</p>
      <button type="button" (click)="products.reload()">Réessayer</button>
    } @else if (products.isLoading()) {
      <p aria-busy="true">Chargement…</p>
    } @else if (products.hasValue()) {
      <ul>
        @for (product of products.value().products; track product.id) {
          <li>
            <a [routerLink]="[product.id]">{{ product.title }}</a>
            {{ product.price | currency: 'EUR' }}
          </li>
        } @empty {
          <li>Aucun produit ne correspond à « {{ q() }} ».</li>
        }
      </ul>
    }
  `,
})
export class ProductSearchPage {
  private readonly api = inject(ProductApi);
  private readonly router = inject(Router);

  // Paramètres d'URL reçus via withComponentInputBinding()
  readonly q = input('');
  readonly page = input(1, { transform: numberAttribute });

  protected readonly products = rxResource({
    params: () => ({ q: this.q(), page: this.page(), size: 20 }),
    stream: ({ params }) => this.api.search(params),
  });

  protected search(q: string): void {
    void this.router.navigate(['/products'], { queryParams: { q: q.trim() || null, page: null } });
  }
}
```

</details>

La recherche « à la frappe » (délai de 300 ms de la maquette) est assurée par `gca-search-input`, qui émet `(search)` après le délai ; la page met alors l'URL à jour. L'implémentation réelle (`features/products/pages/product-search-page`) ajoute le tri (`gcaTable` + `gcaSortHeader`, paramètres `sortBy` / `order`), la pagination (`gca-paginator`, paramètres `page` / `size`), des squelettes de chargement et les états vide / erreur avec `gca-empty-state`.

### 5.3 État partagé : store à signaux

Un store expose un état en lecture seule (`asReadonly()`, `computed()`) et des méthodes typées qui le modifient. L'appelant n'écrit jamais directement dans les signaux. Exemple complet : `NotificationStore` au § 9.

Ne pas créer de store pour l'état d'un seul écran : un `signal()` ou une ressource dans la page suffit.

## 6. Formulaires

Utiliser **Signal Forms**, stables depuis Angular 22 : le modèle est un signal, les règles sont déclarées dans un schéma, le template lie chaque champ par `[formField]`. `[formRoot]` gère `novalidate`, `preventDefault` et la soumission.

Points d'usage :

- Le modèle provient d'un `linkedSignal()` sur le produit résolu : il se réinitialise si la route change de produit.
- Messages d'erreur dans le schéma (`{ message }`) ; affichage conditionné à `touched()`.
- `dirty()`, `submitting()`, `invalid()` pilotent les boutons et le guard de sortie.
- L'action de soumission renvoie `undefined` en cas de succès ou une erreur `{ kind, message }` qui est rattachée au formulaire.
- Pour réutiliser les règles Zod existantes : `validateStandardSchema(p, schema)` ; garder des règles explicites lorsque les messages doivent être spécifiques.

<details>
<summary>Exemple : page de modification (maquette 04)</summary>

```ts
@Component({
  selector: 'app-product-edit-page',
  imports: [FormRoot, FormField],
  template: `
    <form [formRoot]="productForm">
      <label>
        Titre
        <input [formField]="productForm.title" />
      </label>
      @if (productForm.title().touched()) {
        @for (error of productForm.title().errors(); track error.kind) {
          <p class="error">{{ error.message }}</p>
        }
      }

      <label>
        Prix
        <input type="number" step="0.01" [formField]="productForm.price" />
      </label>

      <button type="submit" [disabled]="!productForm().dirty() || productForm().submitting()">
        {{ productForm().submitting() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </form>
  `,
})
export class ProductEditPage implements HasUnsavedChanges {
  private readonly api = inject(ProductApi);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationStore);

  readonly product = input.required<ProductSchema>();

  // Modèle du formulaire (champs éditables), réinitialisé si le produit résolu change.
  protected readonly model = linkedSignal<ProductChanges>(() => {
    const { title, description, price, thumbnail } = this.product();
    return { title, description, price, thumbnail };
  });

  protected readonly productForm = form(
    this.model,
    (p) => {
      required(p.title, { message: 'Le titre est obligatoire.' });
      minLength(p.title, 3, { message: '3 caractères minimum.' });
      maxLength(p.title, 100, { message: '100 caractères maximum.' });
      min(p.price, 0, { message: 'Le prix doit être supérieur ou égal à 0.' });
      required(p.description, { message: 'La description est obligatoire.' });
      maxLength(p.description, 1000, { message: '1 000 caractères maximum.' });
      pattern(p.thumbnail, /^https:\/\//, { message: 'URL https:// attendue.' });
    },
    {
      submission: {
        action: async (f) => {
          try {
            const saved = await firstValueFrom(this.api.update(this.product().id, f().value()));
            f().reset();
            this.notifications.add({ level: 'success', title: 'Produit enregistré', message: saved.title });
            await this.router.navigate(['/products', saved.id], { queryParamsHandling: 'preserve' });
            return undefined;
          } catch {
            return { kind: 'server', message: "L'enregistrement a échoué. Réessayez." };
          }
        },
      },
    },
  );

  hasUnsavedChanges(): boolean {
    return this.productForm().dirty();
  }
}
```

</details>

`f().reset()` remet `dirty` à `false` avant la navigation, ce qui évite la confirmation du guard de sortie après un enregistrement réussi. L'écriture est persistée par json-server (`PATCH /products/:id`) : la fiche rechargée affiche la nouvelle valeur. L'implémentation réelle ajoute les composants `gca` (champs avec compteur, aperçu de la miniature, barre d'actions collante, toast de confirmation).

## 7. Routing, guards et resolvers

| Route | Écran | Guards | Resolver |
| --- | --- | --- | --- |
| `/login?returnUrl=` | Connexion | `guestGuard` | — |
| `/products?q=&page=&size=&sortBy=&order=` | Recherche | `authGuard` (parent) | — |
| `/products/:id` | Détail | `authGuard` (parent) | `productResolver` |
| `/products/:id/edit` | Modification | `authGuard` (parent), `unsavedChangesGuard` | `productResolver` |
| `/notifications?status=&level=` | Notifications | `authGuard` (parent) | — |
| `/not-found`, `**` | Page introuvable | — | — |

Règles :

- Fonctions uniquement (`CanActivateFn`, `CanDeactivateFn`, `ResolveFn`), `inject()` en début de fonction.
- Un guard refuse en renvoyant une `UrlTree` ; un resolver redirige en renvoyant une `RedirectCommand`. Pas de `router.navigate()` dans un guard.
- Un resolver ne charge que ce sans quoi la page ne peut s'afficher (produit du détail). Les listes se chargent dans la page.
- `authGuard` est posé une fois sur la route parente des écrans authentifiés, qui charge aussi le gabarit `AppLayout` (`gca-main-layout`).
- Un guard client améliore le parcours ; il ne protège pas l'API. Les droits sont vérifiés par le serveur (§ 13).

<details>
<summary>Exemple : routes et configuration</summary>

```ts
// app.routes.ts
export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/pages/login-page') },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/app-layout'),
    children: [
      { path: 'products', loadChildren: () => import('./features/products/products.routes') },
      { path: 'notifications', loadComponent: () => import('./features/notifications/pages/notifications-page') },
      { path: 'not-found', loadComponent: () => import('./shell/not-found-page') },
      { path: '', pathMatch: 'full', redirectTo: 'products' },
    ],
  },
  { path: '**', loadComponent: () => import('./shell/not-found-page') },
];

// features/products/products.routes.ts
export default [
  { path: '', component: ProductSearchPage, title: 'Produits · Atelier' },
  { path: ':id', component: ProductDetailPage, resolve: { product: productResolver } },
  {
    path: ':id/edit',
    component: ProductEditPage,
    resolve: { product: productResolver },
    canDeactivate: [unsavedChangesGuard],
  },
] satisfies Routes;
```

`loadComponent: () => import('…')` sans `.then()` suppose que le composant est l'export par défaut du fichier.

</details>

<details>
<summary>Exemple : guards et resolver</summary>

```ts
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() || router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/products']) : true;
};

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

// Dialogue applicatif de la librairie gca (Promise<boolean>).
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  inject(GcaConfirmService).confirm({
    header: 'Quitter sans enregistrer ?',
    message: 'Vos modifications seront perdues.',
    acceptLabel: 'Quitter',
    rejectLabel: 'Rester sur la page',
    severity: 'danger',
  });

export const productResolver: ResolveFn<ProductSchema> = (route) => {
  const router = inject(Router);
  const notFound = new RedirectCommand(router.parseUrl('/not-found'), { skipLocationChange: true });
  const id = Number(route.paramMap.get('id'));

  if (!Number.isInteger(id) || id <= 0) {
    return notFound;
  }
  return inject(ProductApi)
    .byId(id)
    .pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(notFound) : throwError(() => error),
      ),
    );
};
```

`skipLocationChange` conserve l'URL demandée dans la barre d'adresse pendant l'affichage de la page introuvable.

</details>

## 8. HTTP et interceptors

Trois interceptors, enregistrés dans cet ordre :

1. **Proxification** (`apiUrlInterceptor`, `core/http`) : préfixe par `API_BASE_URL` (`/api` par défaut) les requêtes marquées `API_REQUEST` par `ApiService`. En développement, `ng serve` relaie `/api` vers json-server (§ 13) ; un autre environnement fournit sa propre valeur du jeton d'injection.
2. **Authentification** (`authInterceptor`, `core/auth`) : ajoute l'en-tête `Authorization` (schéma `Bearer`), uniquement aux requêtes `API_REQUEST`. Aucune requête tierce (CDN d'images…) ne reçoit le jeton.
3. **Session expirée** (`unauthorizedInterceptor`, `core/auth`) : sur un `401` du backend alors qu'une session existe, ferme la session locale et renvoie vers `/login?returnUrl=…`, puis relance l'erreur. L'échec de connexion (pas encore de session) n'est pas intercepté.

Les erreurs métier (validation, 404, conflit) restent gérées par l'écran concerné. Un interceptor ne transforme jamais une erreur en succès et n'affiche pas de toast global. Pas de retry automatique sur une écriture.

<details>
<summary>Exemple : <code>app.config.ts</code> et interceptors</summary>

```ts
// main.ts : données de locale pour les pipes
registerLocaleData(localeFr);

// config/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Ordre : proxification (/api), jeton, puis gestion du 401 au retour.
    provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor, unauthorizedInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
  ],
};

// core/http/api-url-interceptor.ts
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(API_REQUEST)) {
    return next(req);
  }
  const base = inject(API_BASE_URL).replace(/\/+$/, '');
  return next(req.clone({ url: `${base}/${req.url.replace(/^\/+/, '')}` }));
};

// core/auth/auth-interceptors.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token || !req.context.get(API_REQUEST)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }));
};

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        req.context.get(API_REQUEST) &&
        auth.isAuthenticated()
      ) {
        auth.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
```

`AuthService` (`core/auth/auth-service.ts`) expose `isAuthenticated`, `token` et `user` sous forme de `computed()` sur un signal de session privé, ainsi que `login()`, `logout()` (révocation serveur puis fermeture locale) et `clear()` (fermeture locale seule, utilisée sur `401`). La session `{ token, expiresAt, user }` est conservée dans `sessionStorage`, ou dans `localStorage` si « Rester connecté » est coché ; elle est relue au démarrage, validée par `authSessionSchema` et ignorée si elle a expiré.

</details>

## 9. Notifications

Deux mécanismes distincts :

| | Notification persistante | Toast |
| --- | --- | --- |
| Usage | Historique consultable (écran 05), compteur du menu | Confirmation ou erreur immédiate, éphémère |
| Source | `NotificationStore` (`core/notifications`), persisté par `NotificationApi` | `GcaToastService` + `<gca-toast />` (librairie `gca`) |
| Accessibilité | Liste, niveau affiché en texte | `role="status"` / `role="alert"`, fermeture clavier |

Les notifications sont persistées par json-server (`/notifications`), cloisonnées par utilisateur côté serveur (§ 13). Le store garde la même API publique (`items`, `unreadCount`, `add`, `markAsRead`, `markAllAsRead`, `remove`) : les écrans ignorent la persistance.

- **Chargement** : un `rxResource` dont le paramètre est l'identifiant de l'utilisateur connecté ; il se recharge à chaque ouverture de session et se vide à la fermeture.
- **Écritures optimistes** : l'état local (`linkedSignal` sur la ressource) est modifié immédiatement, puis la requête part ; en cas d'échec, la liste est rechargée depuis le serveur.
- **Création** : `add()` attend la réponse du serveur (identifiant et date attribués par le serveur) avant d'insérer la notification.
- **Suppression annulable** : l'écran masque la notification pendant 5 s et propose « Annuler » dans un toast ; la suppression n'est envoyée qu'à l'expiration du délai (ou en quittant l'écran).

<details>
<summary>Exemple : <code>NotificationStore</code> persistant</summary>

```ts
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(NotificationApi);
  private readonly auth = inject(AuthService);

  private readonly remote = rxResource({
    params: () => this.auth.user()?.id,
    stream: () => this.api.list(),
  });

  private readonly _items = linkedSignal<readonly AppNotification[]>(() =>
    this.remote.hasValue() ? this.remote.value() : [],
  );

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => n.readAt === null).length);

  add(notification: NewNotification): void {
    this.sync(this.api.create(notification), (created) => this._items.update((items) => [created, ...items]));
  }

  markAsRead(id: string): void {
    const now = new Date().toISOString();
    if (!this._items().some((n) => n.id === id && n.readAt === null)) return;
    this._items.update((items) => items.map((n) => (n.id === id ? { ...n, readAt: now } : n)));
    this.sync(this.api.markAsRead(id, now));
  }

  remove(id: string): void {
    this._items.update((items) => items.filter((n) => n.id !== id));
    this.sync(this.api.remove(id));
  }

  // markAllAsRead() : même principe, une requête PATCH par notification non lue (forkJoin).

  private sync<T>(request: Observable<T>, onSuccess: (value: T) => void = () => undefined): void {
    if (!this.auth.isAuthenticated()) return;
    request.subscribe({ next: onSuccess, error: () => this.remote.reload() });
  }
}
```

Le modèle (`AppNotification`, `NotificationLevel`, `NewNotification`) est dérivé du schéma Zod `core/schemas/notifications.ts`. Les filtres de l'écran (statut, niveau) sont des `computed()` dans la page à partir de `items()` et des paramètres d'URL ; le store n'a pas à les connaître.

</details>

## 10. Pipes, directives et composants partagés

- **Pipes** : transformation pure et synchrone réutilisée dans les templates. Utiliser d'abord `currency`, `date`, `number` (locale `fr-FR`). Jamais d'appel réseau ni de logique métier.
- **Directives** : comportement d'interface réutilisable sans template (ex. `appAutofocus` pour le focus initial de la connexion), avec `input()` et `host`.
- **Composants partagés** : API `input()` / `output()` stable, une responsabilité. Les composants génériques viennent de la librairie `gca` ; un composant applicatif reste dans la feature tant qu'un seul domaine l'utilise.
- **Images produit** : `gca-image` (dimensions fixées, chargement différé, image de repli en cas d'erreur).

## 11. Tests

- Runner : Vitest via `ng test` (`npm test` pour l'application, `npm run test:gca` pour la librairie).
- HTTP : `provideHttpClient()` + `provideHttpClientTesting()`, puis `HttpTestingController`.
- Stockage de session : jeton `SESSION_STORAGES` remplacé par des `Storage` en mémoire.
- Composants : `TestBed.createComponent`, `fixture.componentRef.setInput()` pour les entrées, `await fixture.whenStable()` (pas de zone : pas de `fakeAsync`).

| Fichier | Couverture |
| --- | --- |
| `infra/api/api-service.spec.ts` | Chemin relatif et encodage, paramètres vides ignorés, marquage `API_REQUEST`, Observable froid, page + `X-Total-Count`, verbes et corps, réponse invalide rejetée, erreur HTTP propagée. |
| `core/auth/auth-interceptors.spec.ts` | Préfixe `/api` et `API_BASE_URL` configurable, jeton ajouté aux seules requêtes backend, `401` → session fermée + redirection, échec de connexion non intercepté. |
| `core/auth/auth-service.spec.ts` | Connexion (`sessionStorage` / `localStorage`), restauration, session expirée ou illisible ignorée, déconnexion avec révocation, `authGuard` / `guestGuard`. |
| `core/notifications/notification-store.spec.ts` | Chargement à l'ouverture de session, compteur, lecture optimiste + `PATCH`, création, suppression et rechargement sur erreur, vidage à la fermeture de session. |
| `features/products/products.spec.ts` | Paramètres json-server de recherche, `PATCH` de modification, resolver (id invalide, 404, autres erreurs). |
| `shell/app.spec.ts` | Racine : `router-outlet`, `gca-toast`, `gca-confirm-dialog`, affichage d'un toast. |

Le serveur (`server/server.cjs`) est vérifié par un test de fumée HTTP (401 sans jeton, connexion, pagination, `/users` masqué, cloisonnement des notifications, déconnexion), décrit dans le rapport 007.

## 12. Mise en œuvre progressive

Toutes les étapes sont réalisées (tâche 007) :

1. ✅ **Fondations** : `zod` déclaré, `id` numérique, `strict` et `strictTemplates`, locale `fr-FR`.
2. ✅ **Configuration et accès HTTP** : `provideHttpClient` + interceptors, `withComponentInputBinding`, route `**`, `ApiService` et ses tests.
3. ✅ **Produits en lecture** : `ProductApi`, page de recherche (`rxResource`), resolver et page de détail, états de chargement, vide et erreur.
4. ✅ **Produits en écriture** : page de modification en Signal Forms, `unsavedChangesGuard` avec `GcaConfirmService`.
5. ✅ **Authentification** : `AuthService`, page de connexion, `authGuard` / `guestGuard`, interceptors, backend json-server authentifié.
6. ✅ **Notifications** : `NotificationStore` persistant, écran récapitulatif, badge du menu, toasts.

Une abstraction commune n'est extraite qu'après un deuxième usage réel.

## 13. Environnement de développement

```text
navigateur ──https──▶ ng serve :4200 ──/api/* (préfixe retiré)──▶ json-server :5050
                      (certs/localhost.*)   proxy.conf.json           server/server.cjs
```

**Démarrage** (deux terminaux) :

```bash
npm run api      # json-server sur http://localhost:5050 (npm run api:reset : données de référence)
npm start        # ng build gca, puis https://localhost:4200
```

Comptes de démonstration : `marie.laurent@atelier.dev` et `paul.martin@atelier.dev`, mot de passe `Atelier2026!`.

**json-server 0.17.4** (`server/server.cjs`), utilisé comme module Express :

| Middleware | Rôle |
| --- | --- |
| `jsonServer.defaults({ noCors: true })` | Journalisation, no-cache, pas de CORS (le navigateur passe par le proxy). |
| `POST /auth/login` | Vérifie l'e-mail et le mot de passe (`scrypt`, comparaison à temps constant), crée un jeton aléatoire de 256 bits valable 8 h, renvoie `{ token, expiresAt, user }`. Seule route publique. |
| Contrôle d'accès | Toute autre requête exige `Authorization: Bearer <jeton>` valide, sinon `401`. |
| `GET /auth/me`, `POST /auth/logout` | Utilisateur courant ; révocation du jeton. |
| `/users`, `/db` | Jamais exposés (`404`) : les empreintes de mot de passe restent sur le serveur. |
| `/notifications` | Lecture filtrée sur l'utilisateur, accès à la notification d'un autre utilisateur → `404`, `userId` / `id` / `createdAt` / `readAt` imposés à la création, `userId` retiré des réponses. |
| Routeur json-server | `products` (pagination `_page` / `_limit`, tri `_sort` / `_order`, plein texte `q`, `X-Total-Count`) et `notifications`. |

Les données de référence (`server/db.seed.json` : 100 produits issus de DummyJSON, 2 utilisateurs, notifications) sont versionnées ; `server/db.json` est la base de travail, créée au premier démarrage et ignorée par Git.

**Proxy** (`proxy.conf.json`, déclaré dans `angular.json` > `serve.options.proxyConfig`) : `/api` → `http://localhost:5050`, `pathRewrite` `^/api` → `""`. Le navigateur ne parle qu'à l'origine de l'application.

**HTTPS** : `angular.json` > `serve.options` déclare `ssl`, `sslCert: certs/localhost.crt` et `sslKey: certs/localhost.key`. Le certificat auto-signé (CN `localhost`, SAN `localhost`, `*.localhost`, `127.0.0.1`, RSA 2048, 1 an) est généré sur [selfsignedcert.com](https://www.selfsignedcert.com/generate), type *Self-signed TLS* ; la procédure est décrite dans `certs/README.md`. Les fichiers du certificat et de la clé ne sont pas versionnés. Le navigateur affiche un avertissement tant que `localhost.crt` n'est pas importé dans les autorités de confiance de l'utilisateur.

**Scripts npm** :

| Script | Commande |
| --- | --- |
| `start` | `ng build gca` (via `prestart`) puis `ng serve` (HTTPS + proxy) |
| `api` / `api:reset` | `node server/server.cjs` (`--reset` : recopie `db.seed.json`) |
| `build` | `ng build gca` puis `ng build application` |
| `test` / `test:gca` | Tests Vitest de l'application / de la librairie |
