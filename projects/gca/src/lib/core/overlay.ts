import { DestroyRef, effect, ElementRef, inject, Signal } from '@angular/core';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Maintient la tabulation à l'intérieur de `container`. */
export function gcaTrapTab(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') return;
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (items.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = container.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Place le focus dans le panneau à l'ouverture (premier `[autofocus]` sinon le
 * panneau) et le rend à l'élément d'origine à la fermeture.
 */
export function gcaFocusOnOpen(panel: Signal<ElementRef<HTMLElement> | undefined>): void {
  let previous: HTMLElement | null = null;
  const restore = () => {
    previous?.focus?.();
    previous = null;
  };
  effect(() => {
    const element = panel()?.nativeElement;
    if (element) {
      previous = element.ownerDocument.activeElement as HTMLElement | null;
      (element.querySelector<HTMLElement>('[autofocus]') ?? element).focus();
    } else {
      restore();
    }
  });
  inject(DestroyRef).onDestroy(restore);
}
