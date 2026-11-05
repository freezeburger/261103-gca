# Tache 008 — Commande `dev` unique

**Statut : completed**

Demande : ajouter une commande `dev` regroupant les commandes utiles au développement.

## Étapes

1. Ajouter `concurrently` en dépendance de développement (exécution parallèle multiplateforme, sortie préfixée, arrêt commun).
2. Scripts npm :
   - `dev` : `ng build gca`, puis en parallèle `api` (json-server :5050) et `ng serve` (HTTPS :4200 + proxy) ; l'arrêt de l'un arrête l'autre ;
   - `dev:reset` : idem avec les données de référence restaurées (`api:reset`).
3. Documenter dans le README et `ARCHITECTURE.md` § 13.
4. Vérifier : démarrage de `npm run dev`, API et application joignables via le proxy HTTPS, arrêt propre.
5. Rapport 008 et commit.
