import { Injectable } from "@angular/core";
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysPersistentService {
  constructor(private dbService: NgxIndexedDBService) {}

  // Insertar un test
  public insertTest(data: any): Observable<number> {
    return this.dbService.add('tests', { data }).pipe(
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