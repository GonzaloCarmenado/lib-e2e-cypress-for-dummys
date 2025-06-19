import { Component } from '@angular/core';
import { LibE2eCypressForDummysService } from '../../projects/lib-e2e-cypress-for-dummys/src/public-api';
import {
  ClientModel,
  CommonConnectorClientsService,
} from '@gonzalocarmenado/common-connector-clients';
import { environment } from './environments/environment';
import { StandarResponse } from '@gonzalocarmenado/general-http-core-hub';
import { LibE2eRecorderComponent } from '../../projects/lib-e2e-cypress-for-dummys/src/lib/lib-e2e-cypress-for-dummys.component';
import { TranslationService } from '../../projects/lib-e2e-cypress-for-dummys/src/lib/services/lib-e2e-cypress-for-dummys-translate.service';
@Component({
  selector: 'app-root',
  imports: [LibE2eRecorderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public translation: TranslationService;
  constructor(
    private readonly clientService: CommonConnectorClientsService,
    translation: TranslationService
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
}
