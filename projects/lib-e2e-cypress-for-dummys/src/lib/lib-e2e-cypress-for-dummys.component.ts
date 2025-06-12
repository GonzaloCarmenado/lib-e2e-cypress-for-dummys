import { Component, inject } from '@angular/core';
import { LibE2eCypressForDummysService } from './lib-e2e-cypress-for-dummys.service';
import {
  MatDialog,
} from '@angular/material/dialog';
import { ConfigurationComponent } from './configurations/configuration.component';
@Component({
  selector: 'lib-e2e-recorder',
  templateUrl: './lib-e2e-cypress-for-dummys.component.html',
  styleUrls: ['./lib-e2e-cypress-for-dummys.component.scss'],
  standalone: true,
})
export class LibE2eRecorderComponent {
  public isRecording = false;
  private readonly dialog = inject(MatDialog);

  constructor(private e2eService: LibE2eCypressForDummysService) {
    this.e2eService.isRecordingObservable().subscribe((val: any) => {
      this.isRecording = val;
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
}
