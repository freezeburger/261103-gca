import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GcaBreadcrumb, GcaButton, GcaCard, GcaImage, GcaTag, GcaToastService } from 'gca';
import { ProductSchema } from '../../../core/schemas/products';

@Component({
  selector: 'app-product-detail-page',
  imports: [CurrencyPipe, RouterLink, GcaBreadcrumb, GcaButton, GcaCard, GcaImage, GcaTag],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
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
    try {
      await navigator.clipboard.writeText(String(this.product().id));
      this.toasts.success('Identifiant copié');
    } catch {
      this.toasts.warn("Impossible de copier l'identifiant");
    }
  }
}
