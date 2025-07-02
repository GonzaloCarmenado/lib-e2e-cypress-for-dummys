import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { INPUT_TYPES } from '../models/input-types.model';

//TODO:
// - Desactivar o modificar el debounce de los inputs.
// - Control de errores mejorados. Si un selector no funciona o hay dudas sobre si su implementación es correcta, avisar al usuario.
// - Inspector de cypress. Un botón que permita al usuario inspeccionar el elemento y ver el comando Cypress generado (esto se deberá integrar
//   de forma que ese selector especial pare la grabación para que no se pierda el orden.).
// - Tener una ventana de previsualización de pruebas, donde se pueda ver el código generado y hacer arreglos rápidos
@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysService {
  /**
   * Almacena y emite los comandos Cypress generados por las interacciones del usuario. Solo captura eventos
   * de clics, entradas de texto y cambios en selectores... no almacena otro tipo de interacción como interceptores, ficheros... sin embargo
   * si almacena los comandos de cypres para llamar a interceptores.
   * Se inicializa como un BehaviorSubject con un array vacío.
   * @private
   * @memberof LibE2eCypressForDummysService
   */
  private commandList$ = new BehaviorSubject<string[]>([]);
  /**
   * Almacena y emite los interceptores registrados. Se inicializa como un BehaviorSubject con un array vacío.
   * Los interceptores se registran con un método, una URL y un alias. Automáticamente se genera el comando cy.wait('@${alias}').then((interception) => { })
   * y se añade a la variable {@link commandList$}
   * @private
   * @memberof LibE2eCypressForDummysService
   */
  private interceptors$ = new BehaviorSubject<string[]>([]);
  /**
   * Indica si se está grabando o no. Se inicializa como false.
   * Este valor se utiliza para determinar si se deben capturar los eventos del DOM y generar comandos Cypress solo cuando el usuario
   * quiere, evitando problemas de generar comandos basura.
   * @private
   * @memberof LibE2eCypressForDummysService
   */
  private isRecording$ = new BehaviorSubject<boolean>(false);
  /**
   * Mapa para almacenar los temporizadores de debounce de los inputs. Se utiliza para evitar que se generen múltiples comandos
   * Cypress al escribir en un input (uno por cada letra), aplicando un debounce de 1s.
   * @private
   * @memberof LibE2eCypressForDummysService
   */
  private inputDebounceTimers = new Map<HTMLElement, any>();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.listenToClicks();
    this.listenToInput();
    this.listenToSelect();
  }

  //#region Listener para los diferentes eventos del DOM
  /**
   * Escucha los eventos de clic en el documento y genera comandos Cypress para los elementos clicados.
   * Se basa en atributos `data-cy` o `id` para generar selectores confiables.
   * Si no se puede generar un selector confiable, se añade un comentario indicando el problema.
   * @private
   */
  private listenToClicks(): void {
    this.document.addEventListener('click', (event: Event) => {
      let target = event.target as HTMLElement;
      if (!target) return;

      // Si el target no es interactivo y es un span, busca si su padre directo es un button con [data-cy] o [id]
      if (!this.isInteractiveElement(target)) {
        if (
          target.tagName.toLowerCase() === 'span' &&
          target.parentElement &&
          target.parentElement.tagName.toLowerCase() === 'button' &&
          (target.parentElement.hasAttribute('data-cy') ||
            target.parentElement.hasAttribute('id'))
        ) {
          target = target.parentElement;
        } else {
          return;
        }
      }

      // Si el elemento es un input, textarea o select, NO grabar el click (solo grabar el type/select en esos casos)
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      const container = target.closest<HTMLElement>('[data-cy], [id]');
      if (!container) return;

      const selector = this.getReliableSelector(container);
      let cyCommand = '';

      // Evita grabar comandos sobre la propia librería
      if (selector === '[data-cy="lib-e2e-cypress-for-dummys"]') return;

      if (selector) {
        cyCommand = `cy.get('${selector}').click()`;
      } else {
        cyCommand = '// No se pudo generar un selector confiable para click';
      }
      this.addCommand(cyCommand);
    });
  }

  /**
   * Escucha los eventos de entrada de texto en inputs y textareas, generando comandos Cypress para limpiar y escribir el valor.
   * Utiliza un debounce de 1 segundo para evitar generar múltiples comandos al escribir rápidamente.
   * @private
   * @memberof LibE2eCypressForDummysService
   */
  private listenToInput(): void {
    this.document.addEventListener('input', (event: Event) => {
      if (!this.isRecording$.getValue()) return;
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target) return;

      const isTextInput =
        target.tagName.toLowerCase() === 'textarea' ||
        (target.tagName.toLowerCase() === 'input' &&
          INPUT_TYPES.includes(target.type));

      if (!isTextInput) return;

      const clickable = target.closest<HTMLElement>('[data-cy], [id]');
      if (!clickable) return;

      if (this.inputDebounceTimers.has(target)) {
        clearTimeout(this.inputDebounceTimers.get(target));
      }

      this.inputDebounceTimers.set(
        target,
        setTimeout(() => {
          const selector = this.getReliableSelector(clickable);
          const value = target.value.replace(/'/g, "\\'");
          let cyCommand = '';

          // Evita grabar comandos sobre la propia librería
          if (selector === '[data-cy="lib-e2e-cypress-for-dummys"]') {
            this.inputDebounceTimers.delete(target);
            return;
          }

          if (selector) {
            cyCommand = `cy.get('${selector}').clear().type('${value}')`;
          } else {
            cyCommand = '// No se pudo generar un selector confiable para type';
          }

          this.addCommand(cyCommand);
          this.inputDebounceTimers.delete(target);
        }, 1000)
      );
    });
  }

  /**
   * Escucha los eventos de cambio en selectores (elementos <select>) y genera comandos Cypress para seleccionar el valor.
   * Utiliza atributos `data-cy` o `id` para generar selectores confiables.
   * @private
   * @memberof LibE2eCypressForDummysService
   */
  private listenToSelect(): void {
    this.document.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLSelectElement;
      if (!target || target.tagName.toLowerCase() !== 'select') return;

      const container = target.closest<HTMLElement>('[data-cy], [id]');
      if (!container) return;

      const selector = this.getReliableSelector(container);
      const selectedValue = target.value.replace(/'/g, "\\'");
      let cyCommand = '';

      // Evita grabar comandos sobre la propia librería
      if (selector === '[data-cy="lib-e2e-cypress-for-dummys"]') return;

      if (selector) {
        cyCommand = `cy.get('${selector}').select('${selectedValue}')`;
      } else {
        cyCommand = '// No se pudo generar un selector confiable para select';
      }
      this.addCommand(cyCommand);
    });
  }

  /**
   * Determina si el elemento objetivo es interactivo (input, select, textarea, option).
   * Esto se utiliza para evitar generar comandos innecesarios para elementos que no son interactivos. Por ejemplo,
   * al hacer click sobre un input o select, que no se genere un evento click, si no que se genere solo el evento de
   * type o select evitando código innecesario.
   * @private
   * @param {(EventTarget | null)} target Elemento que se ha seleccionado haciendo click sobre el
   * @return {*}  {boolean}
   * @memberof LibE2eCypressForDummysService
   */
  private isInteractiveElement(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    const tag = target.tagName.toLowerCase();

    // Estos tipos los maneja otro listener
    return (
      tag === 'select' ||
      tag === 'option' ||
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'button'
    );
  }

  //#endregion Listener para los diferentes eventos del DOM
  /**
   * Recibe una cadena de texto con el comando que se va a añadir a la lista de comandos.
   * @param {string} cmd Texto a añadir
   * @memberof LibE2eCypressForDummysService
   */
  public addCommand(cmd: string): void {
    if (this.isRecording$.getValue()) {
      const current = this.commandList$.getValue();
      this.commandList$.next([...current, cmd]);
    }
  }

  //#region Interceptores
  /**
   * Genera el comando de cypress para crear un interceptor. Estos son añadidos a la lista de interceptores para diferenciarlos
   * del comando cy.wait('@${alias}').then((interception) => { }) que es el que se encarga de llamar al interceptor en la prueba
   * @param {string} method Tipo de método HTTP (GET, POST, PUT, DELETE...)
   * @param {string} url Url del endoint. para garantizar la utilización en distintos env, el patrón devuelto es **api/vx/xxxx**
   * @param {string} alias Recibe el alias que se va a utilizar para el interceptor.
   * @memberof LibE2eCypressForDummysService
   */
  public registerInterceptor(method: string, url: string, alias: string): void {
    const current = this.interceptors$.getValue();
    const command = `cy.intercept('${method}', '${this.urlToWildcard(
      url,
      method
    )}').as('${alias}')`;

    // Si el comando ya existe, no lo añade de nuevo
    // Esto evita que se dupliquen los interceptores en la lista
    if (!current.includes(command)) {
      this.interceptors$.next([...current, command]);
    }
  }

  public getInterceptors$() {
    return this.interceptors$.asObservable();
  }

  /**
   * Estandariza la url recibida para hacerla apta para diferentes entornos y filtros de Queystring
   * @private
   * @param {string} url Url del endpoint al que se ha llamado
   * @param {string} method Metodo del endpoint
   * @return {*}  {string}
   * @memberof LibE2eCypressForDummysService
   */
  private urlToWildcard(url: string, method: string): string {
    const u = new URL(url, 'http://localhost');
    // Si es GET y tiene query string, termina en /**
    if (method.toUpperCase() === 'GET' && u.search) {
      return `**${u.pathname}/**`;
    }
    // Para POST (y otros), solo el path
    return `**${u.pathname}`;
  }
  //#endregion Interceptores

  //#region Métodos publicos de comunicación con componente

  /**
   * Comienza a grabar los comandos de cypres. Activa todos los escuchadores de eventos.
   * También añade el comando `cy.viewport()` para establecer el tamaño de la ventana y `cy.visit()` para visitar la página actual.
   * @memberof LibE2eCypressForDummysService
   */
  public startRecording(): void {
    this.isRecording$.next(true);

    const pathname = window.location.pathname;
    const viewportWidth = 1900;
    const viewportHeight = 1200;

    this.addCommand(`cy.viewport(${viewportWidth}, ${viewportHeight})`);
    this.addCommand(`cy.visit('${pathname}')`);
    this.addCommand(
      `cy.get('[data-cy="lib-e2e-cypress-for-dummys"]').invoke('hide');`
    );
  }

  /**
   * Detiene la grabación de comandos de Cypress. Desactiva todos los escuchadores de eventos.
   * Imprime en consola los comandos generados y los interceptores registrados.
   * @memberof LibE2eCypressForDummysService
   */
  public stopRecording(): void {
    this.isRecording$.next(false);
    const interceptors = this.interceptors$.getValue();
  }

  /**
   * permite indicar al componente en que estado se encuentra la grabación.
   * Si se está grabando, se detiene la grabación y si no, se inicia. Tambien permite cambiar la
   * clase del botón para hacerla más intuitiva.
   * @memberof LibE2eCypressForDummysService
   */
  public toggleRecording(): void {
    const isRecording = this.isRecording$.getValue();
    if (isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  public isRecordingObservable() {
    return this.isRecording$.asObservable();
  }

  //#endregion Métodos publicos de comunicación con componente

  //#region Métodos miscelaneos
  public getCommands$() {
    return this.commandList$.asObservable();
  }

  public getCommandsSnapshot(): string[] {
    return this.commandList$.getValue();
  }

  public getInterceptorsSnapshot(): string[] {
    return this.interceptors$.getValue();
  }

  public clearInterceptors(): void {
    this.interceptors$.next([]);
  }
  /**
   * Borra todos los comandos Cypress almacenados en las listas.
   * @memberof LibE2eCypressForDummysService
   */
  public clearCommands(): void {
    this.commandList$.next([]);
    this.interceptors$.next([]);
  }

  /**
   * Devuelve el selector Cypress más fiable para un elemento: primero [data-cy], luego id si es "fiable".
   * Si no hay ninguno, devuelve null.
   */
  private getReliableSelector(element: HTMLElement): string | null {
    const dataCy = element.getAttribute('data-cy');
    const dataAtriCy = element.getAttribute('data.cy');
    if (dataCy) {
      return `[data-cy="${dataCy}"]`;
    } else if (dataAtriCy) {
      return `[data.cy="${dataAtriCy}"]`;
    }
    const id = element.id;
    // Filtros: descarta ids generados por frameworks o sospechosos
    const forbiddenPrefixes = [
      'cdk-',
      'mat-',
      'p-',
      'ng-',
      'mdc-',
      'primeng-',
      'auto-',
      'field-',
      'input-',
      'select-',
    ];
    const isCustomId =
      id &&
      id.length < 25 &&
      /^[a-zA-Z][\w-]*$/.test(id) &&
      !forbiddenPrefixes.some((prefix) => id.startsWith(prefix)) &&
      !/^\d+$/.test(id);

    if (isCustomId) {
      return `#${id}`;
    }
    return null;
  }

  //#endregion Métodos miscelaneos
}
