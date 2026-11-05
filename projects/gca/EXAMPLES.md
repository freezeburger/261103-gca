# GCA — exemples d'intégration d'écrans

Écrans complets à copier-coller, alignés sur les maquettes `workflow/maquette` et sur
[ARCHITECTURE.md](../../workflow/documentation/ARCHITECTURE.md) (Signal Forms, `rxResource`,
état dans l'URL, `withComponentInputBinding()`).

Chaque bloc commence par son chemin cible. Les dépendances applicatives (`AuthService`,
`ProductApi`, `NotificationStore`) sont celles décrites dans l'architecture ; leurs signatures
attendues sont rappelées en [fin de document](#contrats-applicatifs-attendus).

- [0. Mise en place](#0-mise-en-place)
- [1. Gabarit principal (layout)](#1-gabarit-principal-layout)
- [2. Connexion — maquette 01](#2-connexion--maquette-01)
- [3. Recherche produits — maquette 02](#3-recherche-produits--maquette-02)
- [4. Détail produit — maquette 03](#4-détail-produit--maquette-03)
- [5. Modification produit — maquette 04](#5-modification-produit--maquette-04)
- [6. Notifications — maquette 05](#6-notifications--maquette-05)
- [7. Drawer de filtres](#7-drawer-de-filtres)

## 0. Mise en place

1. Construire la librairie : `ng build gca` (alias TypeScript `gca` → `dist/gca`).
2. Optionnel : déclarer le thème dans `angular.json` > `projects.application.architect.build.options.styles` :
   `["dist/gca/styles/gca-theme.css", "src/styles.scss"]`.
3. Placer les conteneurs de toasts et de confirmation une seule fois, dans le composant racine :

```ts
// src/app/shell/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GcaConfirmDialog, GcaToast } from 'gca';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GcaToast, GcaConfirmDialog],
  template: `
    <router-outlet />
    <gca-toast />
    <gca-confirm-dialog />
  `,
})
export class App {}
```

## 1. Gabarit principal (layout)

Appbar en dégradé, menu latéral repliable (drawer sous 960 px), badge des notifications non lues,
menu utilisateur et barre de progression pendant les navigations (resolvers).

```ts
// src/app/shell/app-layout.ts
import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  GcaMainLayout,
  GcaMenu,
  GcaMenuItem,
  GcaNavItem,
  GcaProgressBar,
  GcaSidebarFooter,
} from 'gca';
import { AuthService } from '../core/auth/auth-service';
import { NotificationStore } from '../core/notifications/notification-store';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, GcaMainLayout, GcaMenu, GcaProgressBar, GcaSidebarFooter],
  template: `
    @if (router.currentNavigation()) {
      <gca-progress-bar fixed ariaLabel="Chargement de la page" />
    }
    <gca-main-layout brand="Atelier" [navItems]="nav()">
      <gca-menu gcaAppbarEnd icon="👤" [label]="userName()" [items]="userMenu" />
      <ng-template gcaSidebarFooter>v1 · <a href="/aide">aide</a></ng-template>
      <router-outlet />
    </gca-main-layout>
  `,
})
export default class AppLayout {
  protected readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationStore);

  protected readonly userName = computed(() => this.auth.user()?.name ?? 'Mon compte');
  protected readonly nav = computed<GcaNavItem[]>(() => [
    { label: 'Produits', link: '/products', icon: '▦' },
    {
      label: 'Notifications',
      link: '/notifications',
      icon: '🔔',
      badge: this.notifications.unreadCount(),
      badgeLabel: 'non lues',
    },
  ]);
  protected readonly userMenu: GcaMenuItem[] = [
    { label: 'Déconnexion', icon: '⎋', danger: true, command: () => this.logout() },
  ];

  private logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
```

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guards';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/pages/login-page') },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/app-layout'),
    children: [
      { path: 'products', loadChildren: () => import('./features/products/products.routes') },
      {
        path: 'notifications',
        title: 'Notifications',
        loadComponent: () => import('./features/notifications/pages/notifications-page'),
      },
      { path: '', pathMatch: 'full', redirectTo: 'products' },
    ],
  },
];
```

## 2. Connexion — maquette 01

Écran public sans layout : carte centrée, bannière d'erreur focalisée, bascule du mot de passe,
bouton « Connexion… » bloqué pendant l'appel.

```ts
// src/app/features/auth/pages/login-page.ts
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, inject, Injector, input, signal, viewChild } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  GcaButton,
  GcaCard,
  GcaCheckbox,
  GcaField,
  GcaInput,
  GcaMessage,
  GcaPasswordToggle,
} from 'gca';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth-service';

interface LoginModel {
  email: string;
  password: string;
  remember: boolean;
}

@Component({
  selector: 'app-login-page',
  imports: [
    FormRoot,
    FormField,
    GcaButton,
    GcaCard,
    GcaCheckbox,
    GcaField,
    GcaInput,
    GcaMessage,
    GcaPasswordToggle,
  ],
  template: `
    <main class="login">
      <p class="brand">Atelier</p>
      <gca-card accent header="Connexion" subtitle="Accès réservé aux utilisateurs autorisés.">
        <form class="stack" [formRoot]="loginForm">
          @if (failure(); as failure) {
            <gca-message severity="danger" [summary]="failure">
              Vérifiez vos informations puis réessayez.
            </gca-message>
          }
          <gca-field label="Adresse e-mail">
            <input gcaInput type="email" autocomplete="username" autofocus [formField]="loginForm.email" />
          </gca-field>
          <gca-field label="Mot de passe">
            <input
              #password
              gcaInput
              type="password"
              autocomplete="current-password"
              [formField]="loginForm.password"
            />
            <gca-password-toggle gcaSuffix [for]="password" />
          </gca-field>
          <label class="remember">
            <input type="checkbox" gcaCheckbox [formField]="loginForm.remember" />
            Rester connecté sur cet appareil
          </label>
          <button gcaButton type="submit" variant="gradient" size="lg" [loading]="loginForm().submitting()">
            {{ loginForm().submitting() ? 'Connexion…' : 'Se connecter' }}
          </button>
          <a class="forgot" href="/mot-de-passe-oublie">Mot de passe oublié ?</a>
        </form>
      </gca-card>
      <small>* champ obligatoire · Entrée = valider</small>
    </main>
  `,
  styles: `
    .login {
      display: grid;
      place-content: center;
      gap: 1rem;
      min-height: 100vh;
      padding: 1rem;
      background: radial-gradient(circle at 20% 10%, #e0e7ff, transparent 40%),
        radial-gradient(circle at 80% 90%, #fae8ff, transparent 40%);
      text-align: center;
    }
    .brand { margin: 0; font-size: 1.5rem; font-weight: 800; color: #4338ca; }
    gca-card { width: min(26rem, 100vw - 2rem); text-align: left; }
    .stack { display: flex; flex-direction: column; gap: 1.1rem; }
    .remember { display: flex; align-items: center; font-size: 0.875rem; cursor: pointer; }
    .forgot { align-self: center; color: #4338ca; font-size: 0.875rem; }
    small { color: #64748b; }
  `,
})
export default class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly banner = viewChild(GcaMessage);

  /** Paramètre d'URL `?returnUrl=` reçu via withComponentInputBinding(). */
  readonly returnUrl = input<string>();

  protected readonly failure = signal<string | null>(null);
  protected readonly model = signal<LoginModel>({ email: '', password: '', remember: false });
  protected readonly loginForm = form(
    this.model,
    (p) => {
      required(p.email, { message: "L'adresse e-mail est obligatoire." });
      email(p.email, { message: "Format d'adresse e-mail invalide." });
      required(p.password, { message: 'Le mot de passe est obligatoire.' });
    },
    {
      submission: {
        action: async (f) => {
          const { email, password, remember } = f().value();
          this.failure.set(null);
          try {
            await firstValueFrom(this.auth.login({ username: email.trim(), password, remember }));
            await this.router.navigateByUrl(this.safeReturnUrl());
          } catch (error) {
            this.model.update((model) => ({ ...model, password: '' }));
            this.failure.set(
              error instanceof HttpErrorResponse && error.status === 401
                ? 'Identifiant ou mot de passe incorrect.'
                : 'Service indisponible, réessayez plus tard.',
            );
            afterNextRender(() => this.banner()?.focus(), { injector: this.injector });
          }
          return undefined;
        },
      },
    },
  );

  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/products';
  }
}
```

## 3. Recherche produits — maquette 02

Recherche à la frappe (300 ms), tri synchronisé entre la liste et les en-têtes, pagination,
squelettes, états vide et erreur. Tout l'état est dans l'URL.

```ts
// src/app/features/products/pages/product-search-page.ts
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  GcaButton,
  GcaCard,
  GcaEmptyState,
  GcaImage,
  GcaPageEvent,
  GcaPaginator,
  GcaSearchInput,
  GcaSelect,
  GcaSkeleton,
  GcaSort,
  GcaSortHeader,
  GcaTable,
} from 'gca';
import { ProductApi } from '../product-api';

const SORT_OPTIONS = [
  { value: '', label: 'Pertinence' },
  { value: 'title:asc', label: 'Titre A → Z' },
  { value: 'title:desc', label: 'Titre Z → A' },
  { value: 'price:asc', label: 'Prix croissant' },
  { value: 'price:desc', label: 'Prix décroissant' },
];

@Component({
  selector: 'app-product-search-page',
  imports: [
    CurrencyPipe,
    RouterLink,
    GcaButton,
    GcaCard,
    GcaEmptyState,
    GcaImage,
    GcaPaginator,
    GcaSearchInput,
    GcaSelect,
    GcaSkeleton,
    GcaSortHeader,
    GcaTable,
  ],
  template: `
    <header class="page-header">
      <h1>Produits</h1>
      <p>Recherchez un produit du catalogue puis consultez ou modifiez sa fiche.</p>
    </header>

    <gca-card>
      <div class="toolbar" role="search">
        <gca-search-input
          class="search"
          placeholder="Rechercher un produit"
          [value]="q()"
          (search)="navigate({ q: $event || null, page: null })"
        />
        <select gcaSelect class="sort" aria-label="Trier par" (change)="changeSortKey($any($event.target).value)">
          @for (option of sortOptions; track option.value) {
            <option [value]="option.value" [selected]="option.value === sortKey()">{{ option.label }}</option>
          }
        </select>
        <button gcaButton variant="text" severity="secondary" (click)="reset()">Réinitialiser</button>
      </div>

      @if (products.error()) {
        <gca-empty-state icon="⚠" heading="Impossible de charger les produits." description="Vos filtres sont conservés.">
          <button gcaButton icon="↻" (click)="products.reload()">Réessayer</button>
        </gca-empty-state>
      } @else if (products.hasValue()) {
        @let result = products.value();
        @if (result.products.length === 0) {
          <gca-empty-state icon="⌕" heading="Aucun résultat" [description]="'Aucun produit ne correspond à « ' + q() + ' ».'">
            <button gcaButton variant="outlined" (click)="reset()">Réinitialiser</button>
          </gca-empty-state>
        } @else {
          <p class="summary">
            <strong>{{ result.total }}</strong> résultats
            @if (q()) {
              pour « {{ q() }} »
            }
          </p>
          <div class="table-scroll">
            <table gcaTable [sort]="sort()" [loading]="products.isLoading()" (sortChange)="changeSort($event)">
              <thead>
                <tr>
                  <th><span class="sr-only">Miniature</span></th>
                  <th>ID</th>
                  <th gcaSortHeader="title">Titre</th>
                  <th>Description</th>
                  <th gcaSortHeader="price" class="gca-num">Prix</th>
                  <th class="gca-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (product of result.products; track product.id) {
                  <tr class="gca-row-link" tabindex="0" (click)="open(product.id)" (keydown.enter)="open(product.id)">
                    <td><gca-image compact width="36px" height="36px" [src]="product.thumbnail" [alt]="product.title" /></td>
                    <td>{{ product.id }}</td>
                    <td><strong>{{ product.title }}</strong></td>
                    <td class="gca-truncate" [title]="product.description">{{ product.description }}</td>
                    <td class="gca-num">{{ product.price | currency: 'EUR' }}</td>
                    <td class="gca-actions" (click)="$event.stopPropagation()">
                      <a gcaButton size="sm" variant="text" queryParamsHandling="preserve" [routerLink]="[product.id]">Voir</a>
                      <a gcaButton size="sm" variant="outlined" queryParamsHandling="preserve" [routerLink]="[product.id, 'edit']">
                        Modifier
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <gca-paginator [total]="result.total" [page]="page()" [pageSize]="size()" (paginate)="changePage($event)" />
        }
      } @else {
        <div class="skeletons" aria-busy="true">
          @for (row of [1, 2, 3, 4, 5, 6]; track row) {
            <div class="skeleton-row">
              <gca-skeleton shape="circle" width="36px" />
              <gca-skeleton width="25%" />
              <gca-skeleton width="45%" />
              <gca-skeleton width="10%" />
            </div>
          }
        </div>
      }
    </gca-card>
  `,
  styles: `
    .page-header h1 { margin: 0; font-size: 1.5rem; }
    .page-header p { margin: 0.25rem 0 1.25rem; color: #64748b; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
    .search { flex: 1 1 18rem; }
    .sort { width: auto; min-width: 12rem; }
    .summary { margin: 0; color: #64748b; font-size: 0.875rem; }
    .table-scroll { overflow-x: auto; }
    .skeleton-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  `,
})
export default class ProductSearchPage {
  private readonly api = inject(ProductApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Paramètres d'URL reçus via withComponentInputBinding()
  readonly q = input('');
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });
  readonly size = input(20, { transform: (v: unknown) => numberAttribute(v, 20) });
  readonly sortBy = input<string>();
  readonly order = input<'asc' | 'desc'>();

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly sort = computed<GcaSort | null>(() => {
    const field = this.sortBy();
    return field ? { field, order: this.order() ?? 'asc' } : null;
  });
  protected readonly sortKey = computed(() => {
    const sort = this.sort();
    return sort ? `${sort.field}:${sort.order}` : '';
  });

  protected readonly products = rxResource({
    params: () => ({ q: this.q(), page: this.page(), size: this.size(), sortBy: this.sortBy(), order: this.order() }),
    stream: ({ params }) => this.api.search(params),
  });

  protected navigate(queryParams: Params): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  protected changeSort(sort: GcaSort | null): void {
    this.navigate({ sortBy: sort?.field ?? null, order: sort?.order ?? null, page: null });
  }

  protected changeSortKey(key: string): void {
    const [field, order] = key.split(':') as [string, 'asc' | 'desc'];
    this.changeSort(field ? { field, order } : null);
  }

  protected changePage({ page, pageSize }: GcaPageEvent): void {
    this.navigate({ page: page > 1 ? page : null, size: pageSize === 20 ? null : pageSize });
  }

  protected reset(): void {
    void this.router.navigate([], { relativeTo: this.route });
  }

  protected open(id: string): void {
    void this.router.navigate([id], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }
}
```

```ts
// src/app/features/products/products.routes.ts
import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/navigation/unsaved-changes-guard';
import ProductDetailPage from './pages/product-detail-page';
import ProductEditPage from './pages/product-edit-page';
import ProductSearchPage from './pages/product-search-page';
import { productResolver } from './product-resolver';

export default [
  { path: '', component: ProductSearchPage, title: 'Produits' },
  { path: ':id', component: ProductDetailPage, resolve: { product: productResolver } },
  {
    path: ':id/edit',
    component: ProductEditPage,
    resolve: { product: productResolver },
    canDeactivate: [unsavedChangesGuard],
  },
] satisfies Routes;
```

## 4. Détail produit — maquette 03

Fil d'Ariane dans la page, retour à la recherche avec ses paramètres, copie de l'identifiant
(toast), image avec repli.

```ts
// src/app/features/products/pages/product-detail-page.ts
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GcaBreadcrumb, GcaButton, GcaCard, GcaImage, GcaToastService } from 'gca';
import { ProductSchema } from '../../../core/schemas/products';

