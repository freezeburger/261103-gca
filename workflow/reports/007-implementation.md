# Rapport 007 — Implémentation de l'application

## Tâche complétée

La tâche [007-implementation](../tasks/007-implementation.md) est terminée.

Préalable : la tâche 006 (librairie `gca`), restée sans rapport ni commit, a été vérifiée puis clôturée ([rapport 006](006-gca-library.md)) avant le démarrage, l'application en dépendant.

## Livrables

**Documentation** — [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) : décisions clés (backend, proxification, authentification, interface `gca`, HTTPS), état actuel et limites, arborescence réelle, `ApiService` (chemins relatifs, `API_REQUEST`, `getPage`), `ProductApi` json-server, routes / guards / resolver, trois interceptors, `NotificationStore` persistant, tests, plan réalisé et nouveau § 13 « Environnement de développement ». Le README racine décrit le démarrage. La mise à jour a été rédigée après l'implémentation pour refléter le code réel.

**Serveur de données** — `server/server.cjs` : json-server **0.17.4** en module Express sur le port **5050**.
- Middlewares d'authentification : `POST /auth/login` (mot de passe `scrypt`, comparaison à temps constant, jeton aléatoire 256 bits valable 8 h), `GET /auth/me`, `POST /auth/logout` ; `401` sans jeton valide sur toute autre route ; `/users` et `/db` non exposés.
- Notifications cloisonnées par utilisateur (filtrage, `404` sur la notification d'autrui, champs imposés à la création, `userId` masqué).
- `db.seed.json` versionné (100 produits DummyJSON, 2 comptes de démonstration, 5 notifications) ; `db.json` de travail ignoré par Git ; `npm run api` / `npm run api:reset`.

**Proxification et jeton** — `ApiService` ne produit que des chemins relatifs marqués `API_REQUEST` ; `apiUrlInterceptor` les préfixe par `API_BASE_URL` (`/api`) ; `proxy.conf.json` relaie `/api` vers `http://localhost:5050` (préfixe retiré). `authInterceptor` injecte le jeton uniquement sur ces requêtes ; `unauthorizedInterceptor` ferme la session et renvoie vers `/login?returnUrl=…` sur `401`.

**HTTPS de développement** — certificat auto-signé `localhost` (SAN `localhost`, `*.localhost`, `127.0.0.1`, RSA 2048, 1 an) généré sur selfsignedcert.com (*Self-signed TLS*), enregistré dans `certs/` (non versionné), déclaré dans `angular.json` (`ssl`, `sslCert`, `sslKey`) ; procédure dans `certs/README.md`.

**Application** (`src/app`, composants `gca`) :
- `core/auth` : `AuthApi`, `AuthService` (session en signaux, `sessionStorage` ou `localStorage` selon « Rester connecté », relecture validée par Zod), `authGuard` / `guestGuard`, interceptors ;
- `core/notifications` : `NotificationApi`, `NotificationStore` (chargement lié à la session, écritures optimistes, resynchronisation sur erreur) ;
- `core/navigation` : `unsavedChangesGuard` via `GcaConfirmService` ;
- `core/schemas` : produits (`id` numérique, champs éditables), authentification, notifications ;
- `features` : connexion, recherche (recherche à la frappe, tri, pagination, squelettes, vide / erreur), détail, modification (Signal Forms), notifications (filtres, groupes par jour, suppression annulable) ;
- `shell` : racine (`gca-toast`, `gca-confirm-dialog`), `AppLayout` (`gca-main-layout`, menu utilisateur, badge des non lues), page introuvable ;
- fondations : `zod` et `json-server` déclarés, `strict` + `strictTemplates`, locale `fr-FR` / `EUR`, `lang="fr"`, thème `gca` dans `angular.json`, scripts npm (`build:gca` exécuté avant `start`, `build`, `test`).

## Vérification

- `npm test` : 6 fichiers, **35 tests** réussis (ApiService, interceptors, AuthService et guards, NotificationStore, ProductApi et resolver, racine). Le test `App > should render title`, en échec depuis l'origine, est remplacé.
- `npm run test:gca` : 17 tests réussis. `npm run build` : réussi, bundle initial 480 kB (sous le budget de 500 kB après passage à `import * as z from 'zod'`, qui évite d'embarquer les 283 kB de locales Zod).
- Serveur, test de fumée HTTP : 401 sans jeton, mauvais mot de passe refusé, connexion, `/auth/me`, recherche paginée avec `X-Total-Count`, `/users` masqué, notifications filtrées et isolées, création forcée sur l'utilisateur, `PATCH` produit, déconnexion puis 401.
- HTTPS : `ng serve` répond sur `https://localhost:4200` avec le certificat généré (validé par Node avec ce certificat comme autorité) ; `/api/*` est relayé vers json-server (401 sans jeton, connexion et liste via le proxy).
- Parcours navigateur (second `ng serve` en HTTP sur le même proxy, le navigateur intégré refusant un certificat non approuvé) : redirection vers la connexion avec `returnUrl`, échec puis succès de connexion, recherche et formats `fr-FR`, modification avec confirmation de sortie, enregistrement persistant, toast et notification créée, filtres et lecture persistés, suppression annulée, session invalidée au redémarrage du serveur → retour à la connexion, « Rester connecté » en `localStorage`, isolation des notifications par utilisateur, produit inexistant → page introuvable, déconnexion.
- Anomalies corrigées pendant la vérification : paramètres de recherche perdus après enregistrement ; accents des notifications de référence altérés lors de leur génération.

## Points d'attention

- Le navigateur affiche un avertissement de sécurité tant que `certs/localhost.crt` n'est pas importé dans les autorités de confiance de l'utilisateur (étape optionnelle, non effectuée).
- Les sessions json-server sont en mémoire : tout redémarrage de l'API impose une reconnexion.
- `packages/` et `workflow/prompts/` (non suivis, hors tâche) ne sont pas inclus dans le commit.
