import {
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LibE2eCypressForDummysService } from './lib-e2e-cypress-for-dummys.service';

export const CypressHttpInterceptor = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const e2eService = inject(LibE2eCypressForDummysService);

  const cloned = req.clone();

  return next(cloned).pipe(
    tap({
      next: (event) => {
        if (
          (req.method === 'GET' || req.method === 'POST') &&
          event instanceof HttpResponse
        ) {
          const url = req.urlWithParams;
          const alias = generateAlias(url);

          // Guarda el interceptor si es nuevo
          e2eService.registerInterceptor(req.method, url, alias);

          // Guarda el wait en la lista principal
          e2eService.addCommand(
            `cy.wait('@${alias}').then((interception) => { })`
          );
        }
      },
    })
  );
};

function generateAlias(url: string): string {
  try {
    const u = new URL(url, 'http://localhost');
    const path = u.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    return path.replace(/^-|-$/g, '');
  } catch {
    return 'intercepted-request';
  }
}
