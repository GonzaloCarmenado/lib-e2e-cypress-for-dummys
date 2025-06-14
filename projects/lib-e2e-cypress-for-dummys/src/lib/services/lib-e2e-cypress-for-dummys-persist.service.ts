import { Injectable } from "@angular/core";
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysPersistentService {
  constructor(private dbService: NgxIndexedDBService) {}

  // Insertar un test
  public insertTest(description: string, commandsAndItBlock: string): Observable<number> {
    const test = {
      description,
      commandsAndItBlock,
      createdAt: Date.now()
    };
    return this.dbService.add('tests', test).pipe(
      map(result => result.id)
    );
  }

  // Obtener todos los tests
  public getAllTests(): Observable<any[]> {
    return this.dbService.getAll('tests');
  }

  // Eliminar un test por id
 public deleteTest(id: number): Observable<void> {
  return this.dbService.delete('tests', id).pipe(
    map(() => void 0)
  );
}
}