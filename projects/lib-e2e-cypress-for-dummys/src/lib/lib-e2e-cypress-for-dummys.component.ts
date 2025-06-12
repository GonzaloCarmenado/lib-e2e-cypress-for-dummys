import { Component } from '@angular/core';
import { LibE2eCypressForDummysService } from './lib-e2e-cypress-for-dummys.service';

@Component({
  selector: 'lib-e2e-recorder',
  templateUrl: './lib-e2e-cypress-for-dummys.component.html',
  styleUrls: ['./lib-e2e-cypress-for-dummys.component.scss'],
  standalone: true,
})
export class LibE2eRecorderComponent {
  isRecording = false;

  constructor(private e2eService: LibE2eCypressForDummysService) {
    this.e2eService.isRecordingObservable().subscribe((val: any) => {
      this.isRecording = val;
    });
  }

  toggle(): void {
    this.e2eService.toggleRecording();
  }
}
