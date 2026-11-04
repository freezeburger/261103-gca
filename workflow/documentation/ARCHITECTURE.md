# Architecture applicative

## 1. Objet et périmètre

Ce document décrit une cible d'architecture pour l'application Angular et des conventions de mise en œuvre. Il s'agit de propositions, pas d'un inventaire de fonctionnalités déjà réalisées.

Le projet est actuellement un squelette Angular standalone : `src/main.ts` démarre `App` avec `bootstrapApplication`, `src/app/config/app.config.ts` fournit le routeur et `src/app/app.routes.ts` ne définit encore aucune route. Les dossiers `core`, `pages`, `components`, `directives`, `pipes` et `infra` sont présents mais ne contiennent pas encore de code applicatif, à l'exception du schéma produit dans `core/schemas`. Les exemples ci-dessous sont donc des contrats et des conventions à appliquer au fil des fonctionnalités, et non des fichiers supposés déjà exister.

## 2. Organisation proposée

Conserver le point d'entrée et les répertoires déjà créés. Organiser le code de chaque domaine sous `features/` plutôt que de concentrer les pages et services métier dans des dossiers globaux :

```text
src/
  app/
    app.routes.ts
    config/
      app.config.ts
    shell/
      app.ts
      app.html
    core/                         # services et mécanismes singleton de l'application
      auth/
      guards/
      interceptors/
      notifications/
      resolvers/
      schemas/
    features/
      products/
        data-access/               # API, modèles et état du domaine
        pages/                     # pages routées
        ui/                        # composants propres au domaine
        products.routes.ts
      auth/
        pages/
        data-access/
    components/                    # composants génériques réellement partagés
    directives/
    pipes/
    infra/                         # adaptateurs techniques si plusieurs sont nécessaires
  styles.scss
```

Cette arborescence est évolutive : ne créer un sous-dossier ou une abstraction que lorsqu'un usage concret le justifie. Un composant exclusivement lié aux produits reste dans `features/products/ui`; il ne devient partagé qu'après identification d'un besoin commun. `core` est réservé aux services à instance applicative et aux fonctions transverses, pas aux composants visuels génériques.

## 3. Conventions de développement

- Utiliser les composants standalone et l'injection par `inject()` lorsque cela rend les dépendances claires; conserver les providers au niveau application, route ou composant selon leur portée nécessaire.
- Garder les composants de page responsables de l'orchestration et les composants d'interface spécialisés, réutilisables et simples. Préférer des composants petits à un composant générique sur-paramétré.
- Utiliser les signaux pour l'état synchrone local et les états de vue dérivés; utiliser RxJS pour composer les flux asynchrones (HTTP, événements, annulation et changements rapides de critères).
- Déclarer explicitement les types des entrées/sorties, préférer `readonly` pour les collections exposées, et éviter `any`, les casts non vérifiés et les conversions silencieuses.
- Utiliser des noms explicites et cohérents : composants `product-list`, services `ProductService`, pipes `currencyLabel`, directives `appAutofocus`. Une classe abstraite porte un nom métier clair, par exemple `ApiResource`.
- Centraliser les routes, les paramètres d'URL et les clés de `Route.data` au lieu de répéter des chaînes magiques.
- Présenter les états de chargement, vide et erreur dans l'interface. Ne pas transformer une erreur réseau en réponse de succès vide; convertir les erreurs à une frontière explicite et conserver une information exploitable pour l'utilisateur ou les journaux.
- Tester le comportement métier et les composants via le runner déjà configuré par Angular CLI/Vitest. Les tests de transformation et de validation doivent couvrir au minimum les cas valides et invalides.
- Activer progressivement les options TypeScript et Angular de mode strict lorsque les sources le permettent. Le `tsconfig.json` actuel n'active pas tous les modes stricts; éviter de supposer qu'ils sont déjà imposés.

Le schéma `core/schemas/products.ts` valide les données au moyen de Zod, tandis que le manifeste `package.json` ne déclare pas directement `zod`. Avant de s'appuyer sur cette validation à l'exécution, vérifier la résolution réelle de cette dépendance et la déclarer explicitement dans le manifeste si elle est requise.

## 4. Abstractions partagées

### Pipes

Créer un pipe lorsque la transformation est pure, synchrone, réutilisée dans des templates et ne modifie pas les données : libellés, présentation d'une valeur ou format métier simple. Utiliser les pipes Angular intégrés pour les formats standards (date, devise, nombres). Ne pas cacher un appel réseau, un accès au service ou une logique métier complexe dans un pipe.

### Directives

