# Tache 003 — Maquettes fonctionnelles détaillées

**Statut : completed**

1. Relire les maquettes 001, le schéma [products.ts](../../src/app/core/schemas/products.ts) et l'[architecture](../documentation/ARCHITECTURE.md) (routes, guards, resolvers, notifications) afin d'identifier les comportements à spécifier.
2. Adopter un style « wireframe » commun et sobre : niveaux de gris, blocs simples, suppression des illustrations décoratives, couleur réservée aux états (erreur, avertissement, succès, focus).
3. Refondre les cinq écrans (connexion, recherche produits, détail produit, modification produit, notifications) en ajoutant pour chacun :
   - la route, le guard et le resolver concernés;
   - des repères numérotés sur les éléments d'interface;
   - un panneau de spécifications : données affichées, règles de validation, actions, états (chargement, vide, erreur) et navigation.
4. Vérifier que chaque SVG est un XML valide, encodé en UTF-8, au même format de canevas, et que les champs produit restent conformes au schéma (`id`, `title`, `description`, `price`, `thumbnail`).
5. Rédiger le rapport 003 dans `workflow/reports` référençant cette tâche, puis créer un commit multiligne normalisé incluant tâche, maquettes et rapport.
