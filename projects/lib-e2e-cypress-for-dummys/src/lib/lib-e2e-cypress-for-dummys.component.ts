import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
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
import { TranslationService } from './services/lib-e2e-cypress-for-dummys-translate.service';
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
    this.getHttpConfigurations();
    this.changeLanguage();
  }

  private changeLanguage(): void {
    this.translation.setLang(this.translation.detectLang());
  }
  public toggle(): void {
    this.e2eService.toggleRecording();
  }

  public openSettings(): void {
    this.showSettingsDialog();
  }

  public openTestpanel(): void {
    this.showTestPanel = !this.showTestPanel;
    if (this.showTestPanel) {
      // Se requiere un timeout para que el modal se cargue correctamente en el DOM antes de calcular su posición.
      setTimeout(() => {
        // Para que el modal aparezca justo encima del botón, debemos calcular el tamaño inicial del
        // modal y obtener su posición. En caso de que exista (control para evitar errores), hacemos los cálculos
        // necesarios para evitar que se salga por los bordes de la pantalla. Finalmente, le decimos
        // el tamaño que debe tener el modal (aunque luego el usuario pueda editarlo).)
        const btnRect = this.testBtnCr.nativeElement.getBoundingClientRect();
        const dialog = document.querySelector('.p-dialog');
        if (dialog) {
          const dialogWidth = 480;
          const dialogHeight = 400;
          let left =
            btnRect.left + window.scrollX + btnRect.width / 2 - dialogWidth / 2;
          let top = btnRect.top + window.scrollY - dialogHeight - 8;

          // Evita que se salga por la izquierda
          if (left < 8) left = 8;
          // Evita que se salga por la derecha
          const maxLeft = window.innerWidth - dialogWidth - 8;
          if (left > maxLeft) left = maxLeft;

          // Si no cabe arriba, lo pone debajo del botón
          if (top < 8) top = btnRect.bottom + window.scrollY + 8;

          dialog.setAttribute(
            'style',
            `position: absolute; left: ${left}px; top: ${top}px; width: 480px; height: 400px;`
          );
        }
      }, 0);
    }
  }
  public openSavedTestsPanel(): void {
    this.showSavedTestsDialog();
  }

  public saveTestDataPanel(): void {
    this.showSaveTestDialog();
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

  public showCommandsDialog(): void {
    if (this.isCommandsDialogOpen) {
      Swal.close();
      this.isCommandsDialogOpen = false;
      return;
    }
    Swal.fire({
      title: this.translation.translate('MAIN_FRAME.DIALOG_COMMANDS'),
      html: '<div id="commands-modal-content"></div>',
      showCloseButton: true,
      showConfirmButton: false,
      width: 600,
      allowOutsideClick: false,
      backdrop: false,
      didOpen: () => {
        this.makeSwalDraggable();
        this.setSwal2DataCyAttribute();
        this.clearAndCreateComponent(
          'commands-modal-content',
          TestPrevisualizerComponent,
          {
            cypressCommands: this.cypressCommands,
            interceptors: this.interceptors,
          }
        );
        this.isCommandsDialogOpen = true;
      },
      willClose: () => {
        this.isCommandsDialogOpen = false;
      },
    });
  }

  public showSavedTestsDialog(): void {
    if (this.isSavedTestsDialogOpen) {
      Swal.close();
      this.isSavedTestsDialogOpen = false;
      return;
    }
    Swal.fire({
      title: this.translation.translate('MAIN_FRAME.DIALOG_SAVED_TESTS'),
      html: '<div id="saved-tests-modal-content"></div>',
      showCloseButton: true,
      showConfirmButton: false,
      width: 600,
      allowOutsideClick: false,
      backdrop: false,
      didOpen: () => {
        this.makeSwalDraggable();
        this.setSwal2DataCyAttribute();
        this.clearAndCreateComponent(
          'saved-tests-modal-content',
          TestEditorComponent,
          {
            visible: true,
          }
        );
        this.isSavedTestsDialogOpen = true;
      },
      willClose: () => {
        this.isSavedTestsDialogOpen = false;
      },
    });
  }

  public showSaveTestDialog(): void {
    if (this.isSaveTestDialogOpen) {
      Swal.close();
      this.isSaveTestDialogOpen = false;
      return;
    }
    Swal.fire({
      title: this.translation.translate('MAIN_FRAME.DIALOG_SAVE'),
      html: '<div id="save-test-modal-content"></div>',
      showCloseButton: true,
      showConfirmButton: false,
      width: 600,
      allowOutsideClick: false,
      backdrop: false,
      didOpen: () => {
        this.makeSwalDraggable();
        this.setSwal2DataCyAttribute();
        this.clearAndCreateComponent(
          'save-test-modal-content',
          SaveTestComponent,
          {
            // Puedes pasar más inputs si es necesario
          }
        );
        this.isSaveTestDialogOpen = true;
      },
      willClose: () => {
        this.isSaveTestDialogOpen = false;
      },
    });
  }

  public showSettingsDialog(): void {
    if (this.isSettingsDialogOpen) {
      Swal.close();
      this.isSettingsDialogOpen = false;
      return;
    }
    Swal.fire({
      title: this.translation.translate('MAIN_FRAME.SETTINGS'),
      html: '<div id="settings-modal-content"></div>',
      showCloseButton: true,
      showConfirmButton: false,
      width: 600,
      allowOutsideClick: false,
      backdrop: false,
      didOpen: () => {
        this.makeSwalDraggable();
        this.setSwal2DataCyAttribute();
        this.clearAndCreateComponent(
          'settings-modal-content',
          ConfigurationComponent
        );
        this.isSettingsDialogOpen = true;
      },
      willClose: () => {
        this.isSettingsDialogOpen = false;
      },
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
    // Limpiar comandos y notificar al previsualizador
    this.e2eService.clearCommands();
    this.cypressCommands = [];
    this.interceptors = [];
    this.showSavePanel = false;
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
}
