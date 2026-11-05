import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { form, FormField, FormRoot, maxLength, min, minLength, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { GcaButton, GcaCard, GcaField, GcaImage, GcaInput, GcaMessage, GcaTag, GcaToastService } from 'gca';
import { firstValueFrom } from 'rxjs';
import { HasUnsavedChanges } from '../../../core/navigation/unsaved-changes-guard';
import { NotificationStore } from '../../../core/notifications/notification-store';
import { ProductSchema } from '../../../core/schemas/products';
import { ProductApi, ProductChanges } from '../product-api';

@Component({
  selector: 'app-product-edit-page',
  imports: [FormRoot, FormField, RouterLink, GcaButton, GcaCard, GcaField, GcaImage, GcaInput, GcaMessage, GcaTag],
  templateUrl: './product-edit-page.html',
  styleUrl: './product-edit-page.scss',
})
export default class ProductEditPage implements HasUnsavedChanges {
  private readonly api = inject(ProductApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(GcaToastService);
  private readonly notifications = inject(NotificationStore);

  /** Produit fourni par productResolver. */
  readonly product = input.required<ProductSchema>();

  // Modèle du formulaire, réinitialisé si le produit résolu change.
  protected readonly model = linkedSignal<ProductChanges>(() => {
    const { title, description, price, thumbnail } = this.product();
    return { title, description, price, thumbnail };
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
            this.notifications.add({
              level: 'success',
              title: 'Produit enregistré',
              message: saved.title,
              action: { label: 'Voir le produit', link: `/products/${saved.id}` },
            });
            await this.router.navigate(['/products', saved.id], { queryParamsHandling: 'preserve' });
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
    return this.productForm().dirty() && !this.productForm().submitting();
  }
}
