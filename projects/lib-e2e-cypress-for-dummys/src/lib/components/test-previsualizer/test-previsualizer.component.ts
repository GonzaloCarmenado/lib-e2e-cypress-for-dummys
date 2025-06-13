import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'test-previsualizer-component',
  templateUrl: './test-previsualizer.component.html',
  styleUrls: ['./test-previsualizer.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TestPrevisualizerComponent {

  @Input() public cypressCommands: string[] = [];
  constructor() {
    
  }

}
