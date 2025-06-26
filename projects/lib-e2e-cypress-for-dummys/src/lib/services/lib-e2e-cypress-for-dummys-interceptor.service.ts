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
          const alias = generateAlias(req.method, url);

          // Guarda el interceptor si es nuevo
          e2eService.registerInterceptor(req.method, url, alias);

          // Guarda el wait en la lista principal
          let cyWaitCommand = `cy.wait('@${alias}').then((interception) => { })`;

          // Si es GET, POST o PUT y la respuesta no es un array, añade validaciones solo si extendedHttpCommands está activo
          const extendedHttp =
            localStorage.getItem('extendedHttpCommands') === 'true';
          if (
            req.method === 'GET' &&
            event.body &&
            typeof event.body === 'object' &&
            !Array.isArray(event.body) &&
            extendedHttp
          ) {
            // Validar la respuesta para GET
            const validations = Object.keys(event.body)
              .filter((key) => key !== 'id' && key !== 'uid')
              .map(
                (key) =>
                  `  expect(interception.response.body.${key}).to.equal(${JSON.stringify(
                    event.body[key]
                  )});`
              )
              .join('\n');
            cyWaitCommand = `cy.wait('@${alias}').then((interception) => {\n${validations}\n})`;
          } else if (
            ((req.method as string) === 'POST' ||
              (req.method as string) === 'PUT') &&
            req.body &&
            typeof req.body === 'object' &&
            !Array.isArray(req.body) &&
            extendedHttp
          ) {
            // Validar el objeto enviado para POST y PUT
            const validations = Object.keys(req.body)
              .filter((key) => key !== 'id' && key !== 'uid')
              .map(
                (key) =>
                  `  expect(interception.request.body.${key}).to.equal(${JSON.stringify(
                    req.body[key]
                  )});`
              )
              .join('\n');
            cyWaitCommand = `cy.wait('@${alias}').then((interception) => {\n${validations}\n})`;
          }
          e2eService.addCommand(cyWaitCommand);
        }
      },
    })
  );
};

function generateAlias(method: string, url: string): string {
  try {
    const u = new URL(url, 'http://localhost');
    const path = u.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    return `${method.toLowerCase()}-${path.replace(/^-|-$/g, '')}`;
  } catch {
    return `${method.toLowerCase()}-intercepted-request`;
  }
}
