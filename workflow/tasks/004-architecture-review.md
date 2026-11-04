# Tache 004 — Revue du socle d'architecture

**Statut : completed**

1. Relever la version réelle du framework et l'état de stabilité des API ciblées dans les typings installés (Angular 22.2 : signaux, `inject()`, `httpResource`/`rxResource`, Signal Forms, détection de changements sans zone, `withFetch` déprécié).
2. Restructurer [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) pour la lisibilité : synthèse des décisions en tête, sections courtes, tableaux de choix, exemples repliables dans des balises `<details>`.
3. Aligner toutes les conventions et tous les exemples sur la syntaxe Angular 22 : composants standalone, `inject()`, `input()`/`output()`/`model()`, `computed()`/`linkedSignal()`, contrôle de flux `@if`/`@for`, `httpResource`, Signal Forms, guards, resolvers et interceptors fonctionnels.
4. Simplifier le propos vers un usage applicatif : retirer les abstractions spéculatives (classe CRUD générique) au profit d'une API de domaine fine, d'un état local en signaux et d'un service partagé uniquement lorsqu'un état est réellement partagé ; relier chaque pattern aux écrans maquettés.
5. Vérifier que les exemples de code compilent contre les dépendances installées (fichiers temporaires typés, puis suppression), puis que l'application se construit.
6. Rédiger le rapport 004 dans `workflow/reports` référençant cette tâche, puis créer un commit multiligne normalisé incluant tâche, document et rapport.
