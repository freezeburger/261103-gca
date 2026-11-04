# Rapport 002 — Socle d'architecture applicative

## Tâche complétée

La tâche [002-architecture](../tasks/002-architecture.md) est terminée.

## Livrable

- [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) — état observé du squelette Angular et propositions de structure, conventions, pipes, directives, abstraction HTTP, services réactifs, notifications, routing, guards, resolvers et interceptors.

Le document distingue les fonctionnalités présentes des propositions et fournit des exemples et étapes de mise en œuvre. Il relève également que `zod` est utilisé par le schéma produit sans être déclaré directement dans `package.json`; ce point est signalé comme vérification à effectuer avant de s'appuyer sur sa validation à l'exécution.

## Vérification

- Relecture de la structure `src/app`, des routes, de la configuration, du schéma produit, du manifeste et des options TypeScript.
- `npm.cmd run build` : compilation réussie.
- Avertissement Angular préexistant : `RouterOutlet` est importé mais inutilisé dans le composant racine, dont le template est vide.
- Aucun code applicatif n'a été modifié dans le cadre de ce livrable.
