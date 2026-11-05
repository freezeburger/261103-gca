import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, of, throwError } from 'rxjs';
import { ProductSchema } from '../../core/schemas/products';
import { ProductApi } from './product-api';

export const productResolver: ResolveFn<ProductSchema> = (route) => {
  const router = inject(Router);
  const notFound = new RedirectCommand(router.parseUrl('/not-found'), { skipLocationChange: true });
  const id = Number(route.paramMap.get('id'));

  if (!Number.isInteger(id) || id <= 0) {
    return notFound;
  }
  return inject(ProductApi)
    .byId(id)
    .pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(notFound) : throwError(() => error),
      ),
    );
};
