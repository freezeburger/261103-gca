# Rapport 008 — Commande `dev` unique

## Tâche complétée

La tâche [008-dev-command](../tasks/008-dev-command.md) est terminée.

## Livrables

- `concurrently` (10.x) ajouté en dépendance de développement.
- Scripts npm :
  - `npm run dev` : `ng build gca`, puis en parallèle `api` (json-server :5050) et `ng serve` (HTTPS :4200 + proxy `/api`), sorties préfixées `[api]` / `[web]`, `--kill-others` : l'arrêt de l'un arrête l'autre ;
  - `npm run dev:reset` : idem avec `api:reset` (données de référence restaurées).
- Documentation : README (Development server) et [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) § 13 (démarrage, tableau des scripts).

## Vérification

- `npm run dev` : librairie construite, API puis application démarrées.
- Via `https://localhost:4200` (certificat de `certs/` comme autorité) : page d'accueil 200, `POST /api/auth/login` 200, `GET /api/products` 200 avec `X-Total-Count: 100` ; requêtes visibles dans la sortie `[api]`.
- Arrêt : plus aucun processus en écoute sur les ports 5050 et 4200.
