import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GcaToastService } from 'gca';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('hosts the router outlet, toasts and confirmation dialog', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('gca-toast')).not.toBeNull();
    expect(element.querySelector('gca-confirm-dialog')).not.toBeNull();
  });

  it('renders toasts raised by the application', async () => {
    const fixture = TestBed.createComponent(App);
    TestBed.inject(GcaToastService).success('Produit enregistré');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Produit enregistré');
  });
});
