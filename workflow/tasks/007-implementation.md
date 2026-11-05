# Tache 007 — Implémentation de l'application

**Statut : completed**

Prompt d'origine : [007.md](../prompts/007.md). Périmètre : application `src/app`, serveur de données `server/`, configuration de développement (proxy, HTTPS), [ARCHITECTURE.md](../documentation/ARCHITECTURE.md). La librairie `gca` (tâche 006) est utilisée telle quelle.

## Décisions

| Sujet | Décision |
| --- | --- |
| Persistance | `json-server` **0.17.4** utilisé comme module Express (`server/server.cjs`), port **5050**. Données de référence versionnées dans `server/db.seed.json` ; base de travail `server/db.json` créée au démarrage depuis la référence et ignorée par Git. |
| Authentification serveur | Middlewares Express avant le routeur json-server : `POST /auth/login` (mot de passe haché `scrypt`), `GET /auth/me`, `POST /auth/logout` ; jeton aléatoire opaque en mémoire avec expiration ; `401` sans jeton valide sur toute autre route ; `/users` et `/db` non exposés ; notifications cloisonnées par utilisateur. |
| Proxification | L'application n'adresse que des chemins relatifs (`products/12`). Un interceptor `apiUrlInterceptor` les préfixe par `API_BASE_URL` (`/api`) ; le serveur de développement Angular relaie `/api` vers `http://localhost:5050` (`proxy.conf.json`, préfixe retiré). Aucun CORS, aucune URL de backend dans le code. |
| Jeton | `authInterceptor` ajoute `Authorization: Bearer …` uniquement aux requêtes `/api` ; `unauthorizedInterceptor` ferme la session sur `401` et renvoie vers `/login?returnUrl=…`. |
| HTTPS de développement | Certificat auto-signé `localhost` généré avec selfsignedcert.com (type *Self-signed TLS*), déposé dans `certs/` (ignoré par Git), référencé par `ng serve` (`ssl`, `sslCert`, `sslKey`). |
| Produits | Schéma Zod aligné sur json-server : `id` numérique, liste paginée via `_page` / `_limit` / `_sort` / `_order` / `q` et en-tête `X-Total-Count`. Modification par `PATCH`. |
| Notifications | `NotificationStore` conserve son API ; la persistance passe par `NotificationApi` (chargement à l'ouverture de session, ajout, lecture, suppression). |
| Interface | Composants de la librairie `gca` (layout, formulaires, tableau, toasts, confirmation), d'après `projects/gca/EXAMPLES.md`. |

## Étapes

1. **Mettre à jour `ARCHITECTURE.md`** : décisions clés (backend, proxy, HTTPS, librairie `gca`), état actuel, organisation des fichiers (`server/`, `certs/`, `core/http`), § 5 (`ApiService` relatif + lecture paginée par en-tête), § 8 (trois interceptors), nouveau § « Environnement de développement » (json-server, authentification, proxy, HTTPS, scripts), notifications persistées, plan de mise en œuvre.
2. **Fondations** : déclarer `zod` et `json-server@0.17.4`, activer `strict` / `strictTemplates`, locale `fr-FR`, `lang="fr"`, thème `gca` dans `styles`, scripts npm (`api`, `build:gca`, `start`).
3. **Serveur de données** : `server/server.cjs` (middlewares d'authentification et de cloisonnement), `server/db.seed.json` (produits, utilisateurs de démonstration, notifications), test de fumée HTTP.
4. **HTTPS et proxy** : génération du certificat sur selfsignedcert.com, `proxy.conf.json`, options `ng serve`.
5. **Socle HTTP** : `infra/api/api-service.ts` (+ tests), `API_BASE_URL`, `apiUrlInterceptor`, `authInterceptor`, `unauthorizedInterceptor` (+ tests).
6. **Authentification** : `AuthApi`, `AuthService` (session en signaux, stockage local / session selon « Rester connecté »), `authGuard` / `guestGuard` (+ tests), page de connexion.
7. **Shell** : composant racine (`router-outlet`, `gca-toast`, `gca-confirm-dialog`), `AppLayout` (`gca-main-layout`, menu utilisateur, badge), page introuvable, routes.
8. **Produits** : `ProductApi`, `productResolver`, pages recherche / détail / modification, `unsavedChangesGuard` via `GcaConfirmService`.
9. **Notifications** : `NotificationApi`, `NotificationStore` persistant, page des notifications.
10. **Vérifier** : `ng build gca`, `ng test` (application), `ng build`, démarrage de `json-server` et de `ng serve` en HTTPS, parcours connexion → recherche → détail → modification → notifications dans le navigateur.
11. **Rédiger le rapport 007** dans `workflow/reports`, puis créer un commit multiligne normalisé.

## Hors périmètre

- Déploiement et serveur de production (le proxy et le certificat ne concernent que `ng serve`).
- Gestion des comptes (création, mot de passe oublié) : le lien de la maquette reste sans destination fonctionnelle.
