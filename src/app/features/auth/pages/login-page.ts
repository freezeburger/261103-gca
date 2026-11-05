import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, inject, Injector, input, signal, viewChild } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { GcaButton, GcaCard, GcaCheckbox, GcaField, GcaInput, GcaMessage, GcaPasswordToggle } from 'gca';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth-service';

interface LoginModel {
  email: string;
  password: string;
  remember: boolean;
}

@Component({
  selector: 'app-login-page',
  imports: [FormRoot, FormField, GcaButton, GcaCard, GcaCheckbox, GcaField, GcaInput, GcaMessage, GcaPasswordToggle],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export default class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly banner = viewChild(GcaMessage);

  /** Paramètre d'URL `?returnUrl=` reçu via withComponentInputBinding(). */
  readonly returnUrl = input<string>();

  protected readonly failure = signal<string | null>(null);
  protected readonly model = signal<LoginModel>({ email: '', password: '', remember: false });
  protected readonly loginForm = form(
    this.model,
    (p) => {
      required(p.email, { message: "L'adresse e-mail est obligatoire." });
      email(p.email, { message: "Format d'adresse e-mail invalide." });
      required(p.password, { message: 'Le mot de passe est obligatoire.' });
    },
    {
      submission: {
        action: async (f) => {
          const { email, password, remember } = f().value();
          this.failure.set(null);
          try {
            await firstValueFrom(this.auth.login({ username: email.trim(), password, remember }));
            await this.router.navigateByUrl(this.safeReturnUrl());
          } catch (error) {
            this.model.update((model) => ({ ...model, password: '' }));
            this.failure.set(
              error instanceof HttpErrorResponse && error.status === 401
                ? 'Identifiant ou mot de passe incorrect.'
                : 'Service indisponible, réessayez plus tard.',
            );
            afterNextRender(() => this.banner()?.focus(), { injector: this.injector });
          }
          return undefined;
        },
      },
    },
  );

  /** N'accepte qu'un chemin interne pour éviter une redirection ouverte. */
  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url?.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : '/products';
  }
}
