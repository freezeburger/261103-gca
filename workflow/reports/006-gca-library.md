# Rapport 006 — Composants de la librairie `gca`

## Tâche complétée

La tâche [006-gca-library](../tasks/006-gca-library.md) est terminée.

## Livrables

- Librairie `projects/gca` (projet `gca` déclaré dans `angular.json`, construite par `ng-packagr` vers `dist/gca`, alias TypeScript `gca`).
- Thème optionnel `src/styles/gca-theme.css` (jetons `--gca-*`, palette indigo → violet), copié dans `dist/gca/styles`.
- 30 composants, directives et services exportés par `public-api.ts` :
  - saisie : `gcaButton`, `gca-field`, `gcaInput`, `gcaSelect`, `gcaCheckbox`, `gca-password-toggle`, `gca-search-input`, `gca-select-button` ;
  - affichage : `gca-card`, `gca-message`, `gca-tag`, `gca-badge`, `gca-image`, `gca-skeleton`, `gca-progress-bar`, `gca-empty-state` ;
  - données : `gcaTable` + `gcaSortHeader`, `gca-paginator` ;
  - navigation : `gca-appbar`, `gca-main-layout`, `gca-menu`, `gca-breadcrumb`, `gca-drawer` ;
  - superpositions : `gca-dialog`, `gca-confirm-dialog` + `GcaConfirmService`, `gca-toast` + `GcaToastService`.
- `QuantitySelector` (atelier existant) conservé.
- Documentation : [README.md](../../projects/gca/README.md) (installation, thème, catalogue) et [EXAMPLES.md](../../projects/gca/EXAMPLES.md) (layout, connexion, recherche, détail, modification, notifications, drawer).

## Vérification

- `ng build gca` : réussi.
- `ng test gca --watch=false` : 6 fichiers, 17 tests réussis.
- Les 11 blocs de code d'`EXAMPLES.md` ont été extraits vers des fichiers temporaires, complétés par des bouchons des contrats applicatifs, puis compilés avec `ngc` en `strict` + `strictTemplates` (diagnostics étendus en erreur) : aucune erreur.
- La librairie compile en mode strict ; seul diagnostic : import inutilisé (`AsyncPipe`) du `QuantitySelector` d'atelier, hors périmètre.
- Fichiers temporaires (`tmp/gca-check`) supprimés.

## Hors périmètre

Le branchement des écrans dans l'application et les modifications d'expérimentation du shell (`src/app/shell`) sont traités par la tâche 007.
