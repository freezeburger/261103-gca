# Architecture applicative

> **Cible :** Angular 22.2 (version installée), standalone, sans zone.js, composants `OnPush` par défaut.
> **Statut :** socle de conventions. Les exemples décrivent la cible ; ils ne supposent pas que les fichiers existent déjà.
> Les écrans de référence sont les [maquettes fonctionnelles](../maquette).

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

## 1. Décisions clés

| Sujet | Décision |
| --- | --- |
| Composants | Standalone, `inject()`, `input()` / `output()` / `model()`, contrôle de flux `@if` / `@for` / `@switch`. |
| Réactivité | Signaux pour l'état et les dérivations (`signal`, `computed`, `linkedSignal`). RxJS seulement pour les flux d'événements. |
| Lecture de données | `httpResource()` déclaré dans la page, alimenté par des signaux (souvent les paramètres d'URL). |
| Écriture de données | Méthodes d'une API de domaine retournant un `Observable` ; pas de classe CRUD générique. |
| Validation des réponses | Schémas Zod existants (`core/schemas`), appliqués à la frontière HTTP. |
| Formulaires | Signal Forms (`@angular/forms/signals`) : `form()`, `[formField]`, `[formRoot]`. |
| État partagé | Service `providedIn: 'root'` à signaux, uniquement si plusieurs écrans partagent l'état (session, notifications). |
| Routing | Routes chargées à la demande, guards et resolvers fonctionnels, paramètres reçus en `input()` via `withComponentInputBinding()`. |
| HTTP | `provideHttpClient(withInterceptors([...]))` ; backend Fetch par défaut (`withFetch()` est déprécié). |

## 2. État actuel et points d'attention

Le projet est un squelette : `main.ts` démarre `App` via `bootstrapApplication`, `config/app.config.ts` fournit le routeur, `app.routes.ts` est vide. Seul `core/schemas/products.ts` contient du code métier.

À traiter avant d'implémenter le domaine produit :

- **Dépendance Zod implicite** : `zod` (4.x) est résolu dans `node_modules` mais absent de `package.json`. Le déclarer explicitement (`npm install zod`).
- **Type de `id`** : le schéma déclare `id: z.string()` alors que DummyJSON renvoie un nombre. En l'état, toute réponse réelle est rejetée par la validation. Choisir `z.number()` ou `z.coerce.string()` et l'appliquer de façon cohérente aux routes (`/products/:id`).
- **Champs manquants pour l'écran de recherche** : la réponse de liste ne déclare pas `total`, `skip` ni `limit`, nécessaires à la pagination maquettée.
- **Endpoint** : `http://dummyjson.com/products` doit passer en `https://`.
- **Mode strict** : `strict` et `strictTemplates` ne sont pas activés. Les activer dès maintenant, tant que le code est réduit.

## 3. Organisation des fichiers

```text
src/app/
  app.routes.ts                 # routes racines + pages de repli
  config/app.config.ts          # providers applicatifs
  shell/                        # composant racine, layout (menu, en-tête)
  core/                         # singletons transverses, sans UI
    auth/                       # AuthService, authGuard, guestGuard, interceptors
    notifications/              # NotificationStore
    schemas/                    # schémas Zod partagés
  features/
    products/
      product-api.ts            # accès HTTP + validation
      products.routes.ts        # routes du domaine (export default)
      product-resolver.ts
      pages/                    # product-search, product-detail, product-edit
      ui/                       # composants propres au domaine
    auth/pages/login/
    notifications/pages/
  components/ directives/ pipes/   # partagés, seulement après un 2e usage réel
```

Règles :

- Un fichier par composant (`product-search-page.ts` + `.html` si le template dépasse ~30 lignes).
- Commencer à plat dans la feature ; créer un sous-dossier quand il y a plusieurs fichiers du même type.
- `core` ne contient pas de composants visuels. Un composant ne migre vers `components/` qu'une fois réutilisé par un deuxième domaine.
- Le dossier `infra/` existant n'est utile qu'en cas d'adaptateur technique réel (stockage, télémétrie) ; ne pas l'alimenter par anticipation.

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
| Données distantes en lecture | `httpResource()` (ou `rxResource()` si la source est un `Observable`) |
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
  readonly edit = output<string>();
}
```

</details>

## 5. Données : lecture, écriture, état partagé

Trois patterns suffisent à ce stade. Le choix dépend de l'usage, pas de la ressource.

| Cas | Pattern | Écran |
| --- | --- | --- |
| Lire des données qui dépendent de l'écran | `httpResource()` dans la page | Recherche produits |
| Lire des données indispensables à l'affichage d'une route | Resolver + `input()` | Détail, modification |
| Modifier des données | Méthode de l'API de domaine | Modification |
| Partager un état entre écrans | Store à signaux `providedIn: 'root'` | Notifications, session |

### 5.1 API de domaine

Une classe par domaine centralise URL, paramètres et validation. Les composants ne construisent jamais de requête HTTP. Les réponses sont validées avec le schéma Zod via l'option `parse` de `httpResource` ou un `map` sur l'`Observable`.

<details>
<summary>Exemple : <code>ProductApi</code></summary>

```ts
export interface ProductQuery {
  readonly q: string;
  readonly page: number;
  readonly size: number;
}

