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
  @Input() public cypressCommands: string[] = [];
  @Input() public interceptors: string[] = [];
  public showInterceptors = false;
  constructor(public translation: TranslationService) {}

  public ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  public toggleInterceptors(): void {
    this.showInterceptors = !this.showInterceptors;
  }

  public copyToClipboard(): void {
    const text = (this.cypressCommands || []).join('\n');
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

  public copyInterceptorsToClipboard(): void {
    const text = (this.interceptors || []).join('\n');
    if (!text) return;
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }
}
