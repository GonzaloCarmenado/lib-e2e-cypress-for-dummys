import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibE2eCypressForDummysPersistentService } from '../../services/lib-e2e-cypress-for-dummys-persist.service';

@Component({
  selector: 'app-advanced-test-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './advanced-test-editor.component.html',
  styleUrl: './advanced-test-editor.component.scss',
})
export class AdvancedTestEditorComponent implements OnInit {
  public e2eTree: any[] = [];
  @Input() testId?: any;
  public selectedFile: any = null;
  public saveButtonEnabled = false;
  public cypressCommands: string[] = [];
  public selectedFileHandle: FileSystemFileHandle | null = null;
  public selectedFileContent: string | null = null;
  public testItBlock: string = '';

  constructor(
    private readonly persistService: LibE2eCypressForDummysPersistentService
  ) {}

  public ngOnInit() {
    this.getFoldersData();
    if (this.testId) {
      this.loadCypressCommandsForTest(this.testId);
    }
  }

  // Carga los comandos Cypress asociados al testId
  private async loadCypressCommandsForTest(testId: any) {
    if (typeof this.persistService.getTestById === 'function') {
      const test = await this.persistService.getTestById(testId)?.toPromise?.();
      if (test?.cypressCommands) {
        this.cypressCommands = test.cypressCommands;
        this.testItBlock = test.itBlock || '';
      } else {
        this.cypressCommands = [];
        this.testItBlock = '';
      }
    }
  }

  public async getFoldersData(): Promise<void> {
    // Comprueba si hay permiso
    const config = await this.persistService
      .getConfig('allowReadWriteFiles')
      .toPromise();
    if (config?.allowReadWriteFiles === 'true') {
      // Recupera el handle de la carpeta
      const dirConfig = await this.persistService
        .getConfig('cypressDirectoryHandle')
        .toPromise();
      const dirHandle = dirConfig?.cypressDirectoryHandle;
      if (dirHandle) {
        // Busca la carpeta 'e2e' dentro de la carpeta seleccionada
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'directory' && entry.name === 'e2e') {
            console.log('Carpeta e2e encontrada:', entry);

            const tree = await this.scanDirectory(entry);

            this.e2eTree = tree.children; // Solo hijos de e2e
            console.log(
              'Árbol de carpetas/archivos dentro de e2e:',
              this.e2eTree
            );
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
  private async scanDirectory(
    dirHandle: FileSystemDirectoryHandle
  ): Promise<any> {
    const result: any = {
      name: dirHandle.name,
      kind: 'directory',
      children: [] as any[],
    };
    for await (const entry of dirHandle.values()) {
      if (entry && entry.kind === 'directory') {
        const child = await this.scanDirectory(
          entry as FileSystemDirectoryHandle
        );
        if (child) result.children.push(child);
      } else if (entry && entry.kind === 'file') {
        result.children.push({ name: entry.name, kind: 'file' });
      }
    }
    // Filtra posibles valores nulos/undefined
    result.children = result.children.filter(Boolean);
    return result;
  }

  // Obtiene el contenido de un fichero y lo muestra por consola
  public async onFileClick(file: any) {
    if (file.kind !== 'file') {
      console.warn('No es un fichero.');
      return;
    }
    this.selectedFile = file;
    this.saveButtonEnabled = true;
    // Recupera el handle de la carpeta raíz
    const dirConfig = await this.persistService
      .getConfig('cypressDirectoryHandle')
      .toPromise();
    const dirHandle = dirConfig?.cypressDirectoryHandle;
    if (!dirHandle) {
      console.warn('No hay handle de carpeta guardado.');
      return;
    }
    // Busca recursivamente el handle del fichero a partir del root
    const fileHandle = await this.findFileHandleRecursive(dirHandle, file.name);
    if (!fileHandle) {
      console.warn('No se encontró el handle del fichero:', file.name);
      return;
    }
    const fileObj = await fileHandle.getFile();
    const content = await fileObj.text();
    console.log('Contenido del fichero', file.name, ':', content);
    // Guarda el handle y contenido para el guardado posterior
    this.selectedFileHandle = fileHandle;
    this.selectedFileContent = content;
  }

  // Botón guardar: inserta el bloque it() antes del último '});' y guarda el fichero
  public async saveCommandsToFile() {
    if (!this.selectedFileHandle || !this.selectedFileContent) return;
    if (!this.testItBlock) return;
    // Busca el último '});' en el contenido
    const idx = this.selectedFileContent.lastIndexOf('});');
    if (idx === -1) {
      alert('No se encontró el final de la función en el fichero.');
      return;
    }
    // Inserta el bloque it() antes del último '});'
    const newContent =
      this.selectedFileContent.slice(0, idx) +
      '\n' +
      this.testItBlock +
      '\n' +
      this.selectedFileContent.slice(idx);
    // Guarda el nuevo contenido en el fichero
    const writable = await this.selectedFileHandle.createWritable();
    await writable.write(newContent);
    await writable.close();
    alert('Prueba Cypress insertada correctamente.');
  }

  // Busca recursivamente un fileHandle por nombre a partir de un directorio
  private async findFileHandleRecursive(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string
  ): Promise<FileSystemFileHandle | null> {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name === fileName) {
        return entry as FileSystemFileHandle;
      } else if (entry.kind === 'directory') {
        const found = await this.findFileHandleRecursive(
          entry as FileSystemDirectoryHandle,
          fileName
        );
        if (found) return found;
      }
    }
    return null;
  }
}