export type ProductChanges = Omit<ProductSchema, 'id'>;

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  /** Lecture réactive : à appeler dans un contexte d'injection (champ de composant). */
  search(query: Signal<ProductQuery>) {
    return httpResource(
      () => {
        const { q, page, size } = query();
        return {
          url: `${productApiEndpoint}/search`,
          params: { q, limit: size, skip: (page - 1) * size },
        };
      },
      { parse: (body) => productApiResponseSchema.parse(body) },
    );
  }

  byId(id: string): Observable<ProductSchema> {
    return this.http
      .get<unknown>(`${productApiEndpoint}/${encodeURIComponent(id)}`)
      .pipe(map((body) => productSchema.parse(body)));
  }

  update(id: string, changes: ProductChanges): Observable<ProductSchema> {
    return this.http
      .put<unknown>(`${productApiEndpoint}/${encodeURIComponent(id)}`, changes)
      .pipe(map((body) => productSchema.parse(body)));
  }
}
```

</details>

`search()` crée une ressource liée au composant qui l'appelle : elle est relancée à chaque changement de `query`, annule la requête précédente et est détruite avec le composant. Les méthodes `Observable` sont froides : sans souscription, aucune requête.

N'introduire une classe de base commune qu'après plusieurs API réelles présentant des opérations strictement identiques.

### 5.2 Lecture dans la page avec `httpResource`

L'état de la page est dans l'URL (partageable, restauré au retour depuis une fiche). Les paramètres arrivent en `input()`, la requête en découle et le template affiche directement les états de la ressource : `isLoading()`, `error()`, `hasValue()`, `value()`, `reload()`.

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
  private readonly router = inject(Router);

  // Paramètres d'URL reçus via withComponentInputBinding()
  readonly q = input('');
  readonly page = input(1, { transform: numberAttribute });

  private readonly query = computed(() => ({ q: this.q(), page: this.page(), size: 20 }));
  protected readonly products = inject(ProductApi).search(this.query);

  protected search(q: string): void {
    void this.router.navigate(['/products'], { queryParams: { q: q.trim() || null, page: null } });
  }
}
```

</details>

