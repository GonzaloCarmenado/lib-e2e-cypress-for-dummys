import { Component } from '@angular/core';

@Component({
  selector: 'configuration-component',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  standalone: true,
})
export class ConfigurationComponent {
  public isRecording = false;

  constructor() {
    
  }

}
