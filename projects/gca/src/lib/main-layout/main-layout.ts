import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  DOCUMENT,
  effect,
  inject,
  input,
  model,
  signal,
  TemplateRef,
} from '@angular/core';
import { Params, RouterLink, RouterLinkActive } from '@angular/router';
import { GcaAppbar } from '../appbar/appbar';
import { GcaBadge } from '../badge/badge';
import { GcaDrawer } from '../drawer/drawer';

export interface GcaNavItem {
  readonly label: string;
  readonly link: string | readonly unknown[];
  /** Symbole ou emoji (aucune police d'icônes requise). */
  readonly icon?: string;
  readonly queryParams?: Params;
  /** Compteur affiché sur l'entrée (masqué si 0, null ou undefined). */
  readonly badge?: number | string | null;
  readonly badgeLabel?: string;
  readonly exact?: boolean;
}

/** Pied du menu latéral : `<ng-template gcaSidebarFooter>v1 · aide</ng-template>`. */
@Directive({ selector: 'ng-template[gcaSidebarFooter]' })
export class GcaSidebarFooter {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Gabarit principal : appbar, menu latéral repliable et zone de contenu.
 * Sous `mobileBreakpoint`, le menu devient un `gca-drawer`.
 *
 * ```html
 * <gca-main-layout brand="Atelier" [navItems]="nav()">
 *   <gca-menu gcaAppbarEnd label="M. Laurent" [items]="userMenu" />
 *   <router-outlet />
 * </gca-main-layout>
 * ```
 */
@Component({
  selector: 'gca-main-layout',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, GcaAppbar, GcaBadge, GcaDrawer],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GcaMainLayout {
  private readonly window = inject(DOCUMENT).defaultView;

  readonly brand = input.required<string>();
  readonly brandLink = input<string | readonly unknown[]>('/');
  readonly logo = input<string>();
  readonly navItems = input<readonly GcaNavItem[]>([]);
  readonly navLabel = input('Navigation principale');
  readonly skipLinkLabel = input('Aller au contenu');
  /** Menu latéral réduit aux icônes (bureau). */
  readonly collapsed = model(false);
  readonly mobileBreakpoint = input('960px');

  protected readonly sidebarFooter = contentChild(GcaSidebarFooter);
  protected readonly isMobile = signal(false);
  protected readonly drawerOpen = signal(false);

  constructor() {
    effect((onCleanup) => {
      const query = this.window?.matchMedia?.(`(max-width: ${this.mobileBreakpoint()})`);
      if (!query) return;
      const update = () => {
        this.isMobile.set(query.matches);
        if (!query.matches) this.drawerOpen.set(false);
      };
      update();
      query.addEventListener('change', update);
      onCleanup(() => query.removeEventListener('change', update));
    });
  }

  toggleMenu(): void {
    if (this.isMobile()) {
      this.drawerOpen.update((open) => !open);
    } else {
      this.collapsed.update((collapsed) => !collapsed);
    }
  }

  protected onNavigate(): void {
    if (this.isMobile()) this.drawerOpen.set(false);
  }
}
