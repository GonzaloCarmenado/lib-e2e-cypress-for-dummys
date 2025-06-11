import { Component } from '@angular/core';
import { LibE2eCypressForDummysService } from '../../projects/lib-e2e-cypress-for-dummys/src/public-api';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
   private commands: string[] = [];

  constructor(private service: LibE2eCypressForDummysService) {
    this.service.getCommands$().subscribe(list => this.commands = list);
  }

  public clear() {
    this.service.clearCommands();
  }

  public getCommands() {
    return console.log(this.commands);
  }
}
