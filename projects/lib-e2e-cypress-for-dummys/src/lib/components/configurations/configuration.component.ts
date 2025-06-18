import { Component } from '@angular/core';
import { LibE2eCypressForDummysPersistentService } from '../../services/lib-e2e-cypress-for-dummys-persist.service';

@Component({
  selector: 'configuration-component',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  standalone: true,
})
export class ConfigurationComponent {
    public showExportSection = true;
  constructor(
    private persistService: LibE2eCypressForDummysPersistentService
  ) {}

  public exportAllData(): void {
    Promise.all([
      this.persistService.getAllTests().toPromise(),
      this.persistService.getAllInterceptors().toPromise(),
    ]).then(([tests, interceptors]) => {
      const exportModel = { tests, interceptors };
      const blob = new Blob([JSON.stringify(exportModel, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'e2e-cypress-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  public importAllData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        await this.persistService.clearAllData().toPromise();
        await this.persistService.ingestFileData(data.tests, data.interceptors);
        alert('Datos importados correctamente.');
      } catch (e) {
        alert('Error al importar el fichero. ¿Es un JSON válido?');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }
}
