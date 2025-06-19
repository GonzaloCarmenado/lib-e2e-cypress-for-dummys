import { NgModule } from '@angular/core';
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';
import { dataBaseConfiguration } from './models/BBDD/data-base-configuration.model';
import { TranslationService } from './services/lib-e2e-cypress-for-dummys-translate.service';

export const dbConfig: DBConfig = dataBaseConfiguration;

@NgModule({
  imports: [NgxIndexedDBModule.forRoot(dbConfig)],
  providers: [TranslationService],
  exports: [],
})
export class LibE2eCypressForDummysModule {}
