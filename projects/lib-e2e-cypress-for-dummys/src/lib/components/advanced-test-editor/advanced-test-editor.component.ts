import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
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
  @Input() public testId?: any;
  @Output() public closeModal = new EventEmitter<void>();
  @Output() public closeModalPadre = new EventEmitter<void>();

  public e2eTree: any[] = [];
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

  private readonly persistService = inject(LibE2eCypressForDummysPersistentService);
  public translationService = inject(TranslationService);
  private readonly transformationService = inject(AdvancedtestTransformationService);

  public ngOnInit(): void {
    this.getFoldersData();
    if (this.testId) {
      this.loadCypressCommandsForTest(this.testId);
    }
  }

  // Helpers de validación y mensajes
  private warn(msgKey: string, extra?: string): void {
    console.warn(
      this.translationService.translate(msgKey) + (extra ? ': ' + extra : '')
    );
  }
  private alert(msgKey: string): void {
    alert(this.translationService.translate(msgKey));
  }

  private async getConfigHandle(key: string): Promise<any | null> {
    const config = await this.persistService.getConfig(key).toPromise();
    return config ? config[key] : null;
  }
  private async getRootDirHandle():  Promise<any | null> {
    return this.getConfigHandle('cypressDirectoryHandle');
  }

  public async getFoldersData(): Promise<void> {
    if (!(await this.hasPermission())) return;
    let dirHandle;
    try {
      dirHandle = await this.getRootDirHandle();
      if (!dirHandle) return this.warn('ADVANCED_EDITOR.NO_DIR_HANDLE');
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory' && entry.name === 'e2e') {
          const tree = await this.transformationService.scanDirectory(
            entry as FileSystemDirectoryHandle
          );
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
        } catch (permErr: unknown) {
          this.warn('ADVANCED_EDITOR.NO_PERMISSION');
          console.error('Error requesting permissions:', permErr);
        }
      } else {
        this.warn('ADVANCED_EDITOR.NO_DIR_HANDLE');
      }
    }
  }

  private async requestPermissions(): Promise<void> {
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

  public markFileAsSelected(file: any): void {
    this.selectedFile = file;
    this.saveButtonEnabled = !this.saveButtonEnabled;
  }

  public async onFileClick(file: any): Promise<void> {
    if (!this.transformationService.isFile(file))
      return this.warn('ADVANCED_EDITOR.NOT_A_FILE');
    this.selectedFile = file;
    this.saveButtonEnabled = true;
    const dirHandle = await this.getRootDirHandle();
    if (!dirHandle) return this.warn('ADVANCED_EDITOR.NO_DIR_HANDLE');
    const fileHandle = await this.findFileHandleRecursive(dirHandle, file.name);
    if (!fileHandle)
      return this.warn('ADVANCED_EDITOR.FILE_HANDLE_NOT_FOUND', file.name);
    const content = await this.readFileContent(fileHandle);
    this.selectedFileHandle = fileHandle;
    this.selectedFileContent = content;
  }
  private async readFileContent(
    fileHandle: FileSystemFileHandle
  ): Promise<string> {
    const fileObj = await fileHandle.getFile();
    return fileObj.text();
  }

  public async openFilePreview(file: any): Promise<void> {
    await this.onFileClick(file);
    this.previewFileName = file.name;
    this.previewFileContent = this.selectedFileContent;
    this.isPreviewMode = true;
  }
  public closePreview(): void {
    this.isPreviewMode = false;
    this.previewFileName = null;
    this.previewFileContent = null;
    if (this.testId) {
      this.closeModalPadre.emit();
    }
  }

  public async saveCommandsToFile(): Promise<void> {
    if (!this.selectedFileHandle || !this.selectedFileContent) return;
    if (!this.testItBlock) return;
    let newContent = this.selectedFileContent;
    if (this.interceptorsBlock)
      newContent = this.transformationService.insertBeforeEach(
        newContent,
        this.interceptorsBlock,
        this.alert.bind(this)
      );
    newContent = this.transformationService.insertItBlock(
      newContent,
      this.testItBlock,
      this.alert.bind(this)
    );
    if (!newContent) return;
    await this.writeFileContent(this.selectedFileHandle, newContent);
    this.alert('ADVANCED_EDITOR.SUCCESS');
    this.closeModal.emit();
  }

  private async writeFileContent(
    fileHandle: FileSystemFileHandle,
    content: string
  ): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  private async findFileHandleRecursive(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string
  ): Promise<FileSystemFileHandle | null> {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name === fileName)
        return entry as FileSystemFileHandle;
      else if (entry.kind === 'directory') {
        const found = await this.findFileHandleRecursive(
          entry as FileSystemDirectoryHandle,
          fileName
        );
        if (found) return found;
      }
    }
    return null;
  }

  //  Carga de comandos Cypress
  private async loadCypressCommandsForTest(testId: any): Promise<void> {
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

  public async onSaveFile(newContent: string): Promise<void> {
    if (!this.selectedFileHandle) {
      this.alert('ADVANCED_EDITOR.FILE_HANDLE_NOT_FOUND');
      return;
    }
    await this.writeFileContent(this.selectedFileHandle, newContent);
    this.previewFileContent = newContent;
    this.alert('ADVANCED_EDITOR.SUCCESS');
  }
}
