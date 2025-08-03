import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LibE2eCypressForDummysPersistentService } from '../../services/lib-e2e-cypress-for-dummys-persist.service';
import { TranslationService } from '../../services/lib-e2e-cypress-for-dummys-translate.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
/**
 * Componente de configuración de la aplicación. Permite seleccionar un idioma, utilziar la configuración
 * avanzada de comandos HTTP y exportar/importar datos. La configuración avanzada de HTTP permite que los get por id,
 * post y put generen las validaciones del objeto recibido / enviado
 * @export
 * @class ConfigurationComponent
 */
@Component({
  selector: 'configuration-component',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ConfigurationComponent implements OnInit {
  /**
   * Controla la visibilidad de la sección de exportación de datos.
   * @type {boolean}
   * @memberof ConfigurationComponent
   */
  public showExportSection = true;
  /**
   * Controla la visibilidad de la sección de importación de datos.
   * @type {boolean}
   * @memberof ConfigurationComponent
   */
  public showGeneralSection = true;
  /**
   * Idioma seleccionado por el usuario. Por defecto es español.
   * @type {string}
   * @memberof ConfigurationComponent
   */
  public selectedLanguage = 'es';
  /**
   * Lista de idiomas soportados por la aplicación.
   * Cada objeto contiene un valor y una etiqueta para mostrar en el selector de idioma.
   * @type {Array<{ value: string, label: string }>}
   * @memberof ConfigurationComponent
   */
  public supportedLanguages = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' },
    { value: 'de', label: 'Deutsch' },
  ];
  public translation = inject(TranslationService);
  public advancedHttpConfig =
    localStorage.getItem('extendedHttpCommands') === 'true';
  private readonly persistService = inject(LibE2eCypressForDummysPersistentService);

  constructor() {
    this.persistService.getGeneralConfig().subscribe((config) => {
      if (config?.language) {
        this.selectedLanguage = config.language;
        this.translation.setLang(
          config.language as import('../../services/lib-e2e-cypress-for-dummys-translate.service').Lang
        );
      }
    });
  }

  public ngOnInit(): void {
    // Sincroniza el valor con localStorage al iniciar
    this.advancedHttpConfig =
      localStorage.getItem('extendedHttpCommands') === 'true';
  }

  /**
   * Actualiza el idioma de la aplicación y lo guarda en la configuración persistente.
   * @param {Event} event - El evento del cambio de idioma.
   * @memberof ConfigurationComponent
   */
  public onLanguageChange(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value;
    this.translation.setLang(
      lang as any as import('../../services/lib-e2e-cypress-for-dummys-translate.service').Lang
    );
    this.persistService.setConfig({ language: lang }).subscribe();
  }

  /**
   * Maneja el cambio de la configuración avanzada de comandos HTTP.
   * @param {Event} event - El evento del cambio de configuración avanzada. (true o false)
   * @memberof ConfigurationComponent
   */
  public onAdvancedHttpConfigChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.advancedHttpConfig = checked;
    localStorage.setItem('extendedHttpCommands', checked ? 'true' : 'false');
    this.persistService
      .setConfig({ extendedHttpCommands: checked ? 'true' : 'false' })
      .subscribe();
  }

  /**
   * Exporta todos los datos de pruebas e interceptores a un archivo JSON.
   * Utiliza el servicio de persistencia para obtener todos los tests e interceptores, y los exporta para
   * poder ser importados en otra máquina
   * @memberof ConfigurationComponent
   */
  public exportAllData(): void {
    // Refactor: completamente reactivo y con control de errores
    this.exportAllDataAsync();
  }

  private async exportAllDataAsync(): Promise<void> {
    try {
      const [tests, interceptors] = await Promise.all([
        firstValueFrom(this.persistService.getAllTests()),
        firstValueFrom(this.persistService.getAllInterceptors()),
      ]);
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
    } catch (error:unknown) {
      alert('Error al exportar los datos.');
      console.error('Error exporting data:', error);
    }
  }

  /**
   * Importa todos los datos de pruebas e interceptores desde un archivo JSON.
   * Utiliza el servicio de persistencia para limpiar los datos actuales y luego ingesta los datos del archivo importado.
   * El JSON debe terner el formato con el que se exportan los datos.
   * @param {Event} event - El evento del cambio de archivo. Fichero txt con el formato JSON
   * @return {*}  {void}
   * @memberof ConfigurationComponent
   */
  public importAllData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importAllDataFromFile(file)
      .then(() => alert('Datos importados correctamente.'))
      .catch((e) =>
        alert(e.message || 'Error al importar el fichero. ¿Es un JSON válido?')
      );
    input.value = '';
  }

  private async importAllDataFromFile(file: File): Promise<void> {
    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('El archivo no es un JSON válido.');
    }
    if (
      !data ||
      !Array.isArray(data.tests) ||
      !Array.isArray(data.interceptors)
    ) {
      throw new Error('El archivo no tiene el formato esperado.');
    }
    await firstValueFrom(this.persistService.clearAllData());
    await this.persistService.ingestFileData(data.tests, data.interceptors);
  }
}
