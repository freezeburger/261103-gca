import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GcaConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { GcaConfirmService } from '../confirm-dialog/confirm.service';
import { GcaToast } from './toast';
import { GcaToastService } from './toast.service';

@Component({
  imports: [GcaToast, GcaConfirmDialog],
  template: '<gca-toast /><gca-confirm-dialog />',
})
class Host {}

describe('GcaToast and GcaConfirmDialog', () => {
  afterEach(() => vi.useRealTimers());

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return {
      fixture,
      el: fixture.nativeElement as HTMLElement,
      toasts: TestBed.inject(GcaToastService),
      confirm: TestBed.inject(GcaConfirmService),
    };
  }

  it('shows a toast and dismisses it after its life', async () => {
    const { fixture, el, toasts } = await setup();
    vi.useFakeTimers();
    toasts.success('Produit enregistré', '« Crème » a été mis à jour.');
    fixture.detectChanges();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Produit enregistré');

    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    expect(toasts.messages()).toHaveLength(0);
    expect(el.querySelector('[role="status"]')).toBeNull();
  });

  it('keeps errors displayed and runs a toast action once', async () => {
    const { fixture, el, toasts } = await setup();
    const undo = vi.fn();
    toasts.error('Échec');
    toasts.show({ summary: 'Notification supprimée.', action: { label: 'Annuler', run: undo } });
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')).not.toBeNull();

    el.querySelector<HTMLButtonElement>('.action')!.click();
    await fixture.whenStable();
    expect(undo).toHaveBeenCalledOnce();
    expect(toasts.messages().map((m) => m.summary)).toEqual(['Échec']);
  });

  it('resolves confirmations from the dialog buttons and Escape', async () => {
    const { fixture, el, confirm } = await setup();
    const accepted = confirm.confirm({ header: 'Quitter sans enregistrer ?', acceptLabel: 'Quitter' });
    await fixture.whenStable();
    const dialog = el.querySelector('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain('Quitter sans enregistrer ?');
    expect(document.activeElement?.textContent?.trim()).toBe('Quitter');

    Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Quitter')!.click();
    await expect(accepted).resolves.toBe(true);

    const rejected = confirm.confirm({ header: 'Supprimer ?' });
    await fixture.whenStable();
    el.querySelector('[role="alertdialog"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await expect(rejected).resolves.toBe(false);
    await fixture.whenStable();
    expect(el.querySelector('[role="alertdialog"]')).toBeNull();
  });
});
