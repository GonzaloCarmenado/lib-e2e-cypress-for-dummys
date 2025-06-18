import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysPersistentService {
  constructor(private dbService: NgxIndexedDBService) {}

  //#region Persistencia de los Test
  // Insertar un test
  public insertTest(
    description: string,
    commandsAndItBlock: string,
    interceptors: string[] = []
  ): Observable<number> {
    const test = {
      description,
      commandsAndItBlock,
      createdAt: Date.now(),
    };
    return this.dbService.add('tests', test).pipe(
      switchMap((result: any) => {
        const testId = result.id;
        if (interceptors.length > 0) {
          return this.insertInterceptors(interceptors, testId).pipe(
            map(() => testId)
          );
        }
        return of(testId);
      })
    );
  }

  // Obtener todos los tests
  public getAllTests(): Observable<any[]> {
    return this.dbService.getAll('tests');
  }

  // Eliminar un test por id
  public deleteTest(id: number): Observable<void> {
    return this.dbService.delete('tests', id).pipe(
      map(() => {
        this.deleteInterceptorsByTestId(id).subscribe();
        return void 0;
      })
    );
  }

  //#endregion Persistencia de los Test

  //#region Persistencia de los interceptores
  public insertInterceptors(
    interceptors: string[],
    testId: number
  ): Observable<any> {
    const commandsString = interceptors.join('\n');
    const record = {
      commands: commandsString,
      testId,
      createdAt: Date.now(),
    };
    return this.dbService.add('interceptors', record);
  }

  // Obtener todos los interceptores
  public getAllInterceptors(): Observable<any[]> {
    return this.dbService.getAll('interceptors');
  }
  public getInterceptorsByTestId(testId: number): Observable<any[]> {
    return this.dbService.getAllByIndex(
      'interceptors',
      'testId',
      IDBKeyRange.only(testId)
    );
  }

  // Eliminar interceptores por testId
  public deleteInterceptorsByTestId(testId: number): Observable<void> {
    return this.getInterceptorsByTestId(testId).pipe(
      map((interceptors) => {
        interceptors.forEach((i) =>
          this.dbService.delete('interceptors', i.id).subscribe()
        );
        return void 0;
      })
    );
  }
  //#endregion Persistencia de los interceptores

  public clearAllData(): Observable<void> {
    return new Observable<void>((observer) => {
      Promise.all([
        this.dbService.clear('tests'),
        this.dbService.clear('interceptors'),
      ]).then(() => {
        observer.next();
        observer.complete();
      });
    });
  }

  public ingestFileData(tests: any[], interceptors: any[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (Array.isArray(tests)) {
          for (const test of tests) {
            const { id, ...testWithoutId } = test;
            await this.dbService.add('tests', testWithoutId).toPromise();
          }
        }
        if (Array.isArray(interceptors)) {
          for (const interceptor of interceptors) {
            const { id, ...interceptorWithoutId } = interceptor;
            await this.dbService
              .add('interceptors', interceptorWithoutId)
              .toPromise();
          }
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
}
