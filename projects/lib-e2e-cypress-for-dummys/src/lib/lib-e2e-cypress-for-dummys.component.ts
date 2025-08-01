import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewContainerRef,
  Injector,
} from '@angular/core';
import { LibE2eCypressForDummysService } from './services/lib-e2e-cypress-for-dummys.service';
import { DialogModule } from 'primeng/dialog';
import { TestPrevisualizerComponent } from './components/test-previsualizer/test-previsualizer.component';
import { SaveTestComponent } from './components/save-test-data/save-test-data.component';
import { LibE2eCypressForDummysPersistentService } from './services/lib-e2e-cypress-for-dummys-persist.service';
import { LibE2eCypressForDummysTransformationService } from './lib-e2e-cypress-for-dummys.transformation.service';
import { TestEditorComponent } from './components/test-editor/test-editor.component';
import { AdvancedTestEditorComponent } from './components/advanced-test-editor/advanced-test-editor.component';
import { ConfigurationComponent } from './components/configurations/configuration.component';
import { TranslationService } from './services/lib-e2e-cypress-for-dummys-translate.service';
import Swal from 'sweetalert2';

// Opciones para los modales SweetAlert2
export interface SwalModalOptions {
  title: string;
  containerId: string;
  component: any;
  inputs?: Record<string, any>;
  stateFlag: keyof LibE2eRecorderComponent;
  onClose?: () => void;
}
import { LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES } from './models/swal2-custom-styles';
import { LibE2eCypressForDummysConstructorService } from './lib-e2e-cypress-for-dummys.constructor.service';
import { ViewEncapsulation } from '@angular/core';
@Component({
  selector: 'lib-e2e-recorder',
  templateUrl: './lib-e2e-cypress-for-dummys.component.html',
  styleUrls: ['./lib-e2e-cypress-for-dummys.component.scss'],
  standalone: true,
  imports: [DialogModule],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class LibE2eRecorderComponent {
  @ViewChild('testBtnVC', { read: ElementRef })
  public testBtnCr!: ElementRef<HTMLButtonElement>;
  public dialogPositionStyle: any = {};
  public isRecording = false;
  public controlFirstTimeData = true;
  public showTestPanel = false;
  public showSavePanel = false;
  public showSavedTestsPanel = false;
  public showConfigurationPanel = false;
  public cypressCommands: string[] = [];
  public interceptors: string[] = [];

  // Estado de los modales
  public isCommandsDialogOpen = false;
  public isSavedTestsDialogOpen = false;
  public isSaveTestDialogOpen = false;
  public isSettingsDialogOpen = false;
  public isAdvancedEditorDialogOpen = false;
  private testPrevisualizerCompRef: any = null;

  constructor(
    private readonly e2eService: LibE2eCypressForDummysService,
    private readonly persistService: LibE2eCypressForDummysPersistentService,
    private readonly transformationService: LibE2eCypressForDummysTransformationService,
    public readonly translation: TranslationService,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly injector: Injector,
    private readonly constructorService: LibE2eCypressForDummysConstructorService
  ) {
    this.constructorService.injectSwal2Styles(
      LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES
    );
    this.initSubscriptions();
    this.getHttpConfigurations();
    this.initializeLanguage();
    this.checkAndRequestFilePermission();
  }
  /**
   * Inicializa todas las suscripciones a observables del servicio E2E.
   * Centraliza la lógica reactiva del componente.
   */
  private initSubscriptions(): void {
    this.e2eService.isRecordingObservable().subscribe((val: any) => {
      this.isRecording = val;
      if (this.isRecording === false && this.controlFirstTimeData === false) {
        this.showSaveTestDialog();
      }
      this.controlFirstTimeData = false;
    });
    this.e2eService.getCommands$().subscribe((commands) => {
      this.cypressCommands = commands;
      if (this.testPrevisualizerCompRef) {
        this.testPrevisualizerCompRef.instance.cypressCommands = commands;
        this.testPrevisualizerCompRef.changeDetectorRef.detectChanges();
      }
    });
    this.e2eService.getInterceptors$().subscribe((interceptors) => {
      this.interceptors = interceptors;
      if (this.testPrevisualizerCompRef) {
        this.testPrevisualizerCompRef.instance.interceptors = interceptors;
        this.testPrevisualizerCompRef.changeDetectorRef.detectChanges();
      }
    });
  }

  /**
   * Inicializa el idioma al cargar el componente.
   */
  private initializeLanguage(): void {
    this.setLanguage();
  }

  public toggle(): void {
    this.e2eService.toggleRecording();
  }

  /**
   * Limpia comandos e interceptores tras guardar un test y notifica al previsualizador.
   * Centraliza la lógica de limpieza post-guardado.
   */
  private clearTestData(): void {
    this.e2eService.clearCommands();
    this.cypressCommands = [];
    this.interceptors = [];
    this.showSavePanel = false;
  }

  //#region CallBAcks de componentes hijos
  public onSaveTest(description: string | null): void {
    if (description) {
      const commands = this.cypressCommands;
      const interceptors = this.interceptors;
      this.persistService
        .insertTest(description, commands, interceptors)
        .subscribe((id) => {
          // No hace nada extra
        });
      if (this.e2eService.clearInterceptors) {
        this.e2eService.clearInterceptors();
      }
    }
    this.clearTestData();
  }

  public onSaveAndExportTest(description: string | null): void {
    if (description) {
      const commands = this.cypressCommands;
      const interceptors = this.interceptors;
      this.persistService
        .insertTest(description, commands, interceptors)
        .subscribe((id) => {
          if (id) {
            this.showAdvancedEditorDialogWithTestId(id);
          }
        });
      if (this.e2eService.clearInterceptors) {
        this.e2eService.clearInterceptors();
      }
    }
    this.clearTestData();
  }

  public showAdvancedEditorDialogWithTestId(testId: any): void {
    this.openSwalModal({
      title: this.translation.translate('MAIN_FRAME.SHOW_ADVANCED_EDITOR'),
      containerId: 'commands-advanced-editor-modal-content',
      component: AdvancedTestEditorComponent,
      stateFlag: 'isAdvancedEditorDialogOpen',
      inputs: { testId },
    });
  }

  /**
   * Callback centralizado para acciones de componentes hijos.
   * Permite extender fácilmente la gestión de eventos de hijos.
   */
  public handleChildEvent(event: { type: string; payload?: any }): void {
    if (event.type === 'saveTest') {
      this.onSaveTest(event.payload);
    }
  }
  //#endregion CallBAcks de componentes hijos

  //#region Accesos rápidos
  @HostListener('window:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this.toggle();
    } else if (event.ctrlKey && event.key.toLowerCase() === '1') {
      event.preventDefault();
      this.showSavedTestsDialog();
    } else if (event.ctrlKey && event.key.toLowerCase() === '2') {
      event.preventDefault();
      this.showCommandsDialog();
    } else if (event.ctrlKey && event.key.toLowerCase() === '3') {
      event.preventDefault();
      this.showSettingsDialog();
    }
  }
  //#endregion Accesos rápidos

  //#region configurciones generales de la aplicación
  private getHttpConfigurations(): void {
    this.persistService.getExtendedHttpCommandsConfig().subscribe((tests) => {
      if (tests === null) {
        this.persistService
          .setConfig({ extendedHttpCommands: 'true' })
          .subscribe();
        localStorage.setItem('extendedHttpCommands', 'true');
      }
    });
  }

  /**
   * Cambia el idioma de la aplicación y actualiza la traducción.
   * Si no se pasa idioma, detecta automáticamente.
   */
  public setLanguage(lang?: string): void {
    const language = lang
      ? this.transformationService.toLang(lang)
      : this.translation.detectLang();
    this.translation.setLang(language);
  }
  //#endregion configurciones generales de la aplicación

  //#region Paneles de la aplicación

  /**
   * Abre un modal SweetAlert2 reutilizable para todos los diálogos del componente.
   * Centraliza la gestión de apertura, cierre, drag y atributos data-cy.
   * @param options Opciones del modal (título, id de contenedor, componente, inputs, estado, callback opcional)
   */
  private openSwalModal(options: SwalModalOptions) {
    const { stateFlag } = options;
    if ((this as any)[stateFlag]) {
      Swal.close();
      this.setModalFlag(stateFlag, false);
      return;
    }
    // Reutiliza el tipo y pasa el flag como string para el servicio
    const config = this.constructorService.buildSwalModalConfig(
      { ...options, stateFlag: stateFlag as string },
      this
    );
    Swal.fire(config);
    // Hacer el modal SweetAlert2 redimensionable usando el servicio
    setTimeout(() => {
      const popup = Swal.getPopup();
      if (popup) {
        this.constructorService.makeModalResizable(popup, {
          minWidth: 400,
          minHeight: 200,
        });
      }
    }, 0);
  }

  public showAdvancedEditorDialog(): void {
    this.openSwalModal({
      title: this.translation.translate('MAIN_FRAME.SHOW_ADVANCED_EDITOR'),
      containerId: 'commands-advanced-editor-modal-content',
      component: AdvancedTestEditorComponent,
      stateFlag: 'isAdvancedEditorDialogOpen',
    });
  }

  public showCommandsDialog(): void {
    this.openSwalModal({
      title: this.translation.translate('MAIN_FRAME.DIALOG_COMMANDS'),
      containerId: 'commands-modal-content',
      component: TestPrevisualizerComponent,
      inputs: {
        cypressCommands: this.cypressCommands,
        interceptors: this.interceptors,
      },
      stateFlag: 'isCommandsDialogOpen',
    });
  }

  public showSavedTestsDialog(): void {
    this.openSwalModal({
      title: this.translation.translate('MAIN_FRAME.DIALOG_SAVED_TESTS'),
      containerId: 'saved-tests-modal-content',
      component: TestEditorComponent,
      inputs: { visible: true },
      stateFlag: 'isSavedTestsDialogOpen',
    });
  }

  public showSaveTestDialog(): void {
    this.openSwalModal({
      title: this.translation.translate('MAIN_FRAME.DIALOG_SAVE'),
      containerId: 'save-test-modal-content',
      component: SaveTestComponent,
      stateFlag: 'isSaveTestDialogOpen',
    });
  }

  public showSettingsDialog(): void {
    this.openSwalModal({
      title: this.translation.translate('MAIN_FRAME.SETTINGS'),
      containerId: 'settings-modal-content',
      component: ConfigurationComponent,
      stateFlag: 'isSettingsDialogOpen',
    });
  }

  public clearAndCreateComponent<T>(
    containerId: string,
    component: any,
    inputs: Record<string, any> = {}
  ) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      container.setAttribute('data-cy', 'lib-e2e-cypress-for-dummys');
    }
    const compRef = this.viewContainerRef.createComponent(component, {
      injector: this.injector,
    });
    Object.assign(compRef.instance as any, inputs);
    if (container)
      container.appendChild((compRef.hostView as any).rootNodes[0]);
    Swal.getPopup()?.addEventListener('swalClose', () => compRef.destroy());
    // Suscribirse manualmente al output si es SaveTestComponent
    if (component === SaveTestComponent) {
      if ((compRef.instance as any).savetest) {
        (compRef.instance as any).savetest.subscribe((data: any) => {
          this.onSaveTest(data);
        });
      }
      if ((compRef.instance as any).saveAndExport) {
        (compRef.instance as any).saveAndExport.subscribe((data: any) => {
          this.onSaveAndExportTest(data);
        });
      }
    }
    // Suscribirse al cierre del AdvancedTestEditorComponent
    if (component === AdvancedTestEditorComponent) {
      if ((compRef.instance as any).closeModalPadre) {
        (compRef.instance as any).closeModalPadre.subscribe(() => {
          Swal.close();
        });
      }
    }
    if (component === TestPrevisualizerComponent) {
      this.testPrevisualizerCompRef = compRef;
    }
  }

  /**
   * Setea el flag de estado de modal de forma segura (solo para los booleanos de modal).
   */
  private setModalFlag(flag: keyof LibE2eRecorderComponent, value: boolean) {
    const allowedFlags = [
      'isCommandsDialogOpen',
      'isSavedTestsDialogOpen',
      'isSaveTestDialogOpen',
      'isSettingsDialogOpen',
      'isAdvancedEditorDialogOpen',
    ];
    if (allowedFlags.includes(flag as string)) {
      (this as any)[flag] = value;
    }
  }
  //#endregion Paneles de la aplicación

  //#region Acceso a archivos locales
  /**
   * Solicita al usuario acceso a un archivo local para leerlo y editarlo.
   * Devuelve el contenido y el handle para futuras escrituras.
   * Solo funciona en navegadores compatibles (Chrome, Edge, etc).
   */
  public async requestFileAccess(): Promise<{
    content: string;
    fileHandle: FileSystemFileHandle;
  } | null> {
    if (!('showOpenFilePicker' in window)) {
      alert(
        'Tu navegador no soporta el acceso directo a archivos locales. Prueba con Chrome o Edge.'
      );
      return null;
    }
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        multiple: false,
      });
      const file = await fileHandle.getFile();
      const content = await file.text();
      return { content, fileHandle };
    } catch (err) {
      return null;
    }
  }

  /**
   * Solicita al usuario acceso a una carpeta local (por ejemplo, la carpeta cypress) para leer y escribir archivos.
   * Guarda el handle serializado en la BBDD para futuras operaciones.
   * Solo funciona en navegadores compatibles (Chrome, Edge, etc).
   */
  public async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
    if (!('showDirectoryPicker' in window)) {
      alert(
        'Tu navegador no soporta el acceso directo a carpetas locales. Prueba con Chrome o Edge.'
      );
      return null;
    }
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      // Serializa el handle usando structuredClone y lo guarda en IndexedDB/configuración
      if ('showDirectoryPicker' in window && window.indexedDB) {
        // El handle es serializable con structuredClone y puede guardarse en IndexedDB
        await this.persistService
          .setConfigKey('cypressDirectoryHandle', dirHandle)
          .toPromise();
      }
      return dirHandle;
    } catch (err) {
      return null;
    }
  }

  private async checkAndRequestFilePermission(): Promise<void> {
    // Lee el nombre del proyecto desde la variable global JS
    const currentProjectName = (window as any).PROJECT_NAME || '';
    // Consulta la configuración
    const config = await this.persistService
      .getConfig('allowReadWriteFiles')
      .toPromise();
    const savedProjectName = await this.persistService
      .getConfig('projectName')
      .toPromise();

    // Si no hay config previa o el nombre de proyecto ha cambiado, solicita acceso
    if (
      config === null ||
      config === undefined ||
      savedProjectName.projectName !== currentProjectName
    ) {
      const result = await Swal.fire({
        title: '¿Permitir acceso de lectura/escritura a archivos locales?',
        text: 'La librería puede leer y editar archivos de tu proyecto local solo si das permiso. Se solicitará acceso a la carpeta donde se guardarán los tests automáticamente. Debes seleccionar la carpeta "cypress" de tu proyecto.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, permitir',
        cancelButtonText: 'No, nunca',
      });
      if (result.isConfirmed) {
        await this.persistService
          .setConfigKey('allowReadWriteFiles', 'true')
          .toPromise();
        await this.persistService
          .setConfigKey('projectName', currentProjectName)
          .toPromise();
        await this.requestDirectoryAccess();
      } else {
        await this.persistService
          .setConfigKey('allowReadWriteFiles', 'false')
          .toPromise();
      }
    }
    // Si ya está permitido y el nombre coincide, no hace nada
  }
  //#endregion Acceso a archivos locales
}
