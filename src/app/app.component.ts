import { Component } from '@angular/core';
import { LibE2eCypressForDummysService } from '../../projects/lib-e2e-cypress-for-dummys/src/public-api';
import {
  ClientModel,
  CommonConnectorClientsService,
} from '@gonzalocarmenado/common-connector-clients';
import { environment } from './environments/environment';
import { StandarResponse } from '@gonzalocarmenado/general-http-core-hub';
import { LibE2eRecorderComponent } from '../../projects/lib-e2e-cypress-for-dummys/src/lib/lib-e2e-cypress-for-dummys.component';
@Component({
  selector: 'app-root',
  imports: [LibE2eRecorderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(private readonly clientService: CommonConnectorClientsService) {}

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
