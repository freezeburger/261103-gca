# Rapport 001 — Maquettage fonctionnel

## Tache complétée

La tache [001-maquettage](../tasks/001-maquettage.md) est terminée.

## Livrables

- [01-connexion.svg](../maquette/01-connexion.svg) — écran de connexion.
- [02-recherche-produits.svg](../maquette/02-recherche-produits.svg) — recherche et liste des produits.
- [03-detail-produit.svg](../maquette/03-detail-produit.svg) — détail du produit.
- [04-modification-produit.svg](../maquette/04-modification-produit.svg) — formulaire de modification.
- [05-notifications.svg](../maquette/05-notifications.svg) — récapitulatif conceptuel des notifications.

Les écrans produit reprennent les champs du schéma [products.ts](../../src/app/core/schemas/products.ts) : identifiant, titre, description, prix et miniature. Les événements affichés dans les notifications sont des exemples de présentation, et non des données définies par ce schéma.

## Vérification

- Les cinq fichiers SVG sont présents et lisibles comme XML.
- Chaque maquette utilise un canevas de 1440 × 1000.
- Pas de compilation Angular : seuls des livrables graphiques ont été ajoutés.
