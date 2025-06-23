import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

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
  constructor() {}

  public ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  public copyToClipboard(): void {
    if (!this.cypressCommands || this.cypressCommands.length === 0) {
      return;
    }
    const text = this.cypressCommands.join('\n');
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
}
