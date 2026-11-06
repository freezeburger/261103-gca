# Exercice — Naviguer dans un code généré

Cette application Angular 22 a été générée en grande partie par une IA, en une seule passe (tâche 007). Elle est volontairement **dense** : vous ne l'avez pas écrite, et rien ne vous oblige à tout comprendre d'un coup.

L'objectif n'est pas de tout lire. Il s'agit de **vous repérer à l'aide de vos acquis** (signaux, composants, routing, HTTP, formulaires…) pour comprendre, modifier, étendre puis **juger** ce code, comme le jour où vous héritez d'un projet existant.

Les exercices vont du plus guidé au plus ouvert :

1. [Carte des milestones](#1-carte-des-milestones) : retrouver chaque notion dans le code.
2. [Traces guidées](#2-traces-guidées) : suivre un comportement de bout en bout.
3. [Modifier](#3-modifier) : petits changements ciblés.
4. [Étendre](#4-étendre) : ajouter une fonctionnalité.
5. [Critiquer le code généré](#5-critiquer-le-code-généré) : faire une revue de code.

Les corrigés sont repliés sous chaque exercice (**▶ Corrigé**). Essayez avant de les ouvrir.

## 0. Mise en route

```bash
npm install
npm run dev        # API json-server (:5050) + application HTTPS (:4200)
```

- Ouvrir `https://localhost:4200` et accepter l'avertissement de certificat (certificat de développement auto-signé).
- Comptes : `marie.laurent@atelier.dev` et `paul.martin@atelier.dev`, mot de passe `Atelier2026!`.
- Tests : `npm test`. Données d'origine : `npm run dev:reset`.

**Ressources autorisées** : tout le dépôt, y compris [ARCHITECTURE.md](workflow/documentation/ARCHITECTURE.md), qui sert de **carte**. Ce document décrit des intentions : vérifiez toujours dans le code. Les DevTools du navigateur (onglets Réseau et Application) sont aussi vos alliés.

**Conseils de navigation**

- Partez d'un **comportement observable** (un clic, une URL) plutôt que d'un fichier au hasard.
- Utilisez « Aller à la définition » (F12) et « Rechercher toutes les références » (Maj+F12) de l'éditeur.
- Les fichiers `*.spec.ts` décrivent le comportement attendu en quelques lignes : c'est souvent la meilleure porte d'entrée.
- L'arborescence suit une convention : `core/` (transverse, sans écran), `features/` (domaines métier), `infra/` (technique), `shell/` (cadre de l'application), `projects/gca/` (librairie de composants).

---

## 1. Carte des milestones

Pour chaque notion, trouvez **au moins un endroit** où elle est utilisée, puis expliquez en une phrase **pourquoi** elle est utilisée à cet endroit.

| # | Notion | Fichier(s) | Symbole / ligne | Pourquoi ici ? |
| --- | --- | --- | --- | --- |
| 1 | `signal()` | | | |
| 2 | `computed()` | | | |
| 3 | `linkedSignal()` | | | |
| 4 | `input()` / `input.required()` | | | |
| 5 | `model()` et `output()` | | | |
| 6 | `rxResource()` | | | |
| 7 | Signal Forms (`form()`, `[formField]`, `[formRoot]`) | | | |
| 8 | Contrôle de flux `@if` / `@for` / `@let` | | | |
| 9 | Guard fonctionnel (`CanActivateFn`, `CanDeactivateFn`) | | | |
| 10 | Resolver et `RedirectCommand` | | | |
| 11 | Paramètres d'URL reçus en `input()` | | | |
| 12 | Chargement différé (`loadComponent`, `loadChildren`) | | | |
| 13 | Interceptor fonctionnel | | | |
| 14 | `HttpContextToken` | | | |
| 15 | `InjectionToken` avec `factory` | | | |
| 16 | Projection de contenu (`ng-content select`) | | | |
| 17 | `contentChild()` / `viewChild()` | | | |
| 18 | Classe abstraite et héritage de service | | | |
| 19 | Validation des données externes (Zod) | | | |
| 20 | Librairie Angular (ng-packagr) | | | |
| 21 | Test avec `HttpTestingController` | | | |

<details>
<summary>▶ Corrigé</summary>

D'autres emplacements peuvent être valables : l'important est la justification.

| # | Où | Pourquoi |
| --- | --- | --- |
| 1 | `features/auth/pages/login-page.ts` : `failure`, `model` | État local modifiable de la page (message d'erreur, modèle du formulaire). |
| 2 | `features/products/pages/product-search-page.ts` : `sort`, `sortKey` ; `core/notifications/notification-store.ts` : `unreadCount` | Valeurs **dérivées**, recalculées automatiquement, jamais écrites à la main. |
| 3 | `product-edit-page.ts` : `model` ; `notification-store.ts` : `_items` | État **modifiable** mais **réinitialisé** quand sa source change (produit résolu, réponse serveur). |
| 4 | `product-detail-page.ts` : `product = input.required<ProductSchema>()` | Données fournies par le resolver. Requises, car la page n'a pas de sens sans produit. |
| 5 | `projects/gca/src/lib/main-layout/main-layout.ts` : `collapsed = model(false)` ; `table/table.ts` : `sort = model(...)` (d'où `(sortChange)`) ; `paginator/paginator.ts` : `paginate = output<GcaPageEvent>()` | `model()` : double liaison (le composant et son parent peuvent changer la valeur ; Angular crée l'événement `xxxChange`). `output()` : simple événement vers le parent. |
| 6 | `product-search-page.ts` : `products` ; `notification-store.ts` : `remote` | Lecture distante qui **dépend de signaux** (paramètres d'URL, utilisateur) : requête relancée et précédente annulée à chaque changement. États `isLoading` / `error` / `hasValue` prêts pour le template. |
| 7 | `product-edit-page.ts` / `.html`, `login-page.ts` / `.html` | Modèle = signal ; règles déclarées en un seul endroit ; `submission.action` gère la soumission asynchrone et l'état `submitting()`. |
| 8 | `product-search-page.html` : `@let result = products.value()` | `@let` évite de répéter `products.value()` ; `@for` exige un `track` (identité de ligne). |
| 9 | `core/auth/auth-guards.ts`, `core/navigation/unsaved-changes-guard.ts` | Fonctions simples avec `inject()`. Refus par `UrlTree`, confirmation asynchrone par `Promise<boolean>`. |
| 10 | `features/products/product-resolver.ts` | La fiche ne peut pas s'afficher sans produit. Un 404 redirige vers `/not-found` sans afficher une page vide. |
| 11 | `config/app.config.ts` : `withComponentInputBinding()` + `product-search-page.ts` : `q`, `page`, `size`… | L'état de la recherche vit dans l'URL : il est partageable et restauré au retour arrière. |
| 12 | `app.routes.ts` | Chaque écran est un fichier JS séparé, chargé à la demande (voir les « Lazy chunk files » du build). |
| 13 | `core/http/api-url-interceptor.ts`, `core/auth/auth-interceptors.ts` | Comportements transverses (préfixe d'URL, jeton, 401) hors des services métier. |
| 14 | `infra/api/api-service.ts` : `API_REQUEST` | Marque les requêtes destinées au backend : seules celles-ci sont préfixées et reçoivent le jeton. |
| 15 | `api-url-interceptor.ts` : `API_BASE_URL` ; `auth-service.ts` : `SESSION_STORAGES` | Valeur remplaçable par environnement ou en test, avec une valeur par défaut. |
| 16 | `projects/gca/src/lib/field/field.html` : `[gcaSuffix]` ; `card/card.html` : `[gcaCardActions]` | Le parent place du contenu dans des emplacements nommés du composant. |
| 17 | `gca/.../main-layout.ts` : `contentChild(GcaSidebarFooter)` ; `login-page.ts` : `viewChild(GcaMessage)` | Accéder à un enfant projeté ou à un élément du template (ici : focus sur le message d'erreur). |
| 18 | `ProductApi`, `AuthApi`, `NotificationApi` `extends ApiService` | Code HTTP commun factorisé (URL, paramètres, validation) ; chaque domaine ne déclare que ses opérations. |
| 19 | `core/schemas/*.ts` | Toute donnée externe (réponse HTTP, `localStorage`) est vérifiée avant usage ; les types TypeScript en sont déduits. |
| 20 | `projects/gca`, `angular.json` > `gca`, `tsconfig.json` > `paths` | Composants réutilisables, construits à part (`ng build gca`) et importés via l'alias `gca`. |
| 21 | `infra/api/api-service.spec.ts`, `features/products/products.spec.ts` | On vérifie la requête émise (URL, verbe, paramètres) et on simule la réponse, sans serveur. |

</details>

---

## 2. Traces guidées

Pour chaque scénario, reconstituez la **chaîne d'appels** dans l'ordre et répondez aux questions. Vérifiez dans l'onglet Réseau des DevTools.

### T1 — « Enregistrer » une fiche produit

Depuis `/products?q=cream`, ouvrez un produit, cliquez sur **Modifier**, changez le titre, puis cliquez sur **Enregistrer**.

1. Quel code s'exécute au clic ? Où est-il déclaré ?
2. Par quels fichiers passe la requête avant de quitter le navigateur ? Quelle URL finale le navigateur appelle-t-il ?
3. Qui transforme `/api/products/28` en `/products/28` ? Côté client ou côté serveur ?
4. Pourquoi `PATCH` et pas `PUT` ?
5. Après la réponse, quatre choses se produisent. Lesquelles, et dans quel ordre ?
6. Pourquoi la boîte « Quitter sans enregistrer ? » n'apparaît-elle **pas** après l'enregistrement ?

<details>
<summary>▶ Corrigé</summary>

1. `[formRoot]="productForm"` (`product-edit-page.html`) intercepte la soumission et appelle `submission.action` déclarée dans `form(...)` (`product-edit-page.ts`).
2. `ProductApi.update()` → `ApiService.patch()` construit `products/28` et le marque `API_REQUEST` → `apiUrlInterceptor` le préfixe en `/api/products/28` → `authInterceptor` ajoute `Authorization: Bearer …` → `unauthorizedInterceptor` observe la réponse. Le navigateur appelle `https://localhost:4200/api/products/28`.
3. Le serveur de développement Angular, grâce à `proxy.conf.json` (`pathRewrite: ^/api → ""`), relaie vers `http://localhost:5050/products/28`. Le navigateur ne voit qu'une seule origine.
4. json-server remplace toute la ressource sur `PUT`, ce qui effacerait `category`, `brand` et `stock`, absents du formulaire. `PATCH` ne modifie que les champs envoyés.
5. `f().reset()` (le formulaire redevient « non modifié ») → toast `GcaToastService.success` → `NotificationStore.add()` (un `POST /api/notifications`) → navigation vers la fiche en conservant `?q=cream` (`queryParamsHandling: 'preserve'`).
6. `f().reset()` remet `dirty()` à `false` **avant** la navigation, et `hasUnsavedChanges()` exclut aussi l'état `submitting()`. `unsavedChangesGuard` laisse donc passer.

</details>

### T2 — Ouvrir `/products/12` sans être connecté

Dans une fenêtre privée, ouvrez directement `https://localhost:4200/products/12`.

1. Quel code empêche l'affichage, et que renvoie-t-il ?
2. D'où vient le paramètre `returnUrl` de l'URL de connexion ?
3. Pourquoi la requête `POST /api/auth/login` ne porte-t-elle pas d'en-tête `Authorization` ?
4. Où la session est-elle conservée ? Que change la case « Rester connecté » ?
5. Après connexion, comment arrive-t-on sur `/products/12` ? Que se passerait-il avec `returnUrl=//site-malveillant.com` ?

<details>
<summary>▶ Corrigé</summary>

1. `authGuard` (`core/auth/auth-guards.ts`), posé sur la route parente dans `app.routes.ts`. Il renvoie une `UrlTree` vers `/login`.
2. De `state.url`, l'URL demandée, passée en `queryParams` par `authGuard`. `LoginPage` la reçoit en `input()` grâce à `withComponentInputBinding()`.
3. `authInterceptor` n'ajoute le jeton que si une session existe. Avant la connexion, `token()` vaut `null`.
4. `AuthService.open()` l'écrit dans `sessionStorage` (fermée avec l'onglet), ou dans `localStorage` si « Rester connecté » est coché. Au démarrage, `restore()` la relit, la valide (`authSessionSchema`) et l'ignore si elle a expiré.
5. `safeReturnUrl()` renvoie `returnUrl`, puis `router.navigateByUrl()` y mène ; `productResolver` charge alors le produit. Une URL qui commence par `//` (ou qui ne commence pas par `/`) est refusée au profit de `/products` : cela évite une **redirection ouverte** vers un site externe.

</details>

### T3 — Le serveur redémarre pendant que vous travaillez

Connecté sur la recherche, arrêtez puis relancez `npm run dev`, puis changez de page de résultats.

1. Pourquoi le jeton, pourtant toujours présent dans le navigateur, est-il refusé ?
2. Quel code côté serveur renvoie le `401` ?
3. Quel code côté client réagit, et que fait-il exactement ?
4. Pourquoi ce même code ne réagit-il pas quand on se trompe de mot de passe ?
5. Que devient la liste des notifications, et pourquoi sans code dédié ?

<details>
<summary>▶ Corrigé</summary>

1. Les jetons sont gardés **en mémoire** dans `server/server.cjs` (`const sessions = new Map()`). Un redémarrage les efface.
2. Le middleware de contrôle d'accès, placé après `POST /auth/login` : `activeSession(token)` renvoie `null`, donc `401`.
3. `unauthorizedInterceptor` : réponse `401` + requête `API_REQUEST` + session présente → `auth.clear()` (vide la session locale sans appeler le serveur), puis navigation vers `/login?returnUrl=<url courante>`. L'erreur est relancée : la page la voit aussi.
4. Au moment de l'échec de connexion, il n'y a pas encore de session (`isAuthenticated()` vaut `false`). C'est la page de connexion qui affiche le message.
5. `NotificationStore.remote` a pour paramètre `auth.user()?.id`. Ce paramètre passe à `undefined`, la ressource ne charge plus rien, et `_items` (un `linkedSignal`) revient à `[]`. Toute la réaction découle des signaux.

</details>

### T4 — Le badge des notifications

Le menu latéral affiche un compteur sur « Notifications ». Marquez une notification comme lue.

1. Quelle chaîne de signaux relie la réponse serveur au chiffre affiché ?
2. Pourquoi le chiffre change-t-il **avant** la réponse du serveur ?
3. Que se passe-t-il si le serveur refuse la modification ?

<details>
<summary>▶ Corrigé</summary>

1. `remote` (`rxResource`) → `_items` (`linkedSignal`) → `unreadCount` (`computed`) → `nav` (`computed` dans `shell/app-layout.ts`, propriété `badge`) → `gca-main-layout` → `gca-badge`.
2. `markAsRead()` met d'abord à jour `_items` localement (**mise à jour optimiste**), puis envoie le `PATCH`.
3. `sync()` appelle `remote.reload()` en cas d'erreur : la liste est rechargée depuis le serveur, et l'état local erroné est remplacé.

</details>

---

## 3. Modifier

Pour chaque modification : repérez les fichiers concernés **avant** de coder, puis vérifiez avec `npm test` et dans le navigateur.

### M1 — Rendre le stock modifiable

Le stock s'affiche sur la fiche mais ne fait pas partie du formulaire de modification. Ajoutez un champ « Stock » : entier, obligatoire, supérieur ou égal à 0.

<details>
<summary>▶ Corrigé</summary>

1. `core/schemas/products.ts` : inclure le stock dans les champs modifiables.

   ```ts
   export const productChangesSchema = productSchema
     .pick({ title: true, description: true, price: true, thumbnail: true })
     .extend({ stock: z.number().int().min(0) });
   ```

2. `product-edit-page.ts` : alimenter le modèle (le stock est optionnel côté serveur) et ajouter les règles.

   ```ts
   protected readonly model = linkedSignal<ProductChanges>(() => {
     const { title, description, price, thumbnail, stock } = this.product();
     return { title, description, price, thumbnail, stock: stock ?? 0 };
   });
   // dans le schéma du formulaire :
   required(p.stock, { message: 'Le stock est obligatoire.' });
   min(p.stock, 0, { message: 'Le stock ne peut pas être négatif.' });
   ```

   Ajouter aussi `['Stock', f.stock().invalid()]` dans `invalidFields`.

3. `product-edit-page.html` :

   ```html
   <gca-field label="Stock">
     <input gcaInput type="number" step="1" [formField]="productForm.stock" />
   </gca-field>
   ```

Rien à changer côté API : `PATCH` envoie les champs du modèle, json-server les enregistre. Le message d'erreur s'affiche tout seul parce que `gca-field` lit l'état du contrôle projeté (`contentChild(GCA_FIELD_CONTROL)`).

`npm test` échoue ensuite dans `products.spec.ts` (« updates a product with PATCH ») : `ProductChanges` exige désormais `stock`. C'est voulu. Le typage strict signale tous les endroits touchés par un changement de schéma : ajouter `stock` à l'objet `changes` du test.

</details>

### M2 — 10 résultats par page par défaut

<details>
<summary>▶ Corrigé</summary>

`product-search-page.ts` : `const DEFAULT_SIZE = 10;`. La constante sert à la fois de valeur par défaut de l'`input()` `size` et de règle dans `changePage()`, qui retire `size` de l'URL quand il vaut la valeur par défaut. Une seule ligne suffit, d'où l'intérêt de la constante. Les options du paginateur (`[10, 20, 50]`) contiennent déjà 10.

</details>

### M3 — Renommer le niveau « AVERT. » en « ALERTE »

Que change ce renommage dans l'URL du filtre `?level=…` ? Pourquoi ?

<details>
<summary>▶ Corrigé</summary>

`notifications-page.ts`, constante `LEVELS` : `warning: { label: 'ALERTE', severity: 'warn' }`. L'URL ne change pas (`?level=warning`) : le libellé affiché et la valeur technique sont séparés. La valeur provient du serveur et du schéma (`notificationLevelSchema`), le libellé est une affaire de présentation.

</details>

---

## 4. Étendre

### E1 — Filtrer les produits par catégorie

Ajoutez une liste déroulante « Catégorie » dans la barre de recherche. Le filtre doit apparaître dans l'URL (`?category=beauty`), se combiner avec la recherche et le tri, et revenir à la page 1 quand il change.

Indice : json-server filtre sur n'importe quel champ (`/products?category=beauty`).

<details>
<summary>▶ Corrigé</summary>

1. `product-api.ts` : `readonly category?: string;` dans `ProductQuery`, puis `category` dans les paramètres envoyés par `search()`. Les valeurs vides sont déjà ignorées par `ApiService`.
2. `product-search-page.ts` :

   ```ts
   protected readonly categories = ['beauty', 'fragrances', 'furniture', 'groceries'] as const; // liste du jeu de données
   readonly category = input<string>();

   protected readonly products = rxResource({
     params: () => ({
       q: this.q(), page: this.page(), size: this.size(),
       sortBy: this.sortBy(), order: this.order(), category: this.category(),
     }),
     stream: ({ params }) => this.api.search(params),
   });

   protected changeCategory(event: Event): void {
     this.navigate({ category: (event.target as HTMLSelectElement).value || null, page: null });
   }
   ```

3. `product-search-page.html`, dans `.toolbar` :

   ```html
   <select gcaSelect aria-label="Catégorie" (change)="changeCategory($event)">
     <option value="">Toutes les catégories</option>
     @for (c of categories; track c) {
       <option [value]="c" [selected]="c === category()">{{ c }}</option>
     }
   </select>
   ```

4. Test dans `products.spec.ts` : vérifier que `category=beauty` figure dans `req.request.params`.

Pour aller plus loin : charger la liste des catégories depuis le serveur plutôt que de la coder en dur. Où placer cette lecture ? Faut-il un store ?

</details>

### E2 — « Tout marquer comme lu » depuis le menu utilisateur

Ajoutez une entrée « Tout marquer comme lu (n) » dans le menu de l'appbar, visible seulement s'il reste des notifications non lues.

<details>
<summary>▶ Corrigé</summary>

`shell/app-layout.ts` : `userMenu` est un tableau fixe. Il doit devenir un `computed()` qui dépend de `unreadCount()`.

```ts
protected readonly userMenu = computed<GcaMenuItem[]>(() => {
  const unread = this.notifications.unreadCount();
  return [
    ...(unread > 0
      ? [
          { label: `Tout marquer comme lu (${unread})`, icon: '✓', command: () => this.notifications.markAllAsRead() },
          { label: '', separator: true },
        ]
      : []),
    { label: 'Déconnexion', icon: '⎋', danger: true, command: () => this.logout() },
  ];
});
```

Dans le template : `[items]="userMenu()"`. Le point clé : une valeur qui dépend d'un signal doit elle-même être un signal pour se mettre à jour.

</details>

### E3 — Tester `unsavedChangesGuard`

Écrivez `core/navigation/unsaved-changes-guard.spec.ts` couvrant trois cas : rien à enregistrer (navigation autorisée), modifications et confirmation acceptée, modifications et confirmation refusée.

<details>
<summary>▶ Corrigé</summary>

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { GcaConfirmService } from 'gca';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes-guard';

describe('unsavedChangesGuard', () => {
  const confirm = vi.fn<(options: unknown) => Promise<boolean>>();

  function run(dirty: boolean) {
    const page: HasUnsavedChanges = { hasUnsavedChanges: () => dirty };
    return TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(page, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot),
    );
  }

  beforeEach(() => {
    confirm.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: GcaConfirmService, useValue: { confirm } }] });
  });

  it('allows leaving without changes and does not ask', () => {
    expect(run(false)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('follows the user answer when there are changes', async () => {
    confirm.mockResolvedValueOnce(true);
    expect(await run(true)).toBe(true);
    confirm.mockResolvedValueOnce(false);
    expect(await run(true)).toBe(false);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Quitter sans enregistrer ?' }));
  });
});
```

Un guard fonctionnel s'exécute dans un contexte d'injection, d'où `TestBed.runInInjectionContext`. Le service de confirmation est remplacé par un double de test.

</details>

---

## 5. Critiquer le code généré

Un code généré n'est pas une référence : il est **plausible**, pas forcément **juste** ni **adapté**. Pour chaque point ci-dessous, classez-le puis argumentez.

| Catégorie | Signification |
| --- | --- |
| ✅ Idiomatique | Pratique Angular standard, à reproduire. |
| 🤔 Discutable | Défendable, mais une alternative plus simple existe. |
| 🏋️ Sur-dimensionné | Correct, mais trop lourd pour le besoin. |
| ⚠️ Risque | Peut provoquer un bug, une faille ou une confusion. |

| # | Point à examiner | Où |
| --- | --- | --- |
| C1 | Marquer les requêtes backend avec un `HttpContextToken` | `infra/api/api-service.ts`, interceptors |
| C2 | Lire la valeur d'un `<select>` avec `(event.target as HTMLSelectElement).value` | `product-search-page.ts`, `notifications-page.ts` |
| C3 | Mise à jour optimiste puis `reload()` complet en cas d'erreur | `notification-store.ts` |
| C4 | Hachage `scrypt`, jeton de 256 bits, cloisonnement par utilisateur dans un serveur de démo | `server/server.cjs` |
| C5 | Alias `gca` qui pointe vers `dist/gca` (construction préalable obligatoire) | `tsconfig.json`, `package.json` |
| C6 | Suppression différée validée dans `ngOnDestroy` | `notifications-page.ts` |
| C7 | `markAllAsRead()` envoie une requête `PATCH` par notification | `notification-store.ts` |
| C8 | Mot de passe des comptes de démonstration écrit dans le README | `README.md` |
| C9 | Pages exportées par défaut (`export default class`) | `features/**/pages/*.ts` |
| C10 | Libellés français écrits en dur dans les templates | partout |

<details>
<summary>▶ Corrigé (avis argumenté, d'autres positions sont défendables)</summary>

- **C1 — 🤔 Discutable.** C'est précis et explicite : aucune requête tierce ne reçoit le jeton par erreur. Un simple test « l'URL est-elle relative ? » suffirait pourtant dans ce projet, et serait plus lisible pour un débutant. Le jeton de contexte devient vraiment utile quand plusieurs backends coexistent.
- **C2 — 🤔 Discutable.** C'est un cast non vérifié, accepté ici parce que l'élément est connu. Alternatives : une variable de template (`#sel` puis `sel.value`), ou lier le `<select>` à un champ de Signal Forms.
- **C3 — ✅ / 🤔.** L'interface reste réactive. Le rechargement complet est simple et sûr, mais l'utilisateur ne sait pas que son action a échoué : il manque un toast d'erreur.
- **C4 — 🏋️ Sur-dimensionné** pour un atelier Angular : ce n'est pas le sujet, et `server.cjs` en devient plus long. Ces choix restent de bonnes pratiques si le serveur doit servir de modèle.
- **C5 — ⚠️ Risque** en salle : oublier `ng build gca` provoque une erreur d'import peu parlante. Les scripts `dev`, `start`, `build` et `test` compensent en construisant la librairie avant. Pointer l'alias vers les sources (`projects/gca/src/public-api.ts`) serait plus simple en développement.
- **C6 — ⚠️ Risque.** C'est cohérent (l'utilisateur a demandé la suppression), mais c'est un effet de bord surprenant dans `ngOnDestroy`. Si l'onglet est fermé, la suppression est perdue. Alternative : supprimer côté serveur tout de suite, et recréer la notification si l'utilisateur clique sur « Annuler ».
- **C7 — 🏋️ / ⚠️.** json-server ne propose pas de mise à jour groupée, d'où N requêtes. Avec beaucoup de notifications, cela devient coûteux. Un vrai backend exposerait une route dédiée.
- **C8 — ⚠️ Risque** si le modèle est recopié en production. Acceptable pour des comptes de démonstration explicitement locaux.
- **C9 — ✅ Idiomatique** depuis que `loadComponent: () => import('…')` accepte l'export par défaut. Les routes du domaine produits importent pourtant les pages directement : la convention n'est utile que pour le chargement différé.
- **C10 — 🤔 Discutable.** C'est suffisant pour un atelier francophone. Une application réelle prévoirait l'internationalisation (`@angular/localize` / i18n) dès le départ.

</details>

---

## 6. Pour aller plus loin

- Remplacer le `<select>` de tri par un contrôle Signal Forms et comparer la lisibilité.
- Afficher un toast d'erreur quand une écriture de notification échoue (C3).
- Charger la liste des catégories depuis le serveur (E1) et décider où ranger cette lecture.
- Ajouter un test de composant pour la page de recherche : état de chargement, état vide, état d'erreur.
- Rédiger, à la manière d'une revue de code, trois remarques sur un fichier de votre choix, et les soumettre à la discussion du groupe.
