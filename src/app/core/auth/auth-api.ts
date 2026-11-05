import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as z from 'zod';
import { ApiService } from '../../infra/api/api-service';
import { AuthUser, authUserSchema, LoginResponse, loginResponseSchema } from '../schemas/auth';

export interface Credentials {
  readonly username: string;
  readonly password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApi extends ApiService {
  protected readonly baseUrl = 'auth';

  login(credentials: Credentials): Observable<LoginResponse> {
    return this.post('login', credentials, loginResponseSchema);
  }

  me(): Observable<AuthUser> {
    return this.get('me', authUserSchema);
  }

  logout(): Observable<unknown> {
    return this.post('logout', {}, z.unknown());
  }
}
