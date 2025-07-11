import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { CypressHttpInterceptor } from '../../projects/lib-e2e-cypress-for-dummys/src/lib/services/lib-e2e-cypress-for-dummys-interceptor.service';
import { provideIndexedDb } from 'ngx-indexed-db';
import { dbConfig } from '../../projects/lib-e2e-cypress-for-dummys/src/lib/lib-e2e-cypress-for-dummys.module';
import { AppTranslationService } from './services/translations.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideHttpClient(withInterceptors([CypressHttpInterceptor])),
    provideAnimationsAsync(),
    provideIndexedDb(dbConfig),
    AppTranslationService
  ],
};
