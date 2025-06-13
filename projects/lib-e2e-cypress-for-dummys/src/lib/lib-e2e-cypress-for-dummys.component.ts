import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { LibE2eCypressForDummysService } from './lib-e2e-cypress-for-dummys.service';
import {
  MatDialog,
} from '@angular/material/dialog';
import { ConfigurationComponent } from './components/configurations/configuration.component';
import { DialogModule } from 'primeng/dialog';
import { TestPrevisualizerComponent } from './components/test-previsualizer/test-previsualizer.component';
@Component({
  selector: 'lib-e2e-recorder',
  templateUrl: './lib-e2e-cypress-for-dummys.component.html',
  styleUrls: ['./lib-e2e-cypress-for-dummys.component.scss'],
  standalone: true,
  imports: [
    DialogModule,
    TestPrevisualizerComponent]
})
export class LibE2eRecorderComponent {
  @ViewChild('testBtn', { read: ElementRef }) testBtn!: ElementRef<HTMLButtonElement>;
  public dialogPositionStyle: any = {};
  public isRecording = false;
  public showTestPanel = false;
  public cypressCommands: string[] = [];
  private readonly dialog = inject(MatDialog);

  constructor(private e2eService: LibE2eCypressForDummysService) {
    this.e2eService.isRecordingObservable().subscribe((val: any) => {
      this.isRecording = val;
    });
    this.e2eService.getCommands$().subscribe(commands => {
      this.cypressCommands = commands;
    });
  }

  public toggle(): void {
    this.e2eService.toggleRecording();
  }

  public openSettings(): void {
    const dialogRef = this.dialog.open(ConfigurationComponent, {
      height: '400px',
      width: '600px',
    });

    dialogRef.afterClosed().subscribe(result => {

    });
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
          let left = btnRect.left + window.scrollX + (btnRect.width / 2) - (dialogWidth / 2);
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
}
