import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { GcaButton } from '../button/button';
import { GcaInput } from '../input/input';
import { GcaField } from './field';

@Component({
  imports: [GcaField, GcaInput, FormField, GcaButton],
  template: `
    <gca-field label="Titre" hint="3 à 100 caractères." [count]="model().title.length" [maxLength]="100">
      <input gcaInput [formField]="f.title" />
    </gca-field>
    <gca-field label="Prix" [error]="serverError()">
      <input gcaInput id="price" />
    </gca-field>
    <button gcaButton [loading]="saving()">Enregistrer</button>
  `,
})
class Host {
  readonly model = signal({ title: 'ab' });
  readonly f = form(this.model, (p) => {
    required(p.title, { message: 'Le titre est obligatoire.' });
    minLength(p.title, 3, { message: '3 caractères minimum.' });
  });
  readonly serverError = signal<string | null>(null);
  readonly saving = signal(false);
}

describe('GcaField', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  it('links label and control, shows required mark, hint and counter', async () => {
    const { el } = await setup();
    const [label] = Array.from(el.querySelectorAll('label'));
    const input = el.querySelector('input')!;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(label.querySelector('.required')).not.toBeNull();
    expect(el.querySelector('.hint')?.textContent).toContain('3 à 100');
    expect(el.querySelector('.counter')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('2 / 100');
    expect(input.getAttribute('aria-describedby')).toBe(el.querySelector('.hint')!.id);
  });

  it('shows the Signal Forms error once the control is touched', async () => {
    const { fixture, el } = await setup();
    const input = el.querySelector('input')!;
    expect(el.querySelector('.error')).toBeNull();

    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    const error = el.querySelector('.error')!;
    expect(error.textContent).toContain('3 caractères minimum.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('displays an explicit error and keeps a provided id', async () => {
    const { fixture, el, host } = await setup();
    host.serverError.set('Le prix doit être positif.');
    await fixture.whenStable();
    const price = el.querySelector<HTMLInputElement>('#price')!;
    expect(price.getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelectorAll('label')[1].getAttribute('for')).toBe('price');
    expect(el.textContent).toContain('Le prix doit être positif.');
  });

  it('disables a loading button and marks it busy', async () => {
    const { fixture, el, host } = await setup();
    host.saving.set(true);
    await fixture.whenStable();
    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.spinner')).not.toBeNull();
  });
});