La recherche « à la frappe » (délai de 300 ms dans la maquette) se fait en mettant à jour l'URL depuis un flux `debounceTime` sur l'événement `input` ; l'utilitaire `debounced()` d'Angular est encore expérimental en 22.

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

  // Modèle du formulaire, réinitialisé si le produit résolu change.
  protected readonly model = linkedSignal<ProductChanges>(() => {
    const { id: _id, ...changes } = this.product();
    return changes;
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
            await this.router.navigate(['/products', saved.id]);
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

`f().reset()` remet `dirty` à `false` avant la navigation, ce qui évite la confirmation du guard de sortie après un enregistrement réussi. DummyJSON simule les écritures : la fiche rechargée affichera la valeur d'origine tant qu'aucun backend réel n'est branché.

## 7. Routing, guards et resolvers

| Route | Écran | Guards | Resolver |
| --- | --- | --- | --- |
| `/login?returnUrl=` | Connexion | `guestGuard` | — |
| `/products?q=&page=` | Recherche | `authGuard` (parent) | — |
| `/products/:id` | Détail | `authGuard` (parent) | `productResolver` |
| `/products/:id/edit` | Modification | `authGuard` (parent), `unsavedChangesGuard` | `productResolver` |
| `/notifications?status=&level=` | Notifications | `authGuard` (parent) | — |
| `/not-found`, `**` | Page introuvable | — | — |

Règles :

- Fonctions uniquement (`CanActivateFn`, `CanDeactivateFn`, `ResolveFn`), `inject()` en début de fonction.
- Un guard refuse en renvoyant une `UrlTree` ; un resolver redirige en renvoyant une `RedirectCommand`. Pas de `router.navigate()` dans un guard.
- Un resolver ne charge que ce sans quoi la page ne peut s'afficher (produit du détail). Les listes se chargent dans la page.
- `authGuard` est posé une fois sur la route parente des écrans authentifiés.
- Un guard client améliore le parcours ; il ne protège pas l'API. Les droits sont vérifiés par le serveur.

<details>
<summary>Exemple : routes et configuration</summary>

```ts
// app.routes.ts
export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/pages/login-page') },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'products', loadChildren: () => import('./features/products/products.routes') },
      { path: 'notifications', loadComponent: () => import('./features/notifications/pages/notifications-page') },
      { path: '', pathMatch: 'full', redirectTo: 'products' },
    ],
  },
  { path: '**', loadComponent: () => import('./shell/not-found-page') },
];

// features/products/products.routes.ts
export default [
  { path: '', component: ProductSearchPage, title: 'Produits' },
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

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() || window.confirm('Quitter sans enregistrer ?');

export const productResolver: ResolveFn<ProductSchema> = (route) => {
  const router = inject(Router);
  return inject(ProductApi)
    .byId(route.paramMap.get('id') ?? '')
    .pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(new RedirectCommand(router.parseUrl('/not-found')))
          : throwError(() => error),
      ),
    );
};
```

`window.confirm` est une première étape ; la maquette prévoit un dialogue applicatif qui pourra le remplacer sans changer le contrat `HasUnsavedChanges`.

</details>

## 8. HTTP et interceptors

N'enregistrer que des interceptors répondant à un besoin établi, dans cet ordre :

1. **Authentification** : ajoute le jeton, uniquement vers l'origine de l'API.
2. **Session expirée** : sur un `401` alors qu'une session existe, ferme la session et renvoie vers `/login?returnUrl=…`, puis relance l'erreur.

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
    provideHttpClient(withInterceptors([authInterceptor, unauthorizedInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ],
};

// core/auth/auth.interceptors.ts
const apiOrigin = new URL(productApiEndpoint).origin;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token || new URL(req.url, location.origin).origin !== apiOrigin) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && auth.isAuthenticated()) {
        auth.logout();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
```

`AuthService` expose au minimum `isAuthenticated`, `token` et `user` sous forme de `computed()` sur un signal de session privé, ainsi que `login()` / `logout()`.

</details>

## 9. Notifications

Deux mécanismes distincts :

| | Notification persistante | Toast |
| --- | --- | --- |
| Usage | Historique consultable (écran 05), compteur du menu | Confirmation ou erreur immédiate, éphémère |
| Source | `NotificationStore` | Service de toast (à créer avec l'écran) |
| Accessibilité | Liste, niveau affiché en texte | `role="status"` / `role="alert"`, fermeture clavier |

L'état commence en mémoire. La persistance (serveur ou stockage local) s'ajoute derrière les mêmes méthodes du store, sans changer les écrans.

<details>
<summary>Exemple : modèle et <code>NotificationStore</code></summary>

```ts
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  readonly id: string;
  readonly level: NotificationLevel;
  readonly title: string;
  readonly message: string;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly action?: { readonly label: string; readonly link: string };
}

export type NewNotification = Pick<AppNotification, 'level' | 'title' | 'message' | 'action'>;

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly _items = signal<readonly AppNotification[]>([]);

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => n.readAt === null).length);

  add(notification: NewNotification): void {
    const created: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    this._items.update((items) => [created, ...items]);
  }

  markAsRead(id: string): void {
    const now = new Date().toISOString();
    this._items.update((items) =>
      items.map((n) => (n.id === id && n.readAt === null ? { ...n, readAt: now } : n)),
    );
  }

  markAllAsRead(): void {
    const now = new Date().toISOString();
    this._items.update((items) => items.map((n) => (n.readAt === null ? { ...n, readAt: now } : n)));
  }

  remove(id: string): void {
    this._items.update((items) => items.filter((n) => n.id !== id));
  }
}
```

Les filtres de l'écran (statut, niveau) sont des `computed()` dans la page à partir de `items()` et des paramètres d'URL ; le store n'a pas à les connaître.

</details>

## 10. Pipes, directives et composants partagés

- **Pipes** : transformation pure et synchrone réutilisée dans les templates. Utiliser d'abord `currency`, `date`, `number` (locale `fr-FR`). Jamais d'appel réseau ni de logique métier.
- **Directives** : comportement d'interface réutilisable sans template (ex. `appAutofocus` pour le focus initial de la connexion), avec `input()` et `host`.
- **Composants partagés** : API `input()` / `output()` stable, une responsabilité. Rester dans la feature tant qu'un seul domaine les utilise.
- **Images produit** : `NgOptimizedImage` (`ngSrc`, `width`, `height`) avec image de repli en cas d'erreur.

## 11. Tests

- Runner : Vitest via `ng test` (déjà configuré).
- HTTP : `provideHttpClient()` + `provideHttpClientTesting()`, puis `HttpTestingController`.
- Composants : `TestBed.createComponent`, `fixture.componentRef.setInput()` pour les entrées, `await fixture.whenStable()` (pas de zone : pas de `fakeAsync`).
- Priorités : validation des schémas (cas valides et invalides), règles de formulaire, guards et resolvers (redirections), états de chargement / vide / erreur des pages.

## 12. Mise en œuvre progressive

1. **Fondations** : déclarer `zod`, corriger le type de `id` et l'endpoint `https`, compléter le schéma de liste (`total`, `skip`, `limit`), activer `strict` et `strictTemplates`.
2. **Configuration** : `provideHttpClient`, `withComponentInputBinding`, locale `fr-FR`, route `**`.
3. **Produits en lecture** : `ProductApi`, page de recherche, resolver et page de détail, avec les états de chargement, vide et erreur.
4. **Produits en écriture** : page de modification en Signal Forms, `unsavedChangesGuard`.
5. **Authentification** : `AuthService`, page de connexion, `authGuard` / `guestGuard`, interceptors.
6. **Notifications** : `NotificationStore`, écran récapitulatif, badge du menu, toasts.

Chaque étape est livrée avec ses tests. Une abstraction commune n'est extraite qu'après un deuxième usage réel.
