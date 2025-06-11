import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LibE2eCypressForDummysService } from './lib-e2e-cypress-for-dummys.service';

@Injectable()
export class CypressHttpInterceptor implements HttpInterceptor {
  constructor(private e2eService: LibE2eCypressForDummysService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clonar porque Angular HttpRequest es inmutable
    const cloned = req.clone();

    return next.handle(cloned).pipe(
      tap({
        next: (event) => {
         debugger
          if (req.method === 'GET' || req.method === 'POST') {
            const url = req.urlWithParams;
            const alias = this.generateAlias(url);

            // Guarda el interceptor si es nuevo
            this.e2eService.registerInterceptor(req.method, url, alias);

            // Guarda el wait en la lista principal
            this.e2eService.addCommand(`cy.wait('@${alias}').then((interception) => { })`);
          }
        }
      })
    );
  }

  private generateAlias(url: string): string {
    // Lógica muy simple, puedes mejorarla
    try {
      const u = new URL(url, 'http://localhost');
      const path = u.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
      return path.replace(/^-|-$/g, '');
    } catch {
      return 'intercepted-request';
    }
  }
}
