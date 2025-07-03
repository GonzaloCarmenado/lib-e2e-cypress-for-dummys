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
        if (!shouldIntercept(req, event)) return;

        const url = req.urlWithParams;
        const alias = generateAlias(req.method, url);
        e2eService.registerInterceptor(req.method, url, alias);

        const extendedHttp = isExtendedHttpEnabled();
        let cyWaitCommand = buildCyWaitCommand(
          req,
          event as HttpResponse<any>,
          alias,
          extendedHttp
        );
        e2eService.addCommand(cyWaitCommand);
      },
    })
  );
};

function shouldIntercept(
  req: HttpRequest<any>,
  event: HttpEvent<any>
): boolean {
  return (
    (req.method === 'GET' || req.method === 'POST' || req.method === 'PUT') &&
    event instanceof HttpResponse
  );
}

function isExtendedHttpEnabled(): boolean {
  return localStorage.getItem('extendedHttpCommands') === 'true';
}

function buildCyWaitCommand(
  req: HttpRequest<any>,
  event: HttpResponse<any>,
  alias: string,
  extendedHttp: boolean
): string {
  // GET: Validar respuesta
  if (
    req.method === 'GET' &&
    event.body &&
    typeof event.body === 'object' &&
    !Array.isArray(event.body) &&
    extendedHttp
  ) {
    const validations = buildValidations(
      'interception.response.body',
      event.body
    );
    return `cy.wait('@${alias}').then((interception) => {\n  if (interception.response) {\n${validations}\n  }\n})`;
  }
  // POST/PUT: Validar request
  if (
    (req.method === 'POST' || req.method === 'PUT') &&
    req.body &&
    typeof req.body === 'object' &&
    !Array.isArray(req.body) &&
    extendedHttp
  ) {
    const validations = buildValidations('interception.request.body', req.body);
    return `cy.wait('@${alias}').then((interception) => {\n${validations}\n})`;
  }
  // Default
  return `cy.wait('@${alias}').then((interception) => { })`;
}

function buildValidations(base: string, obj: any): string {
  return Object.keys(obj)
    .filter((key) => key !== 'id' && key !== 'uid')
    .map(
      (key) => `expect(${base}.${key}).to.equal(${JSON.stringify(obj[key])});`
    )
    .join('\n');
}

function generateAlias(method: string, url: string): string {
  try {
    const u = new URL(url, 'http://localhost');
    const path = u.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    return `${method.toLowerCase()}-${path.replace(/(^-)|(-$)/g, '')}`;
  } catch {
    return `${method.toLowerCase()}-intercepted-request`;
  }
}
