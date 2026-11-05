import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { AuthSession, authSessionSchema, AuthUser } from '../schemas/auth';
import { AuthApi, Credentials } from './auth-api';

export interface LoginRequest extends Credentials {
  /** « Rester connecté » : session conservée dans `localStorage` plutôt que `sessionStorage`. */
  readonly remember: boolean;
}

export interface SessionStorages {
  readonly persistent: Storage;
  readonly session: Storage;
}

/** Stockages de la session, remplaçables en test. */
export const SESSION_STORAGES = new InjectionToken<SessionStorages>('SESSION_STORAGES', {
  providedIn: 'root',
  factory: () => ({ persistent: localStorage, session: sessionStorage }),
});

const STORAGE_KEY = 'atelier.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly storages = inject(SESSION_STORAGES);
  private readonly session = signal<AuthSession | null>(this.restore());

  readonly user = computed<AuthUser | null>(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  login({ username, password, remember }: LoginRequest): Observable<AuthUser> {
    return this.api.login({ username, password }).pipe(
      tap((session) => this.open(session, remember)),
      map((session) => session.user),
    );
  }

  /** Révoque le jeton côté serveur (au mieux) puis ferme la session locale. */
  logout(): void {
    if (this.session()) {
      // Souscrit avant la fermeture : l'interceptor lit encore le jeton.
      this.api.logout().subscribe({ error: () => undefined });
    }
    this.clear();
  }

  /** Ferme la session locale sans appel serveur (jeton déjà refusé). */
  clear(): void {
    this.storages.persistent.removeItem(STORAGE_KEY);
    this.storages.session.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private open(session: AuthSession, remember: boolean): void {
    this.clear();
    (remember ? this.storages.persistent : this.storages.session).setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  private restore(): AuthSession | null {
    for (const storage of [this.storages.session, this.storages.persistent]) {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) continue;
      try {
        const session = authSessionSchema.parse(JSON.parse(raw));
        if (Date.parse(session.expiresAt) > Date.now()) {
          return session;
        }
      } catch {
        // Session illisible : ignorée puis supprimée.
      }
      storage.removeItem(STORAGE_KEY);
    }
    return null;
  }
}
