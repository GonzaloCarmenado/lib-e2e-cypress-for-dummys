import { Component } from '@angular/core';
import { LibE2eCypressForDummysService } from '../../projects/lib-e2e-cypress-for-dummys/src/public-api';
import {
  ClientModel,
  CommonConnectorClientsService,
} from '@gonzalocarmenado/common-connector-clients';
import { environment } from './environments/environment';
import { StandarResponse } from '@gonzalocarmenado/general-http-core-hub';
@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private commands: string[] = [];
  private interceptors: string[] = [];

  constructor(private service: LibE2eCypressForDummysService,
    private readonly clientService: CommonConnectorClientsService
  ) {
    this.service.getCommands$().subscribe(list => this.commands = list);
    this.service.getInterceptors$().subscribe(list => this.interceptors = list);
  }

  public clear() {
    this.service.clearCommands();
  }

  public getCommands() {
    console.log(this.commands);
    console.log(this.interceptors);
  }



  public getClientList(): Promise<ClientModel[]> {
    return new Promise((resolve, reject) => {
      this.clientService
        .getClientList(environment.testAPI)
        .then((clientList: StandarResponse<ClientModel[]>) => {
          resolve(clientList.data);
        })
        .catch((message: Error) => {
          reject(message instanceof Error ? message : new Error(message));
        });
    });
  }
}
