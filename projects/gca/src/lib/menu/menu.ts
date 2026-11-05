import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gcaUniqueId } from '../core/gca-core';

export interface GcaMenuItem {
  readonly label: string;
  readonly icon?: string;
  readonly link?: string | readonly unknown[];
  readonly command?: () => void;
  readonly danger?: boolean;
  readonly separator?: boolean;
}

/**
 * Menu déroulant (menu utilisateur, actions secondaires).
 * Se ferme sur Échap, clic extérieur ou sélection.
 *
 * `<gca-menu label="M. Laurent" icon="👤" [items]="[{ label: 'Déconnexion', command: logout }]" />`
 */
@Component({
  selector: 'gca-menu',
  imports: [RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close(true)',
  },
})
export class GcaMenu {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly items = input.required<readonly GcaMenuItem[]>();
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly align = input<'start' | 'end'>('end');

  protected readonly open = signal(false);
  protected readonly menuId = gcaUniqueId('gca-menu');

  toggle(): void {
    this.open.update((open) => !open);
  }

  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.host.querySelector<HTMLElement>('.trigger')?.focus();
  }

  protected select(item: GcaMenuItem): void {
    item.command?.();
    this.close();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.contains(event.target as Node)) this.close();
  }
}
