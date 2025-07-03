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
import { ConfigurationComponent } from './components/configurations/configuration.component';
import {
  TranslationService,
  Lang,
} from './services/lib-e2e-cypress-for-dummys-translate.service';
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
@Component({
  selector: 'lib-e2e-recorder',
  templateUrl: './lib-e2e-cypress-for-dummys.component.html',
  styleUrls: ['./lib-e2e-cypress-for-dummys.component.scss'],
  standalone: true,
  imports: [
    DialogModule,
    LibE2eRecorderComponent,
    SaveTestComponent,
    TestEditorComponent,
  ],
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
      // Nuevo modelo: nombre, comandos, interceptores
      const commands = this.cypressCommands;
      const interceptors = this.interceptors;
      this.persistService
        .insertTest(description, commands, interceptors)
        .subscribe((id) => {});
      if (this.e2eService.clearInterceptors) {
        this.e2eService.clearInterceptors();
      }
    }
    this.clearTestData();
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

  private clearAndCreateComponent<T>(
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
    if (component === SaveTestComponent && (compRef.instance as any).savetest) {
      (compRef.instance as any).savetest.subscribe((data: any) => {
        this.onSaveTest(data);
      });
    }
    // Guarda la referencia si es el previsualizador
    if (component === TestPrevisualizerComponent) {
      this.testPrevisualizerCompRef = compRef;
    }
  }

  /**
   * Setea el flag de estado de modal de forma segura (solo para los booleanos de modal).
   */
  private setModalFlag(flag: keyof LibE2eRecorderComponent, value: boolean) {
    // Solo permite modificar los flags de modales definidos
    const allowedFlags = [
      'isCommandsDialogOpen',
      'isSavedTestsDialogOpen',
      'isSaveTestDialogOpen',
      'isSettingsDialogOpen',
    ];
    if (allowedFlags.includes(flag as string)) {
      (this as any)[flag] = value;
    }
  }
  //#endregion Paneles de la aplicación
}
