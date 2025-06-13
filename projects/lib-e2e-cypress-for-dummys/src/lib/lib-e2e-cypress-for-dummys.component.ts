import { Component, inject } from '@angular/core';
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
  }
}
