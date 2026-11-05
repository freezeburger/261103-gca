# GCA — librairie de composants Angular

Composants Angular 22 autonomes (`OnPush`, signaux, `input()` / `model()` / `output()`), au style
inspiré de PrimeNG, **sans dépendance externe** : CSS pur et jetons `--gca-*` (palette indigo → violet).

## Installation

```bash
ng build gca            # produit dist/gca
```

L'application résout l'alias TypeScript `gca` vers `dist/gca` (`tsconfig.json` > `paths`) :

```ts
import { GcaButton, GcaToastService } from 'gca';
```

## Thème

Chaque composant embarque des valeurs de repli ; le thème est optionnel. Pour poser la palette et
les styles de base du document, déclarer la feuille dans `angular.json` :

```json
"styles": ["dist/gca/styles/gca-theme.css", "src/styles.scss"]
```

Surcharger un jeton suffit à personnaliser la palette :

```css
:root { --gca-primary: #0ea5e9; --gca-radius: 6px; }
```

## Catalogue

| Famille | Composants |
| --- | --- |
| Saisie | `button[gcaButton]` / `a[gcaButton]`, `gca-field` (libellé, aide, compteur, erreur), `input[gcaInput]` / `textarea[gcaInput]`, `select[gcaSelect]`, `input[gcaCheckbox]`, `gca-password-toggle`, `gca-search-input`, `gca-select-button` |
| Affichage | `gca-card`, `gca-message`, `gca-tag`, `gca-badge`, `gca-image` (repli), `gca-skeleton`, `gca-progress-bar`, `gca-empty-state` |
| Données | `table[gcaTable]` + `th[gcaSortHeader]`, `gca-paginator` |
| Navigation | `gca-appbar`, `gca-main-layout` (+ `ng-template[gcaSidebarFooter]`), `gca-menu`, `gca-breadcrumb`, `gca-drawer` |
| Superpositions | `gca-dialog`, `gca-confirm-dialog` + `GcaConfirmService`, `gca-toast` + `GcaToastService` |
| Atelier | `gca-quantity-selector` |

Les contrôles de saisie sont des directives posées sur les éléments natifs : ils restent
compatibles avec Signal Forms (`[formField]`) comme avec les formulaires réactifs.

Placer `<gca-toast />` et `<gca-confirm-dialog />` une seule fois, dans le composant racine.

```ts
inject(GcaToastService).success('Produit enregistré');
const ok = await inject(GcaConfirmService).confirm({ header: 'Quitter sans enregistrer ?', severity: 'danger' });
```

## Exemples

[EXAMPLES.md](./EXAMPLES.md) fournit des écrans complets à copier-coller : layout, connexion,
recherche, détail, modification, notifications et drawer de filtres.

## Tests

```bash
ng test gca --watch=false
```
