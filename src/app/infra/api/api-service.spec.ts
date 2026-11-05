import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import * as z from 'zod';
import { API_REQUEST, ApiPage, ApiPath, ApiQuery, ApiService } from './api-service';

const itemSchema = z.object({ id: z.number(), name: z.string() });
type Item = z.infer<typeof itemSchema>;

@Injectable({ providedIn: 'root' })
class TestApi extends ApiService {
  protected readonly baseUrl = 'items/';

  read(path: ApiPath, query?: ApiQuery): Observable<Item> {
    return this.get(path, itemSchema, query);
  }
  page(query?: ApiQuery): Observable<ApiPage<Item>> {
    return this.getPage('', z.array(itemSchema), query);
  }
  create(body: unknown): Observable<Item> {
    return this.post('', body, itemSchema);
  }
  replace(id: number, body: unknown): Observable<Item> {
    return this.put(id, body, itemSchema);
  }
  change(id: number, body: unknown): Observable<Item> {
    return this.patch(id, body, itemSchema);
  }
  remove(id: number): Observable<void> {
    return this.delete(id);
  }
}

describe('ApiService', () => {
  let api: TestApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(TestApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('builds a relative URL with encoded segments, ignores empty query values and marks the request', async () => {
    const result = firstValueFrom(api.read(['a b', 7], { q: 'x', empty: '', none: null, skip: undefined, flag: false }));
    const req = http.expectOne((r) => r.url === 'items/a%20b/7');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual(['q', 'flag']);
    expect(req.request.context.get(API_REQUEST)).toBe(true);
    req.flush({ id: 1, name: 'one', extra: true });
    expect(await result).toEqual({ id: 1, name: 'one' });
  });

  it('is cold: no request without subscription', () => {
    api.read(1);
    http.expectNone(() => true);
  });

  it('reads a page with the X-Total-Count header', async () => {
    const result = firstValueFrom(api.page({ _page: 2 }));
    http.expectOne('items?_page=2').flush([{ id: 1, name: 'one' }], { headers: { 'X-Total-Count': '42' } });
    expect(await result).toEqual({ items: [{ id: 1, name: 'one' }], total: 42 });
  });

  it('falls back to the item count without X-Total-Count', async () => {
    const result = firstValueFrom(api.page());
    http.expectOne('items').flush([{ id: 1, name: 'one' }]);
    expect((await result).total).toBe(1);
  });

  it('sends verbs and bodies', async () => {
    const body = { name: 'n' };
    const calls = [
      [firstValueFrom(api.create(body)), 'POST', 'items'],
      [firstValueFrom(api.replace(2, body)), 'PUT', 'items/2'],
      [firstValueFrom(api.change(3, body)), 'PATCH', 'items/3'],
    ] as const;
    for (const [, method, url] of calls) {
      const req = http.expectOne(url);
      expect(req.request.method).toBe(method);
      expect(req.request.body).toEqual(body);
      req.flush({ id: 1, name: 'n' });
    }
    await Promise.all(calls.map(([promise]) => promise));

    const removed = firstValueFrom(api.remove(4));
    const req = http.expectOne('items/4');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(await removed).toBeUndefined();
  });

  it('rejects an invalid response', async () => {
    const result = firstValueFrom(api.read(1));
    http.expectOne('items/1').flush({ id: 'not-a-number' });
    await expect(result).rejects.toBeInstanceOf(z.ZodError);
  });

  it('propagates HTTP errors', async () => {
    const result = firstValueFrom(api.read(1));
    http.expectOne('items/1').flush(null, { status: 404, statusText: 'Not Found' });
    await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
  });
});
