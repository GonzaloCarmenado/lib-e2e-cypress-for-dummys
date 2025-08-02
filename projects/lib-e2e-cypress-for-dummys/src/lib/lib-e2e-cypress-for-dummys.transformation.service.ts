import { Injectable } from '@angular/core';
import { Lang } from './services/lib-e2e-cypress-for-dummys-translate.service';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysTransformationService {
  /**
   * Valida/castea un string a Lang soportado, si no es válido retorna 'en'.
   */
  public toLang(lang: string): Lang {
    const defaultLangs: Lang[] = ['es', 'en', 'fr', 'it', 'de'];
    return (defaultLangs.includes(lang as Lang) ? lang : 'en') as Lang;
  }

  /**
   * Genera la estructura básica de un test 'it' de Cypress.
   * @param {string} description
   * @param {string[]} commands
   * @return {*}  {string}
   * @memberof LibE2eCypressForDummysTransformationService
   */
  public generateItDescription(
    description: string,
    commands: string[]
  ): string {
    const commandsBlock = commands.map((cmd) => `  ${cmd}`).join('\n');
    return `it('${description}', () => {\n${commandsBlock}\n});`;
  }
}
