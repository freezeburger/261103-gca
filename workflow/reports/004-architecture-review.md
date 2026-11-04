# Rapport 004 — Revue du socle d'architecture

## Tâche complétée

La tâche [004-architecture-review](../tasks/004-architecture-review.md) est terminée.

## Livrable

- [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) — document réécrit pour Angular 22.2.

Principaux changements :

- **Lisibilité** : synthèse des décisions en tête, sommaire, sections courtes, tableaux de choix (signaux / RxJS, patterns de données, routes, notifications) et exemples repliés dans des balises `<details>`.
- **Syntaxe Angular 22** : `inject()`, `input()` / `output()` / `model()`, `host`, `@if` / `@for`, `OnPush` et standalone implicites, application sans zone.js, `httpResource`, `linkedSignal`, Signal Forms (`form`, `[formField]`, `[formRoot]`, option `submission`), guards et resolvers fonctionnels avec `RedirectCommand`, `withComponentInputBinding()`, `withInterceptors()` sans `withFetch()` (déprécié).
- **Approche pragmatique** : suppression de la classe CRUD générique et du service réactif imbriqué au profit de trois patterns (API de domaine, `httpResource` dans la page, store à signaux pour l'état réellement partagé), chacun relié aux écrans maquettés.
- **Points d'attention** identifiés dans le code existant : `zod` non déclaré dans `package.json`, `id: z.string()` incompatible avec les identifiants numériques de DummyJSON, champs de pagination absents du schéma de liste, endpoint en `http://`, modes `strict` et `strictTemplates` désactivés.
- **Mise en œuvre** : plan en six étapes, de la correction des fondations aux notifications.

## Vérification

- Stabilité des API vérifiée dans les typings installés : `httpResource`, `resource`, `rxResource`, `form`, `submit` et `FormRoot` sont publics depuis Angular 22.0 ; `debounced()` est expérimental et n'est pas recommandé ; `OnPush` est la stratégie par défaut.
- Tous les extraits TypeScript du document ont été placés dans des fichiers temporaires et compilés avec `ngc` en mode `strict` + `strictTemplates`, sans erreur. Un fichier volontairement erroné a confirmé que les templates étaient bien contrôlés.
- Tests Vitest temporaires (5/5 réussis) : formulaire Signal Forms alimenté par `input.required` et `linkedSignal`, soumission via `[formRoot]` avec notification et remise à zéro de `dirty`, `httpResource` piloté par les paramètres d'URL, redirection du resolver sur 404, rejet par le schéma actuel d'un `id` numérique.
- Fichiers temporaires supprimés ; `npm run build` réussit. L'avertissement préexistant `RouterOutlet` inutilisé dans le composant racine subsiste.
- Aucun code applicatif n'a été modifié.
