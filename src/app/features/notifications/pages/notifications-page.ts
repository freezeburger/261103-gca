import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  GcaButton,
  GcaCard,
  GcaEmptyState,
  GcaSelect,
  GcaSelectButton,
  GcaSelectButtonOption,
  GcaSeverity,
  GcaSkeleton,
  GcaTag,
  GcaToastService,
} from 'gca';
import { AppNotification, NotificationLevel, NotificationStore } from '../../../core/notifications/notification-store';

type Status = 'all' | 'unread' | 'read';

const LEVELS: Record<NotificationLevel, { label: string; severity: GcaSeverity }> = {
  error: { label: 'ERREUR', severity: 'danger' },
  warning: { label: 'AVERT.', severity: 'warn' },
  success: { label: 'SUCCÈS', severity: 'success' },
  info: { label: 'INFO', severity: 'info' },
};
const PAGE_SIZE = 20;
const UNDO_DELAY = 5000;

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, RouterLink, GcaButton, GcaCard, GcaEmptyState, GcaSelect, GcaSelectButton, GcaSkeleton, GcaTag],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export default class NotificationsPage implements OnDestroy {
  protected readonly store = inject(NotificationStore);
  private readonly toasts = inject(GcaToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  // Paramètres d'URL reçus via withComponentInputBinding()
  readonly statusParam = input<Status | undefined>(undefined, { alias: 'status' });
  readonly levelParam = input<NotificationLevel | undefined>(undefined, { alias: 'level' });

  protected readonly levels = LEVELS;
  protected readonly levelEntries = Object.entries(LEVELS) as [NotificationLevel, (typeof LEVELS)[NotificationLevel]][];
  protected readonly limit = signal(PAGE_SIZE);
  private readonly pendingRemoval = signal<ReadonlySet<string>>(new Set());

  protected readonly status = computed<Status>(() => this.statusParam() ?? 'all');
  protected readonly level = computed(() => this.levelParam() ?? null);

  protected readonly visible = computed(() => this.store.items().filter((n) => !this.pendingRemoval().has(n.id)));
  protected readonly unreadCount = computed(() => this.visible().filter((n) => !n.readAt).length);
  protected readonly statusOptions = computed<GcaSelectButtonOption<Status>[]>(() => {
    const total = this.visible().length;
    const unread = this.unreadCount();
    return [
      { label: 'Toutes', value: 'all', count: total },
      { label: 'Non lues', value: 'unread', count: unread },
      { label: 'Lues', value: 'read', count: total - unread },
    ];
  });
  protected readonly filtered = computed(() =>
    this.visible()
      .filter((n) => this.status() === 'all' || (this.status() === 'unread') === !n.readAt)
      .filter((n) => !this.level() || n.level === this.level())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  protected readonly groups = computed(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 86_400_000;
    const groups = [
      { label: "Aujourd'hui", items: [] as AppNotification[] },
      { label: 'Hier', items: [] as AppNotification[] },
      { label: 'Plus ancien', items: [] as AppNotification[] },
    ];
    for (const n of this.filtered().slice(0, this.limit())) {
      const time = new Date(n.createdAt).getTime();
      groups[time >= today ? 0 : time >= yesterday ? 1 : 2].items.push(n);
    }
    return groups.filter((group) => group.items.length > 0);
  });
  protected readonly emptyMessage = computed(() =>
    this.status() === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification.',
  );

  protected navigate(queryParams: Params): void {
    this.limit.set(PAGE_SIZE);
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  protected changeLevel(event: Event): void {
    this.navigate({ level: (event.target as HTMLSelectElement).value || null });
  }

  protected loadMore(): void {
    this.limit.update((limit) => limit + PAGE_SIZE);
  }

  /** Suppression différée de 5 s, annulable depuis le toast. */
  protected remove(n: AppNotification): void {
    this.setPending(n.id, true);
    this.timers.set(
      n.id,
      setTimeout(() => this.commitRemoval(n.id), UNDO_DELAY),
    );
    this.toasts.show({
      summary: 'Notification supprimée.',
      life: UNDO_DELAY,
      action: {
        label: 'Annuler',
        run: () => {
          clearTimeout(this.timers.get(n.id));
          this.timers.delete(n.id);
          this.setPending(n.id, false);
        },
      },
    });
  }

  /** En quittant l'écran, les suppressions en attente sont confirmées. */
  ngOnDestroy(): void {
    for (const id of [...this.timers.keys()]) {
      this.commitRemoval(id);
    }
  }

  private commitRemoval(id: string): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.store.remove(id);
    this.setPending(id, false);
  }

  private setPending(id: string, pending: boolean): void {
    this.pendingRemoval.update((ids) => {
      const next = new Set(ids);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
