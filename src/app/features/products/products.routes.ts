import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/navigation/unsaved-changes-guard';
import ProductDetailPage from './pages/product-detail-page';
import ProductEditPage from './pages/product-edit-page';
import ProductSearchPage from './pages/product-search-page';
import { productResolver } from './product-resolver';

export default [
  { path: '', component: ProductSearchPage, title: 'Produits · Atelier' },
  {
    path: ':id',
    component: ProductDetailPage,
    resolve: { product: productResolver },
    title: 'Fiche produit · Atelier',
  },
  {
    path: ':id/edit',
    component: ProductEditPage,
    resolve: { product: productResolver },
    canDeactivate: [unsavedChangesGuard],
    title: 'Modifier le produit · Atelier',
  },
] satisfies Routes;
