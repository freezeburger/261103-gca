import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, RedirectCommand, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { ProductSchema } from '../../core/schemas/products';
import { ProductApi } from './product-api';
import { productResolver } from './product-resolver';

const product: ProductSchema = {
  id: 12,
  title: 'Crème visage',
  description: 'Soin quotidien',
  price: 12.5,
  thumbnail: 'https://cdn.example/12.webp',
};

describe('Products', () => {
  let api: ProductApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ProductApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('maps the search query to json-server parameters and reads the total', async () => {
    const result = firstValueFrom(api.search({ q: ' crème ', page: 3, size: 20, sortBy: 'price', order: 'desc' }));
    const req = backend.expectOne((r) => r.url === 'products');
    expect(req.request.params.toString()).toBe('q=cr%C3%A8me&_page=3&_limit=20&_sort=price&_order=desc');
    req.flush([product], { headers: { 'X-Total-Count': '41' } });
    expect(await result).toEqual({ products: [product], total: 41 });
  });

  it('omits empty search and sort parameters', () => {
    api.search({ q: '', page: 1, size: 20 }).subscribe();
    const req = backend.expectOne((r) => r.url === 'products');
    expect(req.request.params.toString()).toBe('_page=1&_limit=20');
    req.flush([]);
  });

  it('updates a product with PATCH', () => {
    const { id: _id, ...changes } = product;
    api.update(12, changes).subscribe();
    const req = backend.expectOne('products/12');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(changes);
    req.flush(product);
  });

  function resolve(id: string): unknown {
    const route = { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => productResolver(route, {} as RouterStateSnapshot));
  }

  it('resolves the product by its numeric id', async () => {
    const result = resolve('12');
    expect(isObservable(result)).toBe(true);
    const value = firstValueFrom(result as Observable<unknown>);
    backend.expectOne('products/12').flush(product);
    expect(await value).toEqual(product);
  });

  it('redirects to /not-found for an invalid id without calling the API', () => {
    const result = resolve('abc');
    expect(result).toBeInstanceOf(RedirectCommand);
    expect((result as RedirectCommand).redirectTo.toString()).toBe('/not-found');
  });

  it('redirects to /not-found on 404 and propagates other errors', async () => {
    const missing = firstValueFrom(resolve('99') as Observable<unknown>);
    backend.expectOne('products/99').flush(null, { status: 404, statusText: 'Not Found' });
    expect(await missing).toBeInstanceOf(RedirectCommand);

    const failing = firstValueFrom(resolve('5') as Observable<unknown>);
    backend.expectOne('products/5').flush(null, { status: 500, statusText: 'Server Error' });
    await expect(failing).rejects.toMatchObject({ status: 500 });
  });
});
