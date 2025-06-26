import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { LibE2eCypressForDummysService } from './services/lib-e2e-cypress-for-dummys.service';
import { DialogModule } from 'primeng/dialog';
import { TestPrevisualizerComponent } from './components/test-previsualizer/test-previsualizer.component';
import { SaveTestComponent } from './components/save-test-data/save-test-data.component';
import { LibE2eCypressForDummysPersistentService } from './services/lib-e2e-cypress-for-dummys-persist.service';
import { LibE2eCypressForDummysTransformationService } from './lib-e2e-cypress-for-dummys.transformation.service';
import { TestEditorComponent } from './components/test-editor/test-editor.component';
import { ConfigurationComponent } from './components/configurations/configuration.component';
import { TranslationService } from './services/lib-e2e-cypress-for-dummys-translate.service';
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
  @ViewChild('testBtn', { read: ElementRef })
  public testBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('saveTestVC') public saveTestCR!: SaveTestComponent;
  public dialogPositionStyle: any = {};
  public isRecording = false;
  public controlFirstTimeData = true;
  public showTestPanel = false;
  public showSavePanel = false;
  public showSavedTestsPanel = false;
  public showConfigurationPanel = false;
  public cypressCommands: string[] = [];

  constructor(
    private readonly e2eService: LibE2eCypressForDummysService,
    private readonly persistService: LibE2eCypressForDummysPersistentService,
    private readonly transformationService: LibE2eCypressForDummysTransformationService,
    public readonly translation: TranslationService
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
    this.showConfigurationPanel = !this.showConfigurationPanel;
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
        const btnRect = this.testBtn.nativeElement.getBoundingClientRect();
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
            `position: absolute; left: ${left}px; top: ${top}px; width: 30rem; height: 25rem;`
          );
        }
      }, 0);
    }
  }
  public openSavedTestsPanel(): void {
    this.showSavedTestsPanel = !this.showSavedTestsPanel;
  }

  public saveTestDataPanel(): void {
    this.showSavePanel = true;
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
        .subscribe((id) => {
          console.log('Guardado con id', id);
        });
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
    console.log(event.key.toLowerCase());
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
      console.log(tests);
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
