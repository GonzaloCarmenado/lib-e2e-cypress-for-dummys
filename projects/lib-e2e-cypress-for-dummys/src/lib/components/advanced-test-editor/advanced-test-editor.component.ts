import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibE2eCypressForDummysPersistentService } from '../../services/lib-e2e-cypress-for-dummys-persist.service';

@Component({
  selector: 'app-advanced-test-editor',
  imports: [CommonModule],
  templateUrl: './advanced-test-editor.component.html',
  styleUrl: './advanced-test-editor.component.scss'
})
export class AdvancedTestEditorComponent implements OnInit {
  public e2eTree: any[] = [];

  constructor(private readonly persistService: LibE2eCypressForDummysPersistentService) {}

  async ngOnInit() {
    // Comprueba si hay permiso
    const config = await this.persistService.getConfig('allowReadWriteFiles').toPromise();
    if (config?.allowReadWriteFiles === 'true') {
      // Recupera el handle de la carpeta
      const dirConfig = await this.persistService.getConfig('cypressDirectoryHandle').toPromise();
      const dirHandle = dirConfig?.cypressDirectoryHandle;
      if (dirHandle) {
        // Busca la carpeta 'e2e' dentro de la carpeta seleccionada
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'directory' && entry.name === 'e2e') {
            console.log('Carpeta e2e encontrada:', entry);
            
            const tree = await this.scanDirectory(entry);

            this.e2eTree = tree.children; // Solo hijos de e2e
            console.log('Árbol de carpetas/archivos dentro de e2e:', this.e2eTree);
          }
        }
      } else {
        console.warn('No hay handle de carpeta guardado.');
      }
    } else {
      console.warn('No hay permiso para acceder a archivos/carpetas.');
    }
  }

    /**
   * Recorre recursivamente las carpetas y archivos a partir de un handle de directorio.
   * Devuelve una estructura con el nombre, tipo y su contenido (solo nombres).
   */
  private async scanDirectory(dirHandle: FileSystemDirectoryHandle): Promise<any> {
    const result: any = {
      name: dirHandle.name,
      kind: 'directory',
      children: [] as any[],
    };
    for await (const entry of dirHandle.values()) {
      if (entry && entry.kind === 'directory') {
        const child = await this.scanDirectory(entry as FileSystemDirectoryHandle);
        if (child) result.children.push(child);
      } else if (entry && entry.kind === 'file') {
        result.children.push({ name: entry.name, kind: 'file' });
      }
    }
    // Filtra posibles valores nulos/undefined
    result.children = result.children.filter(Boolean);
    return result;
  }

  // Para el futuro: manejar click en fichero
  public onFileClick(file: any) {
    // Aquí se podrá abrir el fichero, etc.
    console.log('Fichero clicado:', file);
  }
}
