import { NgModule, ModuleWithProviders } from '@angular/core';
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';

export const dbConfig: DBConfig  = {
  name: 'E2ECypressDB',
  version: 1,
  objectStoresMeta: [{
    store: 'tests',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'data', keypath: 'data', options: { unique: false } }
    ]
  }]
};

@NgModule({
  imports: [NgxIndexedDBModule.forRoot(dbConfig)],
  exports: []
})
export class LibE2eCypressForDummysModule {}