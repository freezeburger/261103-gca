# Tache 005 — Spécification de la classe abstraite `ApiService`

**Statut : completed**

Prompt d'origine : [005-API_SERVICE.md](../prompts/005-API_SERVICE.md). Périmètre : documentation uniquement ([ARCHITECTURE.md](../documentation/ARCHITECTURE.md)) ; aucun fichier applicatif n'est créé ni modifié.

1. **Spécifier `ApiService`** (emplacement cible `src/app/infra/api/api-service.ts`) : classe abstraite encapsulant `HttpClient`.
   - `protected readonly http = inject(HttpClient)` ; aucune dépendance par constructeur.
   - `protected abstract readonly baseUrl: string` défini par chaque service concret.
   - Helpers protégés `get`, `post`, `put`, `patch`, `delete` : chemin en segments encodés, paramètres de requête optionnels (valeurs vides ignorées), schéma de réponse (compatible Zod) ; retour `Observable<T>` validé, `Observable<void>` pour `delete`.
   - Observables froids, erreurs HTTP et de validation propagées ; ni souscription, ni retry, ni état interne.
2. **Spécifier `ProductApi extends ApiService`** : `search(query)`, `byId(id)`, `update(id, changes)`, chacune réduite à un appel de helper.
3. **Mettre à jour `ARCHITECTURE.md`** :
   - décision clé « Lecture et écriture via des services héritant d'`ApiService` (HttpClient) » à la place de `httpResource` ;
   - § 5.1 décrivant `ApiService` et `ProductApi`, exemples en `<details>` ;
   - § 5.2 : page de recherche consommant `ProductApi.search()` via `rxResource({ params, stream })`, avec les mêmes états chargement / vide / erreur ;
   - configuration `provideHttpClient(withInterceptors([...]))` et retrait de toute mention de `httpResource` (tableaux, conventions, plan de mise en œuvre) ;
   - § 11 : stratégie de test d'`ApiService` (`HttpTestingController`).
4. **Vérifier** les extraits : compilation stricte (`strict` + `strictTemplates`) et tests Vitest dans des fichiers temporaires, supprimés ensuite ; `npm run build` réussi.
5. **Rédiger le rapport 005** dans `workflow/reports` référençant cette tâche, puis créer un commit multiligne normalisé incluant document, tâche et rapport.

## Hors périmètre

- Implémentation de `ApiService`, `ProductApi` et de la configuration HTTP (tâche ultérieure).
- Correction du schéma produit (`id` numérique, champs de pagination, `https`) : déjà signalée dans `ARCHITECTURE.md`.
