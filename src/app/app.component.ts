import { Component } from '@angular/core';
import { LibE2eCypressForDummysService } from '../../projects/lib-e2e-cypress-for-dummys/src/public-api';
import {
  ClientModel,
  CommonConnectorClientsService,
} from '@gonzalocarmenado/common-connector-clients';
import { environment } from './environments/environment';
import { StandarResponse } from '@gonzalocarmenado/general-http-core-hub';
import { LibE2eRecorderComponent } from '../../projects/lib-e2e-cypress-for-dummys/src/lib/lib-e2e-cypress-for-dummys.component';
import { AppTranslationService } from './services/translations.service';
@Component({
  selector: 'app-root',
  imports: [LibE2eRecorderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public translation: AppTranslationService;
  constructor(
    private readonly clientService: CommonConnectorClientsService,
    translation: AppTranslationService
  ) {
    this.translation = translation;
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
  public getClient(): Promise<ClientModel> {
    return new Promise((resolve, reject) => {
      this.clientService
        .getClientById(environment.testAPI, 2)
        .then((client: StandarResponse<ClientModel>) => {
          resolve(client.data);
        })
        .catch((message: Error) => {
          reject(message instanceof Error ? message : new Error(message));
        });
    });
  }

  public postClient(): Promise<number> {
    const clientData: ClientModel = new ClientModel();
    clientData.name = 'Test Client';
    clientData.email = 'test@tes.com';
    clientData.phone = '123456789';
    clientData.lastname = 'Test 2';
    clientData.secondLastname = 'Test 3';
    clientData.createdAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.clientService
        .postNewClient(environment.testAPI, clientData)
        .then((saveClientResponse: StandarResponse<ClientModel>) => {
          resolve(saveClientResponse.status);
        })
        .catch((message: Error) => {
          reject(message instanceof Error ? message : new Error(message));
        });
    });
  }
}
