import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GcaImage } from '../image/image';
import { GcaSearchInput } from './search-input';

@Component({
  imports: [GcaSearchInput, GcaImage],
  template: `
    <gca-search-input [(value)]="q" (search)="terms.push($event)" />
    <gca-image [src]="src()" alt="Crème" />
  `,
})
class Host {
  readonly q = signal('');
  readonly src = signal('broken.png');
  readonly terms: string[] = [];
}

describe('GcaSearchInput and GcaImage', () => {
  afterEach(() => vi.useRealTimers());

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('debounces search and ignores terms shorter than minLength', async () => {
    const { fixture, el, host } = await setup();
    vi.useFakeTimers();
    const input = el.querySelector('input')!;

    type(input, 'c');
    vi.advanceTimersByTime(300);
    type(input, 'cr');
    vi.advanceTimersByTime(200);
    type(input, 'crème');
    vi.advanceTimersByTime(300);
    expect(host.terms).toEqual(['crème']);
    expect(host.q()).toBe('crème');

    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.clear')!.click();
    expect(host.terms).toEqual(['crème', '']);
    expect(host.q()).toBe('');
  });

  it('emits immediately on Enter', async () => {
    const { el, host } = await setup();
    vi.useFakeTimers();
    const input = el.querySelector('input')!;
    type(input, 'spf');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.terms).toEqual(['spf']);
    vi.advanceTimersByTime(300);
    expect(host.terms).toEqual(['spf']);
  });

  it('falls back when the image fails, then retries on a new src', async () => {
    const { fixture, el, host } = await setup();
    el.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.fallback')?.getAttribute('aria-label')).toBe('Crème');

    host.src.set('other.png');
    await fixture.whenStable();
    expect(el.querySelector('img')?.getAttribute('src')).toBe('other.png');
  });
});
