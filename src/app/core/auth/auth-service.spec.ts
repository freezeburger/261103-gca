import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authGuard, guestGuard } from './auth-guards';
import { AuthService, SESSION_STORAGES } from './auth-service';

const session = {
  token: 'tok',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: { id: 1, name: 'Marie Laurent', email: 'marie.laurent@atelier.dev' },
};

describe('AuthService and guards', () => {
  let persistent: Storage;
  let sessionStorage: Storage;
  let backend: HttpTestingController;

  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SESSION_STORAGES, useValue: { persistent, session: sessionStorage } },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    persistent = createStorage();
    sessionStorage = createStorage();
  });

  afterEach(() => backend.verify());

  it('starts signed out', () => {
    const auth = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.user()).toBeNull();
    expect(auth.token()).toBeNull();
  });

  it('logs in and keeps the session in sessionStorage by default', async () => {
    const auth = setup();
    const user = firstValueFrom(auth.login({ username: 'marie.laurent@atelier.dev', password: 'pw', remember: false }));
    const req = backend.expectOne('auth/login');
    expect(req.request.body).toEqual({ username: 'marie.laurent@atelier.dev', password: 'pw' });
    req.flush(session);

    expect(await user).toEqual(session.user);
    expect(auth.token()).toBe('tok');
    expect(sessionStorage.getItem('atelier.session')).not.toBeNull();
    expect(persistent.getItem('atelier.session')).toBeNull();
  });

  it('keeps the session in localStorage with "remember me"', async () => {
    const auth = setup();
    const user = firstValueFrom(auth.login({ username: 'u', password: 'p', remember: true }));
    backend.expectOne('auth/login').flush(session);
    await user;
    expect(persistent.getItem('atelier.session')).not.toBeNull();
  });

  it('restores a valid stored session and drops an expired or invalid one', () => {
    persistent.setItem('atelier.session', JSON.stringify(session));
    expect(setup().user()?.name).toBe('Marie Laurent');

    TestBed.resetTestingModule();
    persistent.setItem('atelier.session', JSON.stringify({ ...session, expiresAt: '2000-01-01T00:00:00.000Z' }));
    sessionStorage.setItem('atelier.session', '{not json');
    expect(setup().isAuthenticated()).toBe(false);
    expect(persistent.getItem('atelier.session')).toBeNull();
    expect(sessionStorage.getItem('atelier.session')).toBeNull();
  });

  it('logs out: revokes the token server-side and clears the session', () => {
    persistent.setItem('atelier.session', JSON.stringify(session));
    const auth = setup();
    auth.logout();
    const req = backend.expectOne('auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(persistent.getItem('atelier.session')).toBeNull();
  });

  it('authGuard redirects to /login with returnUrl when signed out', () => {
    setup();
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/products?q=x' } as RouterStateSnapshot),
    );
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fproducts%3Fq%3Dx');
  });

  it('authGuard allows and guestGuard redirects when signed in', () => {
    persistent.setItem('atelier.session', JSON.stringify(session));
    setup();
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/products' } as RouterStateSnapshot;
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
    const guest = TestBed.runInInjectionContext(() => guestGuard(route, state));
    expect(TestBed.inject(Router).serializeUrl(guest as UrlTree)).toBe('/products');
  });

  it('guestGuard allows the login page when signed out', () => {
    setup();
    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, { url: '/login' } as RouterStateSnapshot),
    );
    expect(result).toBe(true);
  });
});

function createStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}
