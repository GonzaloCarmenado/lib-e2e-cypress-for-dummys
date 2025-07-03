import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { map, Observable, of, switchMap, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysPersistentService {
  constructor(private readonly dbService: NgxIndexedDBService) {}

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
    // Elimina el test y luego todos sus interceptores, devolviendo un único flujo
    return this.dbService
      .delete('tests', id)
      .pipe(switchMap(() => this.deleteInterceptorsByTestId(id)));
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
    // Elimina todos los interceptores de un test de forma reactiva y sin suscripciones internas
    return this.getInterceptorsByTestId(testId).pipe(
      switchMap((interceptors) => {
        if (!interceptors.length) return of(void 0);
        // Devuelve un observable que espera a que todos los deletes terminen
        return this.deleteMany(
          'interceptors',
          interceptors.map((i) => i.id)
        );
      })
    );
  }

  /**
   * Elimina en masa registros de una store por id, devolviendo un observable que finaliza cuando todos han sido eliminados.
   */
  private deleteMany(store: string, ids: number[]): Observable<void> {
    if (!ids.length) return of(void 0);
    // Ejecuta todos los deletes y espera a que terminen
    return new Observable<void>((observer) => {
      Promise.all(
        ids.map((id) => firstValueFrom(this.dbService.delete(store, id)))
      )
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((e) => observer.error(e));
    });
  }
  //#endregion Persistencia de los interceptores

  //#region Persistencia de configuración general
  // Método genérico para guardar configuración (merge)
  public setConfig(config: Record<string, any>): Observable<any> {
    return this.dbService.getAll('configuration').pipe(
      switchMap((records: any[]) => {
        const current = records.length > 0 ? records[0] : {};
        const merged = { ...current, ...config };
        // Si ya existe, actualiza; si no, añade
        if (current.id) {
          return this.dbService.update('configuration', {
            ...merged,
            id: current.id,
          });
        } else {
          return this.dbService.add('configuration', merged);
        }
      })
    );
  }

  /**
   * @deprecated Usar setConfig({ extendedHttpCommands }) en su lugar
   */
  public setHttpConfig(config: {
    extendedHttpCommands: boolean;
  }): Observable<any> {
    return this.setConfig(config);
  }

  public getGeneralConfig(): Observable<{ language: string } | null> {
    return this.dbService
      .getAll('configuration')
      .pipe(map((records: any[]) => (records.length > 0 ? records[0] : null)));
  }

  public getExtendedHttpCommandsConfig(): Observable<null> {
    return this.dbService.getAll('configuration').pipe(
      map((records: any[]) => {
        const found = records.find((r) =>
          r.hasOwnProperty('extendedHttpCommands')
        );
        return found ?? null;
      })
    );
  }
  //#endregion

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

  /**
   * Ingresa datos de tests e interceptores en la base de datos, eliminando el id si existe.
   * Refactor: más legible, sin lógica duplicada, y usando utilidades privadas.
   */
  public ingestFileData(tests: any[], interceptors: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await Promise.all([
            this.bulkInsertWithoutId('tests', tests),
            this.bulkInsertWithoutId('interceptors', interceptors),
          ]);
          resolve();
        } catch (e) {
          let errorToReject;
          if (e instanceof Error) {
            errorToReject = e;
          } else if (typeof e === 'string') {
            errorToReject = new Error(e);
          } else {
            errorToReject = new Error(JSON.stringify(e));
          }
          reject(errorToReject);
        }
      })();
    });
  }

  /**
   * Inserta en masa registros en una store, eliminando el id si existe.
   */
  private async bulkInsertWithoutId(
    store: string,
    items: any[]
  ): Promise<void> {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const { id, ...itemWithoutId } = item;
      await firstValueFrom(this.dbService.add(store, itemWithoutId));
    }
  }
}
