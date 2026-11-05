import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { GcaMainLayout, GcaMenu, GcaMenuItem, GcaNavItem, GcaProgressBar, GcaSidebarFooter } from 'gca';
import { AuthService } from '../core/auth/auth-service';
import { NotificationStore } from '../core/notifications/notification-store';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, GcaMainLayout, GcaMenu, GcaProgressBar, GcaSidebarFooter],
  template: `
    @if (router.currentNavigation()) {
      <gca-progress-bar fixed ariaLabel="Chargement de la page" />
    }
    <gca-main-layout brand="Atelier" brandLink="/products" [navItems]="nav()">
      <gca-menu gcaAppbarEnd icon="👤" [label]="userName()" [items]="userMenu" />
      <ng-template gcaSidebarFooter>Atelier · v1</ng-template>
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
