import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, SESSION_STORAGES } from '../auth/auth-service';
import { AppNotification } from '../schemas/notifications';
import { NotificationStore } from './notification-store';

const unread: AppNotification = {
  id: 'n1',
  level: 'warning',
  title: 'Stock faible',
  message: 'Sous le seuil',
  createdAt: '2026-11-04T08:30:00.000Z',
  readAt: null,
};
const read: AppNotification = { ...unread, id: 'n2', level: 'info', readAt: '2026-11-04T09:00:00.000Z' };

describe('NotificationStore', () => {
  let backend: HttpTestingController;
  let store: NotificationStore;
  let auth: AuthService;

  beforeEach(async () => {
    const data = new Map<string, string>([
      [
        'atelier.session',
        JSON.stringify({
          token: 'tok',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          user: { id: 1, name: 'Marie Laurent', email: 'marie.laurent@atelier.dev' },
        }),
      ],
    ]);
    const storage = {
      length: 0,
      clear: () => data.clear(),
      getItem: (key: string) => data.get(key) ?? null,
      key: () => null,
      removeItem: (key: string) => void data.delete(key),
      setItem: (key: string, value: string) => void data.set(key, value),
    } satisfies Storage;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SESSION_STORAGES, useValue: { persistent: storage, session: storage } },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    store = TestBed.inject(NotificationStore);

    // Le store charge les notifications de l'utilisateur connecté.
    TestBed.tick();
    const req = backend.expectOne((r) => r.url === 'notifications');
    expect(req.request.params.get('_sort')).toBe('createdAt');
    req.flush([unread, read]);
    await TestBed.inject(ApplicationRef).whenStable();
  });

  afterEach(() => backend.verify());

  it('loads the items and counts unread ones', () => {
    expect(store.items().map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(store.unreadCount()).toBe(1);
  });

  it('marks as read optimistically and persists with PATCH', () => {
    store.markAsRead('n1');
    expect(store.unreadCount()).toBe(0);
    const req = backend.expectOne('notifications/n1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.readAt).toEqual(expect.any(String));
    req.flush({ ...unread, readAt: req.request.body.readAt });
  });

  it('ignores marking an already read notification', () => {
    store.markAsRead('n2');
    backend.expectNone('notifications/n2');
  });

  it('adds a notification returned by the server', () => {
    store.add({ level: 'success', title: 'Produit enregistré', message: 'Crème' });
    const req = backend.expectOne('notifications');
    expect(req.request.method).toBe('POST');
    req.flush({ ...unread, id: 'n3', level: 'success', title: 'Produit enregistré', message: 'Crème' });
    expect(store.items()[0].id).toBe('n3');
    expect(store.unreadCount()).toBe(2);
  });

  it('removes optimistically and reloads the list when the server fails', async () => {
    store.remove('n1');
    expect(store.items().map((n) => n.id)).toEqual(['n2']);
    backend.expectOne('notifications/n1').flush(null, { status: 500, statusText: 'Server Error' });

    TestBed.tick();
    backend.expectOne((r) => r.url === 'notifications').flush([unread, read]);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.items().map((n) => n.id)).toEqual(['n1', 'n2']);
  });

  it('empties the list when the session is closed', async () => {
    auth.clear();
    TestBed.tick();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.items()).toEqual([]);
  });
});
