import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { TranslationService } from '../../services/lib-e2e-cypress-for-dummys-translate.service';

@Component({
  selector: 'test-previsualizer-component',
  templateUrl: './test-previsualizer.component.html',
  styleUrls: ['./test-previsualizer.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TestPrevisualizerComponent {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('scrollCommands', { static: false }) private scrollCommands!: ElementRef;
  @ViewChild('scrollInterceptors', { static: false }) private scrollInterceptors!: ElementRef;
  @Input() public cypressCommands: string[] = [];
  @Input() public interceptors: string[] = [];
  /**
   * Controla la visibilidad de los interceptores en la previsualización.Está por defecto como false
   * para ganar algo de espacio en la pantalla, ya que es pequeña
   * @memberof TestPrevisualizerComponent
   */
  public showInterceptors = false;

  constructor(public translation: TranslationService) {}

  public ngAfterViewChecked() {
    this.scrollToBottom();
    this.scrollToBottomInterceptors();
  }

  /**
   * Desplaza el contenedor de la previsualización hacia abajo para mostrar los últimos comandos.
   * Se le llama cada vez que se añade un comando para garantizar que el usuario ve siempre el último
   * @private
   * @memberof TestPrevisualizerComponent
   */
  private scrollToBottom(): void {
    try {
      if (this.scrollCommands && this.scrollCommands.nativeElement) {
        this.scrollCommands.nativeElement.scrollTop = this.scrollCommands.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  private scrollToBottomInterceptors(): void {
    try {
      if (this.scrollInterceptors && this.scrollInterceptors.nativeElement && this.showInterceptors) {
        this.scrollInterceptors.nativeElement.scrollTop = this.scrollInterceptors.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  public toggleInterceptors(): void {
    this.showInterceptors = !this.showInterceptors;
  }

  /**
   * Copia el contenido de un array de strings al portapapeles.
   * @param items Array de strings a copiar
   */
  private copyArrayToClipboard(items: string[]): void {
    const text = (items || []).join('\n');
    if (!text) return;
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /** 
   * Copia los comandos de cypress
   * @memberof TestPrevisualizerComponent
   */
  public copyToClipboard(): void {
    this.copyArrayToClipboard(this.cypressCommands);
  }

  /**
   * Copia los interceptores al portapapeles.
   * @memberof TestPrevisualizerComponent
   */
  public copyInterceptorsToClipboard(): void {
    this.copyArrayToClipboard(this.interceptors);
  }
}
