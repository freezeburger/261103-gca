import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../infra/api/api-service';
import {
  AppNotification,
  NewNotification,
  notificationListSchema,
  notificationSchema,
} from '../schemas/notifications';

/** Notifications de l'utilisateur connecté (cloisonnées par le serveur). */
@Injectable({ providedIn: 'root' })
export class NotificationApi extends ApiService {
  protected readonly baseUrl = 'notifications';

  list(): Observable<readonly AppNotification[]> {
    return this.getPage('', notificationListSchema, { _sort: 'createdAt', _order: 'desc' }).pipe(
      map((page) => page.items),
    );
  }

  create(notification: NewNotification): Observable<AppNotification> {
    return this.post('', notification, notificationSchema);
  }

  markAsRead(id: string, readAt: string): Observable<AppNotification> {
    return this.patch(id, { readAt }, notificationSchema);
  }

  remove(id: string): Observable<void> {
    return this.delete(id);
  }
}
