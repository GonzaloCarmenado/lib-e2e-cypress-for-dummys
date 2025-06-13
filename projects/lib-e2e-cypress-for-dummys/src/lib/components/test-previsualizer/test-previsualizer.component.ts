import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'test-previsualizer-component',
  templateUrl: './test-previsualizer.component.html',
  styleUrls: ['./test-previsualizer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TestPrevisualizerComponent {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @Input() public cypressCommands: string[] = [];
  constructor() {
    
  }

  public ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

}
