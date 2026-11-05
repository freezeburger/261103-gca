import { computed, inject, Injectable, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, Observable } from 'rxjs';
import { AuthService } from '../auth/auth-service';
import { AppNotification, NewNotification } from '../schemas/notifications';
import { NotificationApi } from './notification-api';

export type { AppNotification, NewNotification, NotificationLevel } from '../schemas/notifications';

/**
 * Notifications persistantes de l'utilisateur connecté.
 *
 * Chargées à l'ouverture de session et vidées à sa fermeture ; les modifications sont appliquées
 * immédiatement à l'écran puis envoyées au serveur. En cas d'échec, la liste est rechargée.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(NotificationApi);
  private readonly auth = inject(AuthService);

  private readonly remote = rxResource({
    params: () => this.auth.user()?.id,
    stream: () => this.api.list(),
  });

  private readonly _items = linkedSignal<readonly AppNotification[]>(() =>
    this.remote.hasValue() ? this.remote.value() : [],
  );

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => n.readAt === null).length);
  readonly isLoading = this.remote.isLoading;
  readonly error = this.remote.error;

  add(notification: NewNotification): void {
    this.sync(this.api.create(notification), (created) => this._items.update((items) => [created, ...items]));
  }

  markAsRead(id: string): void {
    const now = new Date().toISOString();
    if (!this._items().some((n) => n.id === id && n.readAt === null)) return;
    this._items.update((items) => items.map((n) => (n.id === id ? { ...n, readAt: now } : n)));
    this.sync(this.api.markAsRead(id, now));
  }

  markAllAsRead(): void {
    const now = new Date().toISOString();
    const unread = this._items().filter((n) => n.readAt === null);
    if (unread.length === 0) return;
    this._items.update((items) => items.map((n) => (n.readAt === null ? { ...n, readAt: now } : n)));
    this.sync(forkJoin(unread.map((n) => this.api.markAsRead(n.id, now))));
  }

  remove(id: string): void {
    this._items.update((items) => items.filter((n) => n.id !== id));
    this.sync(this.api.remove(id));
  }

  reload(): void {
    this.remote.reload();
  }

  private sync<T>(request: Observable<T>, onSuccess: (value: T) => void = () => undefined): void {
    if (!this.auth.isAuthenticated()) return;
    request.subscribe({ next: onSuccess, error: () => this.remote.reload() });
  }
}
