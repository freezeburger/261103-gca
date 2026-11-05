import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

export interface GcaBreadcrumbItem {
  readonly label: string;
  readonly link?: string | readonly unknown[];
  readonly queryParams?: Params;
}

/**
 * Fil d'Ariane ; le dernier élément est la page courante.
 *
 * `<gca-breadcrumb [items]="[{ label: 'Produits', link: '/products' }, { label: product().title }]" />`
 */
@Component({
  selector: 'gca-breadcrumb',
  imports: [RouterLink],
  template: `
    <ol>
      @for (item of items(); track $index; let last = $last) {
        <li>
          @if (item.link && !last) {
            <a [routerLink]="item.link" [queryParams]="item.queryParams">{{ item.label }}</a>
          } @else {
            <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
          }
        </li>
      }
    </ol>
  `,
  styleUrl: './breadcrumb.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'navigation', '[attr.aria-label]': 'ariaLabel()' },
})
export class GcaBreadcrumb {
  readonly items = input.required<readonly GcaBreadcrumbItem[]>();
  readonly ariaLabel = input("Fil d'Ariane");
}
