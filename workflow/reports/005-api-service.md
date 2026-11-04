# Rapport 005 — Spécification de la classe abstraite `ApiService`

## Tâche complétée

La tâche [005-api-service](../tasks/005-api-service.md) est terminée.

## Livrable

- [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) — accès HTTP réorienté sur `HttpClient` via une classe abstraite `ApiService`.

Principaux changements :

- **Décisions clés** : nouvelle ligne « Accès HTTP » (`ApiService` + un service par domaine) ; lecture via `rxResource()` sur une méthode `Observable` du service d'API ; écriture depuis l'action de soumission.
- **§ 3 Organisation** : `infra/api/api-service.ts` ajouté ; `infra/` défini comme dossier des adaptateurs techniques.
- **§ 5.1** : spécification d'`ApiService` (`inject(HttpClient)`, `baseUrl` abstrait, helpers protégés `get` / `post` / `put` / `patch` / `delete`, segments encodés, paramètres vides ignorés, validation par schéma compatible Zod, Observables froids, erreurs propagées) et de `ProductApi extends ApiService`, avec règles d'usage. Exemples en `<details>`.
- **§ 5.2** : page de recherche consommant `ProductApi.search()` via `rxResource({ params, stream })`, mêmes états chargement / vide / erreur.
- **§ 4, § 11, § 12** : tableau signaux / RxJS, stratégie de test d'`ApiService` et plan de mise en œuvre alignés.
- Plus aucune mention de `httpResource`. Les exemples des § 6 et § 7 (`update`, `byId`) restent compatibles sans modification.
- La retouche de mise en forme de l'en-tête apportée manuellement au document est conservée.

Les fichiers d'implémentation créés par erreur avant recadrage du périmètre (`infra/api`, `features/products`, modification d'`app.config.ts`) ont été supprimés ou restaurés : aucun code applicatif n'est modifié.

## Vérification

- Les trois extraits des § 5.1 et 5.2 ont été extraits automatiquement du document vers des fichiers temporaires, puis compilés avec `ngc` en mode `strict` + `strictTemplates` sans erreur.
- Tests Vitest temporaires (6/6 réussis) : URL et encodage des segments, paramètres vides ignorés, URL de base pour un chemin vide, caractère froid de l'Observable, verbes et corps (`POST`, `PATCH`, `PUT`, `DELETE` → `void`), rejet d'une réponse invalide, propagation d'une `HttpErrorResponse`, paramètres `skip` / `limit` de `ProductApi.search`, page de recherche avec `rxResource` réagissant au changement de paramètre d'URL et état vide.
- Fichiers temporaires supprimés ; `npm run build` réussit.
- Constat hors périmètre : le test existant `App > should render title` échoue déjà sur la référence (template racine vide).
