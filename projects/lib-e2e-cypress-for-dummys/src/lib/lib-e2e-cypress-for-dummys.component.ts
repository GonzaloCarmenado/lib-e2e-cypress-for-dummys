import { Component, ElementRef, HostListener, ViewChild, ViewEncapsulation, ViewContainerRef, ComponentFactoryResolver, Injector } from '@angular/core';
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
  imports: [
    DialogModule,
    TestPrevisualizerComponent,
    SaveTestComponent,
    TestEditorComponent,
    ConfigurationComponent,
  ],
})
export class LibE2eRecorderComponent {
  @ViewChild('testBtnVC', { read: ElementRef })
  public testBtnCr!: ElementRef<HTMLButtonElement>;
  @ViewChild('saveTestVC') public saveTestCR!: SaveTestComponent;
  public dialogPositionStyle: any = {};
  public isRecording = false;
  public controlFirstTimeData = true;
  public showTestPanel = false;
  public showSavePanel = false;
  public showSavedTestsPanel = false;
  public showConfigurationPanel = false;
  public cypressCommands: string[] = [];
  public interceptors: string[] = [];

  private testPrevisualizerCompRef: any = null;

  constructor(
    private readonly e2eService: LibE2eCypressForDummysService,
    private readonly persistService: LibE2eCypressForDummysPersistentService,
    private readonly transformationService: LibE2eCypressForDummysTransformationService,
    public readonly translation: TranslationService,
    private viewContainerRef: ViewContainerRef,
    private cfr: ComponentFactoryResolver,
    private injector: Injector
  ) {
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
    this.showCommandsDialog();
  }
  public openSavedTestsPanel(): void {
    this.showSavedTestsDialog();
  }

  public saveTestDataPanel(): void {
    this.showSaveTestDialog();
  }

  private clearAndCreateComponent<T>(containerId: string, component: any, inputs: Record<string, any> = {}) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
    const compRef = this.viewContainerRef.createComponent(this.cfr.resolveComponentFactory(component), undefined, this.injector);
    Object.assign(compRef.instance as any, inputs);
    if (container) container.appendChild((compRef.hostView as any).rootNodes[0]);
    Swal.getPopup()?.addEventListener('swalClose', () => compRef.destroy());
    // Guarda la referencia si es el previsualizador
    if (component === TestPrevisualizerComponent) {
      this.testPrevisualizerCompRef = compRef;
    }
  }

  public showCommandsDialog(): void {
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
        this.clearAndCreateComponent('commands-modal-content', TestPrevisualizerComponent, {
          cypressCommands: this.cypressCommands,
          interceptors: this.interceptors
        });
      },
    });
  }

  public showSavedTestsDialog(): void {
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
        this.clearAndCreateComponent('saved-tests-modal-content', TestEditorComponent, {
          visible: true
        });
      },
    });
  }

  public showSaveTestDialog(): void {
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
        this.clearAndCreateComponent('save-test-modal-content', SaveTestComponent, {
          // Puedes pasar más inputs si es necesario
        });
      },
    });
  }

  public showSettingsDialog(): void {
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
        this.clearAndCreateComponent('settings-modal-content', ConfigurationComponent);
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

  //#region CallBAcks de componentes hijos
  public onSaveTest(description: string | null): void {
    this.saveTestCR.restartComponent();
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
    this.showSavePanel = false;
    this.e2eService.clearCommands();
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
