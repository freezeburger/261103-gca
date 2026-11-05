import { HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { API_REQUEST } from '../../infra/api/api-service';

/**
 * Préfixe des requêtes backend. En développement, `ng serve` relaie `/api` vers json-server
 * (`proxy.conf.json`) ; un déploiement fournit sa propre valeur sans toucher aux services d'API.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

/** Proxification : `products/12` → `/api/products/12`, uniquement pour les requêtes d'`ApiService`. */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(API_REQUEST)) {
    return next(req);
  }
  const base = inject(API_BASE_URL).replace(/\/+$/, '');
  const path = req.url.replace(/^\/+/, '');
  return next(req.clone({ url: `${base}/${path}` }));
};
