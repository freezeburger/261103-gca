# Tache 006 — Composants de la librairie `gca`

**Statut : completed**

Prompt d'origine : [006-GCALIB.md](../prompts/006-GCALIB.md). Périmètre : librairie `projects/gca` (composants, thème, documentation, exemples). Le shell applicatif (`src/app/shell`) n'est pas modifié.

## Principes

- Style inspiré de PrimeNG (surfaces arrondies, focus ring, variantes `severity`, densité confortable), **sans dépendance externe** : CSS pur, jetons `--gca-*` (couleur primaire indigo → violet, dégradés discrets, ombres douces).
- Chaque composant fonctionne sans feuille globale (valeurs de repli dans `var()`) ; un thème optionnel `gca-theme.css` permet de surcharger les jetons.
- Angular 22 : composants autonomes, `ChangeDetectionStrategy.OnPush`, `input()` / `model()` / `output()`, contrôle de flux `@if` / `@for`, `host` au lieu des décorateurs.
- Contrôles de saisie posés sur les éléments natifs (`input[gcaInput]`, `select[gcaSelect]`, `input[gcaCheckbox]`) pour rester compatibles Signal Forms (`[formField]`) comme les formulaires réactifs.
- Accessibilité : rôles ARIA (`alert`, `status`, `dialog`, `aria-sort`, `aria-busy`), focus visible, niveaux toujours exprimés par un texte.

## Étapes

1. **Inventaire des composants** à partir des maquettes `workflow/maquette` :

   | Maquette | Composants |
   | --- | --- |
   | 01 Connexion | `gcaButton` (états chargement / désactivé), `gca-field`, `gcaInput`, `gca-password-toggle`, `gcaCheckbox`, `gca-message` |
   | 02 Recherche | `gca-search-input`, `gcaSelect`, `gcaTable` + `gcaSortHeader`, `gca-paginator`, `gca-skeleton`, `gca-empty-state`, `gca-card` |
   | 03 Détail | `gca-breadcrumb`, `gca-image` (repli), `gca-progress-bar`, `gca-toast` |
   | 04 Modification | `gca-field` (compteur, erreur), `gca-tag`, `gca-confirm-dialog`, barre d'actions |
   | 05 Notifications | `gca-select-button`, `gca-tag`, `gca-badge`, toast avec action « Annuler » |
   | Commun | `gca-appbar` (logo, titre, menu utilisateur), `gca-menu` |
   | Demandé | `gca-drawer`, `gca-main-layout` (appbar + menu latéral + drawer mobile) |

2. **Socle de style** : `src/styles/gca-theme.css` (jetons, palette claire), déclaré en `assets` dans `ng-package.json`.
3. **Implémenter les composants** dans `src/lib/<composant>/` et les exporter dans `public-api.ts`. Remplacer le squelette `Appbar` par l'implémentation réelle ; conserver `QuantitySelector` (atelier existant).
4. **Services** : `GcaToastService` (pile de toasts, durée, action), `GcaConfirmService` (dialogue de confirmation retournant une `Promise<boolean>`, réutilisable par `unsavedChangesGuard`).
5. **Tests unitaires Vitest** des comportements clés (bouton en chargement, tri, pagination, compteur de champ, toast, drawer, confirmation).
6. **Documentation** : `projects/gca/README.md` (installation, thème, catalogue) et `projects/gca/EXAMPLES.md` (écrans complets à copier-coller : layout, connexion, recherche, détail, modification, notifications).
7. **Vérifier** : `ng build gca`, `ng test gca`, compilation stricte des exemples dans des fichiers temporaires (supprimés ensuite), `npm run build`.
8. **Rédiger le rapport 006** dans `workflow/reports`, puis créer un commit multiligne normalisé.

## Hors périmètre

- Branchement des écrans métiers dans l'application (`src/app/features`) et du layout dans le shell.
- Thème sombre, internationalisation des libellés internes (français par défaut, surchargeables par `input`).
