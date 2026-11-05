import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GcaPageEvent, GcaPaginator } from '../paginator/paginator';
import { GcaSort, GcaSortHeader, GcaTable } from './table';

@Component({
  imports: [GcaTable, GcaSortHeader, GcaPaginator],
  template: `
    <table gcaTable [(sort)]="sort">
      <thead>
        <tr><th gcaSortHeader="title">Titre</th><th gcaSortHeader="price">Prix</th></tr>
      </thead>
    </table>
    <gca-paginator [total]="128" [(page)]="page" [(pageSize)]="size" (paginate)="events.push($event)" />
  `,
})
class Host {
  readonly sort = signal<GcaSort | null>({ field: 'title', order: 'asc' });
  readonly page = signal(1);
  readonly size = signal(20);
  readonly events: GcaPageEvent[] = [];
}

describe('GcaTable and GcaPaginator', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  it('toggles sort order and exposes aria-sort', async () => {
    const { fixture, el, host } = await setup();
    const [title, price] = Array.from(el.querySelectorAll('th'));
    expect(title.getAttribute('aria-sort')).toBe('ascending');
    expect(price.getAttribute('aria-sort')).toBe('none');

    title.querySelector('button')!.click();
    await fixture.whenStable();
    expect(host.sort()).toEqual({ field: 'title', order: 'desc' });
    expect(title.getAttribute('aria-sort')).toBe('descending');

    price.querySelector('button')!.click();
    await fixture.whenStable();
    expect(host.sort()).toEqual({ field: 'price', order: 'asc' });
    expect(title.getAttribute('aria-sort')).toBe('none');
  });

  it('summarises the range and respects page bounds', async () => {
    const { fixture, el, host } = await setup();
    const summary = () => el.querySelector('.summary')!.textContent!.trim();
    const [previous, next] = Array.from(el.querySelectorAll<HTMLButtonElement>('button.nav'));
    expect(summary()).toBe('1–20 sur 128');
    expect(previous.disabled).toBe(true);

    next.click();
    await fixture.whenStable();
    expect(host.page()).toBe(2);
    expect(host.events).toEqual([{ page: 2, pageSize: 20 }]);
    expect(summary()).toBe('21–40 sur 128');

    host.page.set(7);
    await fixture.whenStable();
    expect(summary()).toBe('121–128 sur 128');
    expect(next.disabled).toBe(true);
    expect(el.querySelector('[aria-current="page"]')!.textContent!.trim()).toBe('7');
    expect(el.querySelectorAll('.gap').length).toBe(1);
  });

  it('returns to page 1 when the page size changes', async () => {
    const { fixture, el, host } = await setup();
    host.page.set(3);
    await fixture.whenStable();
    const select = el.querySelector('select')!;
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(host.size()).toBe(50);
    expect(host.page()).toBe(1);
    expect(host.events).toEqual([{ page: 1, pageSize: 50 }]);
  });
});
