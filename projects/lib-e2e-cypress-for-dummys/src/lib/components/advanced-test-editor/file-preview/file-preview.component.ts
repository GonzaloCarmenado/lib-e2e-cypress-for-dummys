import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CodemirrorWrapperComponent } from './code-mirror/codemirror-wrapper.component';
@Component({
  selector: 'file-preview-component',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  standalone: true,
  imports: [CommonModule, CodemirrorWrapperComponent],
})
export class FilePreviewComponent {
  @Input() fileName: string | null = null;
  @Input() fileContent: string | null = null;
  @Output() close = new EventEmitter<void>();

  get language(): 'typescript' | 'javascript' {
    if (!this.fileName) return 'javascript';
    const ext = this.fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    return 'javascript';
  }

  onClose() {
    this.close.emit();
  }
}
