import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibE2eCypressForDummysPersistentService } from '../../services/lib-e2e-cypress-for-dummys-persist.service';
import { TranslationService } from '../../services/lib-e2e-cypress-for-dummys-translate.service';
import { FilePreviewComponent } from './file-preview/file-preview.component';
import { AdvancedtestTransformationService } from './advanced-test-editor.transformation.service';

@Component({
  selector: 'app-advanced-test-editor',
  standalone: true,
  imports: [CommonModule, FilePreviewComponent],
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
  public interceptorsBlock: string = '';
  public isPreviewMode = false; // Controla si estamos en modo previsualización
  public previewFileName: string | null = null;
  public previewFileContent: string | null = null;

  constructor(
    private readonly persistService: LibE2eCypressForDummysPersistentService,
    public translationService: TranslationService,
    private readonly transformationService: AdvancedtestTransformationService
  ) { }

  public ngOnInit() {
    this.getFoldersData();
    if (this.testId) {
      this.loadCypressCommandsForTest(this.testId);
    }
  }

  // --- Helpers de validación y mensajes ---
  private warn(msgKey: string, extra?: string) {
    console.warn(
      this.translationService.translate(msgKey) +
      (extra ? ': ' + extra : '')
    );
  }
  private alert(msgKey: string) {
    alert(this.translationService.translate(msgKey));
  }

  // --- Métodos de obtención de handles ---
  private async getConfigHandle(key: string) {
    const config = await this.persistService.getConfig(key).toPromise();
    return config ? config[key] : null;
  }
  private async getRootDirHandle() {
    return this.getConfigHandle('cypressDirectoryHandle');
  }

  // --- Árbol de carpetas ---
  public async getFoldersData(): Promise<void> {
    if (!(await this.hasPermission())) return;
    let dirHandle;
    try {
      dirHandle = await this.getRootDirHandle();
      if (!dirHandle) return this.warn('ADVANCED_EDITOR.NO_DIR_HANDLE');
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory' && entry.name === 'e2e') {
          const tree = await this.transformationService.scanDirectory(entry as FileSystemDirectoryHandle);
          this.e2eTree = tree.children;
          return;
        }
      }
      this.warn('ADVANCED_EDITOR.NO_DIR_HANDLE');
    } catch (err: any) {
      console.error('Error reading folders:', err);
      // Si es un error de permisos, volvemos a pedirlos y reintentamos
      if (err && err.name === 'NotAllowedError') {
        try {
          // Vuelve a solicitar permisos
          await this.requestPermissions();
          // Reintenta el ciclo completo
          await this.getFoldersData();
        } catch (permErr) {
          this.warn('ADVANCED_EDITOR.NO_PERMISSION');
        }
      } else {
        this.warn('ADVANCED_EDITOR.NO_DIR_HANDLE');
      }
    }
  }

  private async requestPermissions() {
    // Aquí puedes personalizar la lógica para solicitar permisos según tu app
    // Por ejemplo, puedes volver a pedir el handle raíz
    await this.persistService.requestDirectoryPermissions();
  }

  private async hasPermission(): Promise<boolean> {
    const config = await this.persistService
      .getConfig('allowReadWriteFiles')
      .toPromise();
    if (config?.allowReadWriteFiles === 'true') return true;
    this.warn('ADVANCED_EDITOR.NO_PERMISSION');
    return false;
  }

  // --- Selección de archivo ---
  public markFileAsSelected(file: any) {
    this.selectedFile = file;
    this.saveButtonEnabled = !this.saveButtonEnabled;
  }

  // --- Lectura de archivos ---
  public async onFileClick(file: any) {
    if (!this.transformationService.isFile(file)) return this.warn('ADVANCED_EDITOR.NOT_A_FILE');
    this.selectedFile = file;
    this.saveButtonEnabled = true;
    const dirHandle = await this.getRootDirHandle();
    if (!dirHandle) return this.warn('ADVANCED_EDITOR.NO_DIR_HANDLE');
    const fileHandle = await this.findFileHandleRecursive(dirHandle, file.name);
    if (!fileHandle) return this.warn('ADVANCED_EDITOR.FILE_HANDLE_NOT_FOUND', file.name);
    const content = await this.readFileContent(fileHandle);
    this.selectedFileHandle = fileHandle;
    this.selectedFileContent = content;
    this.logFileContent(file.name, content);
  }
  private async readFileContent(fileHandle: FileSystemFileHandle): Promise<string> {
    const fileObj = await fileHandle.getFile();
    return fileObj.text();
  }
  private logFileContent(name: string, content: string) {
    console.log(this.translationService.translate('ADVANCED_EDITOR.FILE_CONTENT') + ' ' + name + ':', content);
  }

  // --- Previsualización ---
  public async openFilePreview(file: any) {
    await this.onFileClick(file);
    this.previewFileName = file.name;
    this.previewFileContent = this.selectedFileContent;
    this.isPreviewMode = true;
  }
  public closePreview() {
    this.isPreviewMode = false;
    this.previewFileName = null;
    this.previewFileContent = null;
  }

  // --- Guardado de comandos ---
  public async saveCommandsToFile() {
    if (!this.selectedFileHandle || !this.selectedFileContent) return;
    if (!this.testItBlock) return;
    let newContent = this.selectedFileContent;
    if (this.interceptorsBlock) newContent = this.transformationService.insertBeforeEach(newContent, this.interceptorsBlock, this.alert.bind(this));
    newContent = this.transformationService.insertItBlock(newContent, this.testItBlock, this.alert.bind(this));
    if (!newContent) return;
    await this.writeFileContent(this.selectedFileHandle, newContent);
    this.alert('ADVANCED_EDITOR.SUCCESS');
    try { (window as any).Swal?.close(); } catch { }
  }

  private async writeFileContent(fileHandle: FileSystemFileHandle, content: string) {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  // --- Búsqueda recursiva de handles ---
  private async findFileHandleRecursive(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string
  ): Promise<FileSystemFileHandle | null> {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name === fileName) return entry as FileSystemFileHandle;
      else if (entry.kind === 'directory') {
        const found = await this.findFileHandleRecursive(entry as FileSystemDirectoryHandle, fileName);
        if (found) return found;
      }
    }
    return null;
  }

  // --- Carga de comandos Cypress ---
  private async loadCypressCommandsForTest(testId: any) {
    if (typeof this.persistService.getTestById === 'function') {
      const test = await this.persistService.getTestById(testId)?.toPromise?.();
      if (test?.cypressCommands) {
        this.cypressCommands = test.cypressCommands;
        this.testItBlock = test.itBlock || '';
        this.interceptorsBlock = test.interceptorsBlock || '';
      } else {
        this.cypressCommands = [];
        this.testItBlock = '';
        this.interceptorsBlock = '';
      }
    }
  }

  public async onSaveFile(newContent: string) {
    if (!this.selectedFileHandle) {
      this.alert('ADVANCED_EDITOR.FILE_HANDLE_NOT_FOUND');
      return;
    }
    await this.writeFileContent(this.selectedFileHandle, newContent);
    this.previewFileContent = newContent;
    this.alert('ADVANCED_EDITOR.SUCCESS');
  }
}