@Component({
  selector: 'app-product-detail-page',
  imports: [CurrencyPipe, RouterLink, GcaBreadcrumb, GcaButton, GcaCard, GcaImage],
  template: `
    <gca-breadcrumb [items]="crumbs()" />
    <header class="page-header">
      <a gcaButton variant="text" severity="secondary" icon="←" routerLink="/products" queryParamsHandling="preserve">
        Retour aux résultats
      </a>
      <h1>Produit n° {{ product().id }}</h1>
    </header>

    <div class="grid">
      <gca-card class="media">
        <gca-image width="100%" height="300px" [src]="product().thumbnail" [alt]="product().title" />
      </gca-card>

      <gca-card accent header="Informations">
        <a gcaButton gcaCardActions icon="✎" [routerLink]="['edit']" queryParamsHandling="preserve">Modifier</a>
        <dl class="info">
          <dt>Identifiant</dt>
          <dd>
            {{ product().id }}
            <button gcaButton size="sm" variant="text" (click)="copyId()">Copier</button>
          </dd>
          <dt>Titre</dt>
          <dd>{{ product().title }}</dd>
          <dt>Prix</dt>
          <dd class="price">{{ product().price | currency: 'EUR' }}</dd>
          <dt>Miniature</dt>
          <dd class="url">
            <span [title]="product().thumbnail">{{ product().thumbnail }}</span>
            <a [href]="product().thumbnail" target="_blank" rel="noopener">Ouvrir ↗</a>
          </dd>
        </dl>
      </gca-card>

      <gca-card header="Description" class="wide">
        <p class="description">{{ product().description }}</p>
      </gca-card>
    </div>
  `,
  styles: `
    .page-header { display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; margin: 1rem 0; }
    h1 { margin: 0; font-size: 1.5rem; }
    .grid { display: grid; grid-template-columns: minmax(16rem, 1fr) 2fr; gap: 1.25rem; }
    .wide { grid-column: 1 / -1; }
    .info { display: grid; grid-template-columns: max-content 1fr; gap: 0.75rem 1.5rem; margin: 0; }
    dt { color: #64748b; font-size: 0.875rem; }
    dd { display: flex; align-items: center; gap: 0.5rem; min-width: 0; margin: 0; font-weight: 600; }
    .price { color: #4338ca; font-size: 1.125rem; }
    .url span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .description { margin: 0; white-space: pre-line; line-height: 1.6; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export default class ProductDetailPage {
  private readonly toasts = inject(GcaToastService);

  /** Produit fourni par productResolver. */
  readonly product = input.required<ProductSchema>();

  protected readonly crumbs = computed(() => [
    { label: 'Produits', link: '/products' },
    { label: this.product().title },
  ]);

  protected async copyId(): Promise<void> {
    await navigator.clipboard.writeText(String(this.product().id));
    this.toasts.success('Identifiant copié');
  }
}
```

## 5. Modification produit — maquette 04

Indicateur de modifications, compteurs, préfixe/suffixe, aperçu de la miniature, résumé
d'erreurs, barre d'actions collante et confirmation de sortie par `GcaConfirmService`.

```ts
// src/app/features/products/pages/product-edit-page.ts
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  min,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  GcaButton,
  GcaCard,
  GcaField,
  GcaImage,
  GcaInput,
  GcaMessage,
  GcaTag,
  GcaToastService,
} from 'gca';
import { firstValueFrom } from 'rxjs';
import { HasUnsavedChanges } from '../../../core/navigation/unsaved-changes-guard';
import { NotificationStore } from '../../../core/notifications/notification-store';
import { ProductSchema } from '../../../core/schemas/products';
import { ProductApi, ProductChanges } from '../product-api';

@Component({
  selector: 'app-product-edit-page',
  imports: [FormRoot, FormField, RouterLink, GcaButton, GcaCard, GcaField, GcaImage, GcaInput, GcaMessage, GcaTag],
  template: `
    <form class="edit" [formRoot]="productForm">
      <header class="page-header">
        <h1>Modifier le produit</h1>
        @if (productForm().dirty()) {
          <gca-tag severity="warn" icon="●" rounded>Modifications non enregistrées</gca-tag>
        }
      </header>

      @for (error of productForm().errors(); track error.kind) {
        <gca-message severity="danger" [summary]="error.message" />
      }

      <div class="grid">
        <gca-card header="Fiche produit" subtitle="Les champs marqués * sont obligatoires.">
          <div class="fields">
            <gca-field label="Identifiant" hint="Non modifiable.">
              <input gcaInput readonly [value]="product().id" />
            </gca-field>
            <gca-field label="Titre" hint="3 à 100 caractères." [count]="model().title.length" [maxLength]="100">
              <input gcaInput [formField]="productForm.title" />
            </gca-field>
            <gca-field label="Prix">
              <input gcaInput type="number" step="0.01" [formField]="productForm.price" />
              <span gcaSuffix>€</span>
            </gca-field>
            <gca-field
              label="Description"
              hint="Texte brut, 10 à 1 000 caractères."
              [count]="model().description.length"
              [maxLength]="1000"
            >
              <textarea gcaInput rows="5" [formField]="productForm.description"></textarea>
            </gca-field>
            <gca-field label="URL de la miniature" hint="URL https:// absolue.">
              <input gcaInput type="url" [formField]="productForm.thumbnail" />
            </gca-field>
          </div>
        </gca-card>

        <gca-card header="Aperçu" subtitle="Mis à jour à la saisie de l'URL.">
          <gca-image width="100%" height="240px" fallbackLabel="Aperçu indisponible" [src]="model().thumbnail" />
        </gca-card>
      </div>

      <footer class="actions">
        @if (productForm().touched() && invalidFields().length) {
          <span class="summary" role="alert">
            ⚠ {{ invalidFields().length }} champ(s) à corriger : {{ invalidFields().join(', ') }}.
          </span>
        }
        <a gcaButton variant="text" severity="secondary" queryParamsHandling="preserve" [routerLink]="['/products', product().id]">
          Annuler
        </a>
        <button
          gcaButton
          type="submit"
          icon="✓"
          [disabled]="!productForm().dirty() || productForm().invalid()"
          [loading]="productForm().submitting()"
        >
          {{ productForm().submitting() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </footer>
    </form>
  `,
  styles: `
    .edit { display: flex; flex-direction: column; gap: 1.25rem; padding-bottom: 5rem; }
    .page-header { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
    h1 { margin: 0; font-size: 1.5rem; }
    .grid { display: grid; grid-template-columns: 2fr minmax(16rem, 1fr); gap: 1.25rem; align-items: start; }
    .fields { display: grid; gap: 1.25rem; }
    .actions {
      position: sticky;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      background: rgb(255 255 255 / 90%);
      backdrop-filter: blur(6px);
      box-shadow: 0 -4px 20px rgb(15 23 42 / 8%);
    }
    .summary { margin-right: auto; color: #b91c1c; font-size: 0.875rem; font-weight: 600; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export default class ProductEditPage implements HasUnsavedChanges {
  private readonly api = inject(ProductApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(GcaToastService);
  private readonly notifications = inject(NotificationStore);

  /** Produit fourni par productResolver. */
  readonly product = input.required<ProductSchema>();

  protected readonly model = linkedSignal<ProductChanges>(() => {
    const { id: _id, ...changes } = this.product();
    return changes;
  });

  protected readonly productForm = form(
    this.model,
    (p) => {
      required(p.title, { message: 'Le titre est obligatoire.' });
      minLength(p.title, 3, { message: '3 caractères minimum.' });
      maxLength(p.title, 100, { message: '100 caractères maximum.' });
      required(p.price, { message: 'Le prix est obligatoire.' });
      min(p.price, 0, { message: 'Le prix doit être supérieur ou égal à 0.' });
      required(p.description, { message: 'La description est obligatoire.' });
      minLength(p.description, 10, { message: '10 caractères minimum.' });
      maxLength(p.description, 1000, { message: '1 000 caractères maximum.' });
      required(p.thumbnail, { message: "L'URL de la miniature est obligatoire." });
      pattern(p.thumbnail, /^https:\/\/\S+$/, { message: 'URL https:// attendue.' });
    },
    {
      submission: {
        action: async (f) => {
          try {
            const saved = await firstValueFrom(this.api.update(this.product().id, f().value()));
            f().reset();
            this.toasts.success('Produit enregistré', `« ${saved.title} » a été mis à jour.`);
            this.notifications.add({ level: 'success', title: 'Produit enregistré', message: saved.title });
            await this.router.navigate(['/products', saved.id]);
            return undefined;
          } catch {
            return { kind: 'server', message: "L'enregistrement a échoué. Votre saisie est conservée." };
          }
        },
      },
    },
  );

  protected readonly invalidFields = computed(() => {
    const f = this.productForm;
    const fields = [
      ['Titre', f.title().invalid()],
      ['Prix', f.price().invalid()],
      ['Description', f.description().invalid()],
      ['URL de la miniature', f.thumbnail().invalid()],
    ] as const;
    return fields.filter(([, invalid]) => invalid).map(([label]) => label);
  });

  hasUnsavedChanges(): boolean {
    return this.productForm().dirty();
  }
}
```

```ts
// src/app/core/navigation/unsaved-changes-guard.ts
import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { GcaConfirmService } from 'gca';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  inject(GcaConfirmService).confirm({
    header: 'Quitter sans enregistrer ?',
    message: 'Vos modifications seront perdues.',
    acceptLabel: 'Quitter',
    rejectLabel: 'Rester sur la page',
    severity: 'danger',
  });
```

## 6. Notifications — maquette 05

Filtres Statut (segmenté) et Niveau dans l'URL, groupes Aujourd'hui / Hier / Plus ancien,
niveau en texte, suppression avec « Annuler » pendant 5 s, « Charger plus ».

```ts
// src/app/features/notifications/pages/notifications-page.ts
import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  GcaButton,
  GcaCard,
  GcaEmptyState,
  GcaSelect,
  GcaSelectButton,
  GcaSelectButtonOption,
  GcaSeverity,
  GcaTag,
  GcaToastService,
} from 'gca';
import {
  AppNotification,
  NotificationLevel,
  NotificationStore,
} from '../../../core/notifications/notification-store';

type Status = 'all' | 'unread' | 'read';

const LEVELS: Record<NotificationLevel, { label: string; severity: GcaSeverity }> = {
  error: { label: 'ERREUR', severity: 'danger' },
  warning: { label: 'AVERT.', severity: 'warn' },
  success: { label: 'SUCCÈS', severity: 'success' },
  info: { label: 'INFO', severity: 'info' },
};
const PAGE_SIZE = 20;
const UNDO_DELAY = 5000;

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, RouterLink, GcaButton, GcaCard, GcaEmptyState, GcaSelect, GcaSelectButton, GcaTag],
  template: `
    <header class="page-header">
      <div>
        <h1>Notifications</h1>
        <p>{{ store.unreadCount() }} non lues sur {{ visible().length }}</p>
      </div>
      <button gcaButton variant="outlined" icon="✓" [disabled]="store.unreadCount() === 0" (click)="store.markAllAsRead()">
        Tout marquer comme lu
      </button>
    </header>

    <gca-card>
      <div class="filters">
        <gca-select-button
          ariaLabel="Statut"
          [options]="statusOptions()"
          [value]="status()"
          (valueChange)="navigate({ status: $event === 'all' ? null : $event })"
        />
        <select gcaSelect class="level" aria-label="Niveau" (change)="navigate({ level: $any($event.target).value || null })">
          <option value="">Tous les niveaux</option>
          @for (entry of levelEntries; track entry[0]) {
            <option [value]="entry[0]" [selected]="entry[0] === level()">{{ entry[1].label }}</option>
          }
        </select>
      </div>

      @for (group of groups(); track group.label) {
        <h2 class="group">{{ group.label }}</h2>
        @for (n of group.items; track n.id) {
          <article class="notification" [class.unread]="!n.readAt">
            <gca-tag [severity]="levels[n.level].severity">{{ levels[n.level].label }}</gca-tag>
            <div class="content">
              <h3>{{ n.title }}</h3>
              <p>{{ n.message }}</p>
              @if (n.action; as action) {
                <a [routerLink]="action.link" (click)="store.markAsRead(n.id)">{{ action.label }} →</a>
              }
            </div>
            <time [attr.datetime]="n.createdAt" [title]="n.createdAt | date: 'full'">{{ n.createdAt | date: 'short' }}</time>
            <div class="row-actions">
              @if (!n.readAt) {
                <button gcaButton size="sm" variant="text" (click)="store.markAsRead(n.id)">Marquer lu</button>
              }
              <button gcaButton size="sm" variant="text" severity="danger" (click)="remove(n)">Suppr.</button>
            </div>
          </article>
        }
      } @empty {
        <gca-empty-state icon="🔔" [heading]="emptyMessage()">
          @if (status() !== 'all' || level()) {
            <button gcaButton variant="outlined" (click)="navigate({ status: null, level: null })">
              Afficher toutes les notifications
            </button>
          }
        </gca-empty-state>
      }

      @if (filtered().length > limit()) {
        <button gcaButton class="more" variant="text" (click)="limit.set(limit() + pageSize)">Charger plus</button>
      }
    </gca-card>
  `,
  styles: `
    .page-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
    h1 { margin: 0; font-size: 1.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: #64748b; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
    .level { width: auto; min-width: 12rem; }
    .group { margin: 0.5rem 0 0; color: #64748b; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; }
    .notification {
      display: grid;
      grid-template-columns: 5.5rem 1fr auto auto;
      gap: 1rem;
      align-items: start;
      padding: 0.875rem 1rem;
      border: 1px solid #e2e8f0;
      border-left: 4px solid transparent;
      border-radius: 10px;
    }
    .notification.unread { border-left-color: #6366f1; background: #f8faff; }
    .notification.unread h3 { font-weight: 800; }
    h3 { margin: 0; font-size: 0.9375rem; font-weight: 600; }
    .content p { margin: 0.25rem 0; color: #475569; font-size: 0.875rem; }
    .content a { color: #4338ca; font-size: 0.875rem; font-weight: 600; }
    time { color: #64748b; font-size: 0.8125rem; white-space: nowrap; }
    .more { align-self: center; }
    @media (max-width: 700px) { .notification { grid-template-columns: 1fr; } }
  `,
})
export default class NotificationsPage {
  protected readonly store = inject(NotificationStore);
  private readonly toasts = inject(GcaToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Paramètres d'URL reçus via withComponentInputBinding()
  readonly statusParam = input<Status | undefined>(undefined, { alias: 'status' });
  readonly levelParam = input<NotificationLevel | undefined>(undefined, { alias: 'level' });

  protected readonly levels = LEVELS;
  protected readonly levelEntries = Object.entries(LEVELS) as [NotificationLevel, (typeof LEVELS)[NotificationLevel]][];
  protected readonly pageSize = PAGE_SIZE;
  protected readonly limit = signal(PAGE_SIZE);
  private readonly pendingRemoval = signal<ReadonlySet<string>>(new Set());

  protected readonly status = computed<Status>(() => this.statusParam() ?? 'all');
  protected readonly level = computed(() => this.levelParam() ?? null);

  protected readonly visible = computed(() =>
    this.store.items().filter((n) => !this.pendingRemoval().has(n.id)),
  );
  protected readonly statusOptions = computed<GcaSelectButtonOption<Status>[]>(() => {
    const all = this.visible();
    const unread = all.filter((n) => !n.readAt).length;
    return [
      { label: 'Toutes', value: 'all', count: all.length },
      { label: 'Non lues', value: 'unread', count: unread },
      { label: 'Lues', value: 'read', count: all.length - unread },
    ];
  });
  protected readonly filtered = computed(() =>
    this.visible()
      .filter((n) => this.status() === 'all' || (this.status() === 'unread') === !n.readAt)
      .filter((n) => !this.level() || n.level === this.level())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  protected readonly groups = computed(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 86_400_000;
    const groups = [
      { label: "Aujourd'hui", items: [] as AppNotification[] },
      { label: 'Hier', items: [] as AppNotification[] },
      { label: 'Plus ancien', items: [] as AppNotification[] },
    ];
    for (const n of this.filtered().slice(0, this.limit())) {
      const time = new Date(n.createdAt).getTime();
      groups[time >= today ? 0 : time >= yesterday ? 1 : 2].items.push(n);
    }
    return groups.filter((group) => group.items.length > 0);
  });
  protected readonly emptyMessage = computed(() =>
    this.status() === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification.',
  );

  protected navigate(queryParams: Params): void {
    this.limit.set(PAGE_SIZE);
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  protected remove(n: AppNotification): void {
    this.setPending(n.id, true);
    const timer = setTimeout(() => {
      this.store.remove(n.id);
      this.setPending(n.id, false);
    }, UNDO_DELAY);
    this.toasts.show({
      summary: 'Notification supprimée.',
      life: UNDO_DELAY,
      action: {
        label: 'Annuler',
        run: () => {
          clearTimeout(timer);
          this.setPending(n.id, false);
        },
      },
    });
  }

  private setPending(id: string, pending: boolean): void {
    this.pendingRemoval.update((ids) => {
      const next = new Set(ids);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
```

## 7. Drawer de filtres

Le drawer s'utilise aussi hors du layout, par exemple pour des filtres sur mobile :

```ts
// src/app/features/products/ui/product-filters-drawer.ts
import { Component, model, signal } from '@angular/core';
import { GcaButton, GcaCheckbox, GcaDrawer, GcaField, GcaInput } from 'gca';

@Component({
  selector: 'app-product-filters-drawer',
  imports: [GcaButton, GcaCheckbox, GcaDrawer, GcaField, GcaInput],
  template: `
    <button gcaButton variant="outlined" icon="⚙" (click)="open.set(true)">Filtres</button>
    <gca-drawer header="Filtres" position="right" size="22rem" [(visible)]="open">
      <div class="stack">
        <gca-field label="Prix maximum">
          <input #max gcaInput type="number" [value]="maxPrice()" (input)="maxPrice.set(max.element.value)" />
          <span gcaSuffix>€</span>
        </gca-field>
        <label><input type="checkbox" gcaCheckbox [checked]="inStock()" (change)="inStock.set(!inStock())" /> En stock</label>
      </div>
      <ng-container gcaDrawerFooter>
        <button gcaButton variant="text" severity="secondary" (click)="open.set(false)">Fermer</button>
        <button gcaButton (click)="apply()">Appliquer</button>
      </ng-container>
    </gca-drawer>
  `,
  styles: '.stack { display: grid; gap: 1.25rem; }',
})
export class ProductFiltersDrawer {
  readonly maxPrice = model('');
  readonly inStock = model(false);
  protected readonly open = signal(false);

  protected apply(): void {
    this.open.set(false);
  }
}
```

## Contrats applicatifs attendus

Signatures minimales utilisées par les exemples (voir ARCHITECTURE.md § 5, § 7, § 8 et § 9) :

| Élément | Signature attendue |
| --- | --- |
| `AuthService` (`core/auth/auth-service.ts`) | `user: Signal<{ name: string } \| null>`, `login({ username, password, remember }): Observable<unknown>`, `logout(): void` |
| `authGuard`, `guestGuard` (`core/auth/auth-guards.ts`) | `CanActivateFn` |
| `ProductApi` (`features/products/product-api.ts`) | `search({ q, page, size, sortBy?, order? }): Observable<{ products: ProductSchema[]; total: number }>`, `update(id, changes: ProductChanges): Observable<ProductSchema>` |
| `productResolver` (`features/products/product-resolver.ts`) | `ResolveFn<ProductSchema>` |
| `NotificationStore` (`core/notifications/notification-store.ts`) | `items`, `unreadCount`, `add`, `markAsRead`, `markAllAsRead`, `remove` ; types `AppNotification`, `NotificationLevel` |

`ProductQuery` est complété par `sortBy` / `order` (tri de la maquette 02) et la réponse de
recherche par `total` (pagination), comme signalé dans l'architecture.