Créer une directive attributaire pour un comportement d'interface réutilisable qui ne justifie pas un composant (par exemple, gérer le focus initial d'un contrôle). Les fonctionnalités interactives doivent rester accessibles au clavier et exposer leurs entrées de manière typée. Réserver les directives structurelles à un besoin réellement différent des blocs conditionnels et boucles Angular intégrés.

### Composants communs et utilitaires

Un composant partagé doit avoir une responsabilité et une API d'entrées/sorties stables; le conserver dans le domaine tant qu'aucun autre domaine ne le réutilise. Placer les fonctions pures indépendantes d'Angular près du domaine ou dans un module utilitaire ciblé. Éviter les « helpers » globaux fourre-tout.

## 5. Consommation d'API

Fournir `HttpClient` dans la configuration de l'application (`provideHttpClient`) et isoler les URL, paramètres, sérialisation et validation à la frontière du domaine. Les composants ne construisent pas directement des requêtes HTTP.

Une classe abstraite peut mutualiser les opérations CRUD réellement identiques sans imposer un format de réponse API commun qui n'existe pas. Exemple de contrat indicatif :

```ts
abstract class ApiResource<T, CreateDto, UpdateDto> {
  protected abstract readonly endpoint: string;
  protected abstract decodeList(body: unknown): readonly T[];
  protected abstract decodeItem(body: unknown): T;

  protected constructor(protected readonly http: HttpClient) {}

  list(): Observable<readonly T[]> {
    return this.http.get<unknown>(this.endpoint).pipe(
      map((body) => this.decodeList(body)),
    );
  }

  get(id: string): Observable<T> {
    return this.http.get<unknown>(`${this.endpoint}/${encodeURIComponent(id)}`).pipe(
      map((body) => this.decodeItem(body)),
    );
  }

  create(value: CreateDto): Observable<T> {
    return this.http.post<unknown>(this.endpoint, value).pipe(
      map((body) => this.decodeItem(body)),
    );
  }

  update(id: string, value: UpdateDto): Observable<T> {
    return this.http.patch<unknown>(
      `${this.endpoint}/${encodeURIComponent(id)}`,
      value,
    ).pipe(map((body) => this.decodeItem(body)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`);
  }
}
```

Chaque service concret fournit son URL et ses décodeurs, en validant les réponses avec le schéma runtime du domaine lorsqu'il existe. Les méthodes exposent des `Observable` froids : une requête n'est exécutée qu'à la souscription et une erreur reste une erreur RxJS. Adapter les opérations (`patch` ou `put`, pagination, enveloppe de liste, etc.) au contrat réel du serveur; ne pas adopter cette classe si les ressources ont des comportements trop différents. L'endpoint DummyJSON et le schéma produit existants illustrent déjà le besoin d'extraire une liste `products` de sa réponse enveloppe.

## 6. Services réactifs : état découvert et résultat d'opération

Séparer explicitement :

1. **L'état découvert**, conservé par le service et observable par plusieurs consommateurs (données courantes, chargement, erreur). Il est exposé en lecture seule, idéalement sous forme de signaux.
2. **Le résultat d'une opération**, remis à l'appelant par la méthode qui la déclenche, sous forme d'`Observable` ou de `Promise` typé. L'appelant peut alors composer la réponse, naviguer ou gérer un effet ponctuel sans devoir relire l'état partagé.

Exemple de forme, à compléter avec les types du domaine :

```ts
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ProductApi);

  private readonly _products = signal<readonly Product[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  search(criteria: ProductCriteria): Observable<readonly Product[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.api.search(criteria).pipe(
      tap((products) => this._products.set(products)),
      catchError((error: unknown) => {
        this._error.set(toUserMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false)),
    );
  }
}
```

`search()` ne souscrit pas elle-même : la page ou le consommateur contrôle la souscription et reçoit les résultats directement, tandis que `products`, `loading` et `error` décrivent l'état partagé. Une méthode appelée sans souscription n'effectue donc pas de requête. Choisir une seule stratégie de souscription par flux (template `async`/liaison réactive ou souscription gérée avec `takeUntilDestroyed`) et éviter les souscriptions imbriquées. Si plusieurs requêtes concurrentes peuvent modifier le même état, définir explicitement leur politique d'annulation et d'ordre (par exemple `switchMap` pour une recherche pilotée par les critères).

L'exemple suppose l'existence de `Product`, `ProductCriteria`, `ProductApi` et `toUserMessage`, qui doivent être définis avec les types et règles du projet avant de copier ce code. Ne pas stocker un message utilisateur à la place du détail technique nécessaire au diagnostic; les deux préoccupations peuvent être représentées séparément.

## 7. Notifications

Distinguer les **notifications persistantes** de l'application (centre et historique, éventuellement fournies par le serveur) des **messages temporaires** de confirmation ou d'erreur (toast). Une notification persistante peut suivre ce contrat :

```ts
type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

interface AppNotification {
  readonly id: string;
  readonly level: NotificationLevel;
  readonly title: string;
  readonly message: string;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly action?: {
    readonly label: string;
    readonly routerLink: string;
  };
}
```

Le service de notifications expose la collection et le compteur non lus en lecture seule; ses opérations typées permettent d'ajouter, marquer comme lue ou supprimer une notification. Le composant de toast gère durée, fermeture accessible et annonce aux technologies d'assistance; il ne constitue pas l'historique persistant. Ne pas diffuser automatiquement chaque erreur interceptée sous forme de toast : les erreurs attendues (validation, absence de résultat, accès refusé) sont traitées par le flux ou la page qui sait les contextualiser. Les événements affichés dans les maquettes existantes sont illustratifs, pas un contrat de données.

## 8. Routing, guards et resolvers

### Flux cible

1. `app.routes.ts` définit le shell, les routes racines et les pages de repli (`not-found` et erreur si nécessaire).
2. Les fonctionnalités sont chargées à la demande avec `loadChildren` pour un ensemble de routes de domaine, ou `loadComponent` pour une page isolée.
3. La navigation passe par un guard fonctionnel si elle dépend d'un état d'authentification ou d'autorisation client; un refus retourne une `UrlTree` vers la destination appropriée plutôt que de déclencher une navigation impérative dans le guard.
4. Un resolver ne précharge que les données indispensables à l'affichage initial d'une route et renvoie une erreur explicite ou une redirection décidée par la route en cas d'échec.
5. Le composant de page consomme les données résolues et orchestre les interactions suivantes avec les services du domaine.

### Règles d'emploi

- Utiliser des guards fonctionnels (`CanActivateFn`, `CanMatchFn`) et réserver chaque guard à une vraie règle de navigation. Un guard côté client améliore le parcours, mais ne sécurise jamais une API : les permissions doivent être vérifiées côté serveur.
- Préférer `CanMatch` pour exclure une configuration de route ou sélectionner une branche; employer `CanActivate` pour décider de l'accès à une route déjà reconnue.
- Utiliser un resolver lorsque la route ne peut raisonnablement pas s'afficher sans les données. Ne pas bloquer la navigation pour des données secondaires ou rafraîchissables en arrière-plan.
- Conserver filtres, pagination et identifiants partageables dans les paramètres URL appropriés. Valider les paramètres de route et gérer explicitement les identifiants inconnus.
- Fournir `withComponentInputBinding()` uniquement si les pages l'utilisent pour recevoir les paramètres ou données de route via des entrées.
- Couvrir les routes inconnues et éviter les redirections circulaires entre guard, resolver et route de connexion.

## 9. Interceptors HTTP

Enregistrer des interceptors **fonctionnels** dans `app.config.ts` avec `provideHttpClient(withInterceptors([...]))`. N'ajouter que ceux correspondant à des besoins établis, dans un ordre documenté :

1. **Authentification** : joindre un jeton uniquement aux appels de confiance concernés; ne jamais envoyer des identifiants à une origine arbitraire.
2. **Corrélation / diagnostic** : ajouter un identifiant de requête si l'infrastructure le prend en charge; exclure les données sensibles des journaux.
3. **Erreurs HTTP transversales** : journaliser de manière sûre ou convertir les réponses en erreur applicative typée, puis relancer l'erreur. L'interceptor ne doit pas masquer les erreurs ni inventer une réponse de succès.
4. **Indicateur global de chargement**, seulement si l'application en a réellement besoin : ignorer explicitement les requêtes non bloquantes et éviter les compteurs déséquilibrés avec `finalize`.

Les retries sont réservés aux opérations idempotentes et aux erreurs transitoires, avec une limite et une temporisation bornées. Ne pas rejouer automatiquement une mutation sans garantie d'idempotence. Les erreurs qui nécessitent un contexte métier restent gérées par la fonctionnalité.

## 10. Mise en œuvre progressive

1. Formaliser les modèles et valider à l'exécution les réponses externes, en alignant d'abord les dépendances du schéma produit.
2. Implémenter l'accès HTTP et le service réactif du premier domaine (produits), puis couvrir chargement, succès, liste vide et erreur.
3. Ajouter les routes de fonctionnalités, puis les guards et resolvers uniquement au besoin d'une route concrète.
4. Ajouter le modèle de notifications et les interceptors lorsque leurs cas d'usage et règles de sécurité sont confirmés.
5. Faire évoluer les conventions communes après plusieurs usages réels et tests, sans créer préventivement une bibliothèque d'abstractions.
