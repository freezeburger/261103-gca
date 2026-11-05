import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { GCA_SEVERITY_ICONS, GcaSeverity } from '../core/gca-core';

/**
 * Bannière en ligne (erreur globale, avertissement, succès).
 * `role="alert"` pour `danger` / `warn`, `role="status"` sinon. Focalisable via `focus()`.
 *
 * `<gca-message severity="danger" summary="Identifiant ou mot de passe incorrect.">Vérifiez vos informations.</gca-message>`
 */
@Component({
  selector: 'gca-message',
  templateUrl: './message.html',
  styleUrl: './message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '-1',
    '[class]': '"gca-" + severity()',
    '[attr.role]': 'role()',
  },
})
export class GcaMessage {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly severity = input<GcaSeverity>('info');
  readonly summary = input<string>();
  readonly icon = input<string>();
  readonly closable = input(false);
  readonly closeLabel = input('Fermer');
  readonly closed = output<void>();

  protected readonly role = computed(() =>
    this.severity() === 'danger' || this.severity() === 'warn' ? 'alert' : 'status',
  );
  protected readonly glyph = computed(() => this.icon() ?? GCA_SEVERITY_ICONS[this.severity()]);

  focus(): void {
    this.host.focus();
  }
}
