# Rapport 003 — Maquettes fonctionnelles détaillées

## Tâche complétée

La tâche [003-maquettage](../tasks/003-maquettage.md) est terminée.

## Livrables

Les cinq maquettes de la tâche 001 ont été remplacées par des wireframes annotés, en niveaux de gris, sans illustrations décoratives ; la couleur est réservée aux états (erreur, avertissement, succès, focus).

Chaque écran comporte :

- un bandeau de contexte : route, guard(s), resolver et appel API ou modèle de données ;
- la maquette de l'écran avec des repères numérotés ;
- un panneau « Spécifications fonctionnelles » décrivant, pour chaque repère, les données, règles de validation, actions, navigation et états (chargement, vide, erreur).

| Maquette | Principaux ajouts fonctionnels |
| --- | --- |
| [01-connexion.svg](../maquette/01-connexion.svg) | `guestGuard`, `returnUrl`, validation des champs, bannière d'erreur 401/5xx, états du bouton de soumission. |
| [02-recherche-produits.svg](../maquette/02-recherche-produits.svg) | Recherche avec délai de saisie, tri, taille de page, tableau avec actions Voir/Modifier, pagination, filtres dans l'URL, états chargement/vide/erreur. |
| [03-detail-produit.svg](../maquette/03-detail-produit.svg) | `productResolver`, fiche libellé/valeur des champs du schéma, copie de l'identifiant, repli de miniature, états de route (chargement, 404, erreur). |
| [04-modification-produit.svg](../maquette/04-modification-produit.svg) | Règles de validation par champ, compteurs, aperçu de miniature, indicateur de modifications, résumé d'erreurs, `unsavedChangesGuard`, gestion des réponses 200/400/404/5xx. |
| [05-notifications.svg](../maquette/05-notifications.svg) | Modèle `AppNotification`, compteur des non lues, filtres statut/niveau, groupement par date, actions par ligne, chargement progressif, suppression avec annulation. |

Les champs produit restent ceux du schéma [products.ts](../../src/app/core/schemas/products.ts) : `id`, `title`, `description`, `price`, `thumbnail`. Les routes, guards et resolvers reprennent les propositions de [ARCHITECTURE.md](../documentation/ARCHITECTURE.md) ; les seuils de validation et les notifications affichées sont des propositions et exemples à confirmer, pas un contrat de données.

## Vérification

- Les cinq SVG sont du XML valide, encodés en UTF-8, au format commun de 1600 × 1000.
- Chaque maquette a été rendue en image et relue : absence de chevauchements et de débordement du panneau de spécifications, cohérence entre repères et descriptions.
- Pas de compilation Angular : seuls des livrables de documentation ont été modifiés.
