import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
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
import { TranslationService, Lang } from './services/lib-e2e-cypress-for-dummys-translate.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'lib-e2e-recorder',
  templateUrl: './lib-e2e-cypress-for-dummys.component.html',
  styleUrls: ['./lib-e2e-cypress-for-dummys.component.scss'],
  standalone: true,
  imports: [DialogModule],
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
  private static swal2StyleInjected = false;

  // Utility to validate/cast a string to Lang
  defaultLangs: Lang[] = ['es', 'en', 'fr', 'it', 'de'];
  private toLang(lang: string): Lang {
    return (this.defaultLangs.includes(lang as Lang) ? lang : 'en') as Lang;
  }

  constructor(
    private readonly e2eService: LibE2eCypressForDummysService,
    private readonly persistService: LibE2eCypressForDummysPersistentService,
    private readonly transformationService: LibE2eCypressForDummysTransformationService,
    public readonly translation: TranslationService,
    private viewContainerRef: ViewContainerRef,
    private cfr: ComponentFactoryResolver,
    private injector: Injector
  ) {
    this.injectSwal2Styles();
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
        this.saveTestDataPanel();
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
   * Cambia el idioma de la aplicación y actualiza la traducción.
   * Si no se pasa idioma, detecta automáticamente.
   */
  public setLanguage(lang?: string): void {
    const language = lang ? this.toLang(lang) : this.translation.detectLang();
    this.translation.setLang(language);
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
    const compRef = this.viewContainerRef.createComponent(
      this.cfr.resolveComponentFactory(component),
      undefined,
      this.injector
    );
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

  private setSwal2DataCyAttribute() {
    const htmlContainer = document.querySelector('.swal2-html-container');
    if (htmlContainer) {
      htmlContainer.setAttribute('data-cy', 'lib-e2e-cypress-for-dummys');
    }
    const title = document.querySelector('.swal2-title');
    if (title) {
      title.setAttribute('data-cy', 'lib-e2e-cypress-for-dummys');
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

  /**
   * Abre un modal SweetAlert2 reutilizable para todos los diálogos del componente.
   * Centraliza la gestión de apertura, cierre, drag y atributos data-cy.
   * @param options Opciones del modal (título, id de contenedor, componente, inputs, estado, callback opcional)
   */
  private openSwalModal({
    title,
    containerId,
    component,
    inputs = {},
    stateFlag,
    onClose
  }: {
    title: string;
    containerId: string;
    component: any;
    inputs?: Record<string, any>;
    stateFlag: keyof LibE2eRecorderComponent;
    onClose?: () => void;
  }) {
    if ((this as any)[stateFlag]) {
      Swal.close();
      this.setModalFlag(stateFlag, false);
      return;
    }
    Swal.fire({
      title,
      html: `<div id="${containerId}"></div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: 600,
      allowOutsideClick: false,
      backdrop: false,
      didOpen: () => {
        this.makeSwalDraggable();
        this.setSwal2DataCyAttribute();
        this.clearAndCreateComponent(containerId, component, inputs);
        this.setModalFlag(stateFlag, true);
      },
      willClose: () => {
        this.setModalFlag(stateFlag, false);
        if (onClose) onClose();
      },
    });
  }

  // Refactoriza los métodos públicos de apertura de modales para usar el método centralizado
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

  /** Hace draggable el modal de SweetAlert2 */
  private makeSwalDraggable() {
    const swal = document.querySelector('.swal2-popup') as HTMLElement;
    const header = document.querySelector('.swal2-title') as HTMLElement;
    if (!swal || !header) return;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.style.cursor = 'move';
    header.onmousedown = (e: MouseEvent) => {
      isDragging = true;
      const rect = swal.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.onmousemove = (ev: MouseEvent) => {
        if (isDragging) {
          swal.style.position = 'fixed';
          swal.style.margin = '0';
          swal.style.left = `${ev.clientX - offsetX}px`;
          swal.style.top = `${ev.clientY - offsetY}px`;
        }
      };
      document.onmouseup = () => {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  /**
   * Esto es horrible, pasarlo a un servicio o algo en el futuro
   * @private
   * @return {*}
   * @memberof LibE2eRecorderComponent
   */
  private injectSwal2Styles() {
    if (LibE2eRecorderComponent.swal2StyleInjected) return;
    const style = document.createElement('style');
    style.id = 'lib-e2e-cypress-for-dummys-swal2-styles';
    style.innerHTML = `
.swal2-container, .swal2-popup {
  z-index: 99999 !important;
}
.swal2-popup {
  background: #181c24 !important;
  color: #fff !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid #232a3a !important;
  padding: 0 !important;
  min-width: 400px;
  max-width: 90vw;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.swal2-title {
  color: #2196f3 !important;
  font-weight: bold;
  font-size: 1.05rem;
  background: #181c24;
  border-radius: 12px 12px 0 0;
  padding: 10px 18px 6px 18px;
  margin-bottom: 0 !important;
  border-bottom: 1px solid #181c24;
}
.swal2-close {
  color: #fff !important;
  font-size: 1.5rem !important;
  top: 12px !important;
  right: 16px !important;
}
.swal2-html-container {
  background: #181c24;
  border-radius: 0 0 12px 12px;
  padding: 0 12px 12px 12px !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  overflow: auto;
}
`;
    document.head.appendChild(style);
    LibE2eRecorderComponent.swal2StyleInjected = true;
  }

  /**
   * Callback centralizado para acciones de componentes hijos.
   * Permite extender fácilmente la gestión de eventos de hijos.
   */
  public handleChildEvent(event: { type: string; payload?: any }): void {
    switch (event.type) {
      case 'saveTest':
        this.onSaveTest(event.payload);
        break;
      // Aquí se pueden añadir más casos para otros eventos de hijos
      default:
        break;
    }
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
      const completeTest: string =
        this.transformationService.generateItDescription(
          description,
          this.cypressCommands
        );
      // 1. Obtener interceptores actuales
      const interceptors = this.e2eService.getInterceptorsSnapshot();
      // 2. Pasar interceptores a insertTest
      this.persistService
        .insertTest(description, completeTest, interceptors)
        .subscribe((id) => {});
      // 3. Limpiar interceptores tras guardar
      if (this.e2eService.clearInterceptors) {
        this.e2eService.clearInterceptors();
      }
    }
    this.clearTestData();
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
      this.openSavedTestsPanel();
    } else if (event.ctrlKey && event.key.toLowerCase() === '2') {
      event.preventDefault();
      this.openTestpanel();
    } else if (event.ctrlKey && event.key.toLowerCase() === '3') {
      event.preventDefault();
      this.openSettings();
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
  //#endregion configurciones generales de la aplicación

  //#region Paneles de la aplicación
  /**
   * Abre cualquier panel/modal del sistema de forma unificada.
   * Si requiere posicionamiento flotante, lo aplica tras abrir el modal.
   * @param options Opciones del panel/modal
   */
  private openPanel({
    type,
    anchorRef,
    panelClass,
    width = 480,
    height = 400,
    showFlag,
    showDialogFn
  }: {
    type: 'floating' | 'modal',
    anchorRef?: ElementRef,
    panelClass?: string,
    width?: number,
    height?: number,
    showFlag: keyof LibE2eRecorderComponent,
    showDialogFn: () => void
  }) {
    (this as any)[showFlag] = !(this as any)[showFlag];
    if ((this as any)[showFlag]) {
      showDialogFn();
      if (type === 'floating' && anchorRef && panelClass) {
        this.openFloatingPanel(anchorRef, panelClass, width, height);
      }
    }
  }

  public openTestpanel(): void {
    this.openPanel({
      type: 'floating',
      anchorRef: this.testBtnCr,
      panelClass: '.p-dialog',
      showFlag: 'showTestPanel',
      showDialogFn: () => {}, // El panel se muestra por *ngIf, no SweetAlert2
    });
  }

  public openSavedTestsPanel(): void {
    this.openPanel({
      type: 'modal',
      showFlag: 'showSavedTestsPanel',
      showDialogFn: () => this.showSavedTestsDialog(),
    });
  }

  public saveTestDataPanel(): void {
    this.openPanel({
      type: 'modal',
      showFlag: 'showSavePanel',
      showDialogFn: () => this.showSaveTestDialog(),
    });
  }

  public openSettings(): void {
    this.openPanel({
      type: 'modal',
      showFlag: 'showConfigurationPanel',
      showDialogFn: () => this.showSettingsDialog(),
    });
  }

    /**
   * Abre un modal de tipo panel flotante (como el de comandos) con posicionamiento relativo a un elemento.
   * Centraliza la lógica de posicionamiento y apertura.
   * @param anchorRef ElementRef del elemento al que anclar el modal
   * @param panelClass Clase CSS del panel/modal
   * @param width Ancho del modal
   * @param height Alto del modal
   */
  private openFloatingPanel(
    anchorRef: ElementRef,
    panelClass: string,
    width = 480,
    height = 400
  ) {
    setTimeout(() => {
      const btnRect = anchorRef.nativeElement.getBoundingClientRect();
      const dialog = document.querySelector(panelClass) as HTMLElement;
      if (dialog) {
        let left = btnRect.left + window.scrollX + btnRect.width / 2 - width / 2;
        let top = btnRect.top + window.scrollY - height - 8;
        if (left < 8) left = 8;
        const maxLeft = window.innerWidth - width - 8;
        if (left > maxLeft) left = maxLeft;
        if (top < 8) top = btnRect.bottom + window.scrollY + 8;
        dialog.setAttribute(
          'style',
          `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px;`
        );
      }
    }, 0);
  }
  //#endregion Paneles de la aplicación
}
