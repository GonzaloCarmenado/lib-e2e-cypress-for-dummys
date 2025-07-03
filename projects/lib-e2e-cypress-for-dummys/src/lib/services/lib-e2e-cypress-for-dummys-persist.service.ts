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
  /**
   * Inserta un test, comandos e interceptores asociados.
   * @param name Nombre de la prueba
   * @param commands Array de comandos individuales
   * @param interceptors Array de interceptores individuales
   * @returns Observable con el id del test creado
   */
  public insertTest(
    name: string,
    commands: string[] = [],
    interceptors: string[] = []
  ): Observable<number> {
    const test = {
      name,
      createdAt: Date.now(),
    };
    return this.dbService.add('tests', test).pipe(
      switchMap((result: any) => {
        const testId = result.id;
        // Insertar comandos
        const commandsInsert$ =
          commands.length > 0
            ? this.insertCommands(commands, testId)
            : of(null);
        // Insertar interceptores
        const interceptorsInsert$ =
          interceptors.length > 0
            ? this.insertInterceptors(interceptors, testId)
            : of(null);
        return commandsInsert$.pipe(
          switchMap(() => interceptorsInsert$),
          map(() => testId)
        );
      })
    );
  }

  /**
   * Obtiene todos los tests con sus comandos e interceptores asociados
   */
  public getAllTests(): Observable<any[]> {
    return this.dbService.getAll('tests').pipe(
      switchMap((tests: any[]) => {
        if (!tests.length) return of([]);
        // Para cada test, obtener comandos e interceptores (solo los strings)
        const testWithDetails$ = tests.map(async (test) => {
          const commandsRaw = await firstValueFrom(
            this.getCommandsByTestId(test.id)
          );
          const interceptorsRaw = await firstValueFrom(
            this.getInterceptorsByTestId(test.id)
          );
          const commands = Array.isArray(commandsRaw)
            ? commandsRaw
                .map((c) => (typeof c === 'string' ? c : c.command))
                .filter(Boolean)
            : [];
          const interceptors = Array.isArray(interceptorsRaw)
            ? interceptorsRaw
                .map((i) => (typeof i === 'string' ? i : i.interceptor))
                .filter(Boolean)
            : [];
          return { ...test, commands, interceptors };
        });
        return Promise.all(testWithDetails$);
      })
    );
  }
  /**
   * Obtiene todos los comandos
   */
  public getAllCommands(): Observable<any[]> {
    return this.dbService.getAll('commands');
  }

  /**
   * Obtiene los comandos asociados a un test
   */
  public getCommandsByTestId(testId: number): Observable<any[]> {
    return this.dbService.getAllByIndex(
      'commands',
      'testId',
      IDBKeyRange.only(testId)
    );
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
  /**
   * Inserta comandos individuales asociados a un test
   */
  public insertCommands(commands: string[], testId: number): Observable<any> {
    if (!commands.length) return of(null);
    const records = commands.map((command) => ({
      command,
      testId,
      createdAt: Date.now(),
    }));
    // Inserta todos los comandos de forma paralela
    return new Observable((observer) => {
      Promise.all(
        records.map((rec) =>
          firstValueFrom(this.dbService.add('commands', rec))
        )
      )
        .then((results) => {
          observer.next(results);
          observer.complete();
        })
        .catch((e) => observer.error(e));
    });
  }

  /**
   * Inserta interceptores individuales asociados a un test
   */
  public insertInterceptors(
    interceptors: string[],
    testId: number
  ): Observable<any> {
    if (!interceptors.length) return of(null);
    const records = interceptors.map((interceptor) => ({
      interceptor,
      testId,
      createdAt: Date.now(),
    }));
    // Inserta todos los interceptores de forma paralela
    return new Observable((observer) => {
      Promise.all(
        records.map((rec) =>
          firstValueFrom(this.dbService.add('interceptors', rec))
        )
      )
        .then((results) => {
          observer.next(results);
          observer.complete();
        })
        .catch((e) => observer.error(e));
    });
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

  /**
   * Obtiene el valor de una clave de configuración general
   */
  public getConfig(key: string): Observable<any> {
    return this.dbService.getAll('configuration').pipe(
      map((records: any[]) => {
        if (!records.length) return null;
        const config = records[0];
        return config.hasOwnProperty(key) ? { [key]: config[key] } : null;
      })
    );
  }

  /**
   * Guarda una clave concreta en la configuración general
   */
  public setConfigKey(key: string, value: any): Observable<any> {
    return this.dbService.getAll('configuration').pipe(
      switchMap((records: any[]) => {
        const current = records.length > 0 ? records[0] : {};
        const merged = { ...current, [key]: value };
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
