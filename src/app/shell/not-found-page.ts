import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GcaButton, GcaEmptyState } from 'gca';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, GcaButton, GcaEmptyState],
  template: `
    <main class="not-found">
      <gca-empty-state icon="404" heading="Page introuvable" description="La page demandée n'existe pas ou a été déplacée.">
        <a gcaButton routerLink="/products">Retour aux produits</a>
      </gca-empty-state>
    </main>
  `,
  styles: `
    .not-found {
      display: grid;
      place-content: center;
      min-height: 60vh;
    }
  `,
})
export default class NotFoundPage {}
