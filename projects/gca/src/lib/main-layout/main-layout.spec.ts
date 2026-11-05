import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GcaDrawer } from '../drawer/drawer';
import { GcaMainLayout, GcaNavItem, GcaSidebarFooter } from './main-layout';

@Component({
  imports: [GcaMainLayout, GcaSidebarFooter, GcaDrawer],
  template: `
    <gca-main-layout brand="Atelier" [navItems]="nav()" [(collapsed)]="collapsed">
      <span gcaAppbarEnd class="user">M. Laurent</span>
      <ng-template gcaSidebarFooter>v1 · aide</ng-template>
      <p class="page">Contenu</p>
      <gca-drawer [(visible)]="filters" header="Filtres" position="right">Corps</gca-drawer>
    </gca-main-layout>
  `,
})
class Host {
  readonly nav = signal<GcaNavItem[]>([
    { label: 'Produits', link: '/products', icon: '▦' },
    { label: 'Notifications', link: '/notifications', icon: '🔔', badge: 3, badgeLabel: 'non lues' },
  ]);
  readonly collapsed = signal(false);
  readonly filters = signal(false);
}

describe('GcaMainLayout and GcaDrawer', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  it('renders appbar slots, navigation, badge, footer and content', async () => {
    const { el } = await setup();
    expect(el.querySelector('.bar .end .user')?.textContent).toBe('M. Laurent');
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.sidebar nav a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/products', '/notifications']);
    expect(el.querySelector('gca-badge')?.getAttribute('aria-label')).toBe('3 non lues');
    expect(el.querySelector('.sidebar-footer')?.textContent).toContain('v1 · aide');
    expect(el.querySelector('main#gca-main .page')).not.toBeNull();
  });

  it('collapses the sidebar from the menu button on desktop', async () => {
    const { fixture, el, host } = await setup();
    const burger = el.querySelector<HTMLButtonElement>('.burger')!;
    expect(burger.getAttribute('aria-expanded')).toBe('true');
    burger.click();
    await fixture.whenStable();
    expect(host.collapsed()).toBe(true);
    expect(el.querySelector('.sidebar')!.classList).toContain('collapsed');
    expect(burger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens a drawer and closes it with Escape or the mask', async () => {
    const { fixture, el, host } = await setup();
    expect(el.querySelector('aside.right')).toBeNull();

    host.filters.set(true);
    await fixture.whenStable();
    const panel = el.querySelector<HTMLElement>('aside.right')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.textContent).toContain('Corps');
    expect(document.activeElement).toBe(panel);

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(host.filters()).toBe(false);

    host.filters.set(true);
    await fixture.whenStable();
    el.querySelector<HTMLElement>('.mask')!.click();
    await fixture.whenStable();
    expect(host.filters()).toBe(false);
  });
});
