import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_REQUEST } from '../../infra/api/api-service';
import { API_BASE_URL, apiUrlInterceptor } from '../http/api-url-interceptor';
import { authInterceptor, unauthorizedInterceptor } from './auth-interceptors';
import { AuthService, SESSION_STORAGES, SessionStorages } from './auth-service';

const apiRequest = { context: new HttpContext().set(API_REQUEST, true) };

function storedSession(token: string): string {
  return JSON.stringify({
    token,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    user: { id: 1, name: 'Marie Laurent', email: 'marie.laurent@atelier.dev' },
  });
}

describe('HTTP interceptors', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let storages: SessionStorages;

  function setup({ token, baseUrl }: { token?: string; baseUrl?: string } = {}): void {
    storages = { persistent: new MemoryStorage(), session: new MemoryStorage() };
    if (token) storages.persistent.setItem('atelier.session', storedSession(token));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor, unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: SESSION_STORAGES, useValue: storages },
        ...(baseUrl ? [{ provide: API_BASE_URL, useValue: baseUrl }] : []),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  afterEach(() => backend.verify());

  it('prefixes API requests with /api by default (proxification)', () => {
    setup();
    http.get('products/1', apiRequest).subscribe();
    backend.expectOne('/api/products/1').flush({});
  });

  it('uses the configured API_BASE_URL', () => {
    setup({ baseUrl: 'https://api.example/v1/' });
    http.get('/products', apiRequest).subscribe();
    backend.expectOne('https://api.example/v1/products').flush({});
  });

  it('adds the bearer token to API requests when a session exists', () => {
    setup({ token: 'abc' });
    http.get('products', apiRequest).subscribe();
    const req = backend.expectOne('/api/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('leaves other requests untouched and never sends them the token', () => {
    setup({ token: 'abc' });
    http.get('https://cdn.example/x.json').subscribe();
    const req = backend.expectOne('https://cdn.example/x.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('closes the session and redirects to /login on 401', async () => {
    setup({ token: 'expired' });
    const auth = TestBed.inject(AuthService);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(auth.isAuthenticated()).toBe(true);

    const result = firstValueFrom(http.get('products', apiRequest));
    backend.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(auth.isAuthenticated()).toBe(false);
    expect(storages.persistent.getItem('atelier.session')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('does not redirect on 401 without a session (failed login)', async () => {
    setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    const result = firstValueFrom(http.post('auth/login', {}, apiRequest));
    backend.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(navigate).not.toHaveBeenCalled();
  });
});

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}
