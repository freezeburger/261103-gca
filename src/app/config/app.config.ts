import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from '../app.routes';
import { authInterceptor, unauthorizedInterceptor } from '../core/auth/auth-interceptors';
import { apiUrlInterceptor } from '../core/http/api-url-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Ordre : proxification (/api), jeton, puis gestion du 401 au retour.
    provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor, unauthorizedInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
  ],
};
