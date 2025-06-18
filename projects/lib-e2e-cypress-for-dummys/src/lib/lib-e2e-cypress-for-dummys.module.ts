import { NgModule } from '@angular/core';
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';
import { dataBaseConfiguration } from './models/BBDD/data-base-configuration.model';

export const dbConfig: DBConfig = dataBaseConfiguration;

@NgModule({
  imports: [NgxIndexedDBModule.forRoot(dbConfig)],
  exports: [],
})
export class LibE2eCypressForDummysModule {}
