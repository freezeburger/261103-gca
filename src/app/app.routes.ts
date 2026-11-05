import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion · Atelier',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login-page'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/app-layout'),
    children: [
      { path: 'products', loadChildren: () => import('./features/products/products.routes') },
      {
        path: 'notifications',
        title: 'Notifications · Atelier',
        loadComponent: () => import('./features/notifications/pages/notifications-page'),
      },
      { path: 'not-found', title: 'Page introuvable · Atelier', loadComponent: () => import('./shell/not-found-page') },
      { path: '', pathMatch: 'full', redirectTo: 'products' },
    ],
  },
  { path: '**', title: 'Page introuvable · Atelier', loadComponent: () => import('./shell/not-found-page') },
];
