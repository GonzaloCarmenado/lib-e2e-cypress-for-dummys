import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysService {
  private commandList$ = new BehaviorSubject<string[]>([]);
  private inputDebounceTimers = new Map<HTMLElement, any>();
  private interceptors$ = new BehaviorSubject<string[]>([]);
  private isRecording$ = new BehaviorSubject<boolean>(false);

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.listenToClicks();
    this.listenToInput();
  }

  private listenToClicks(): void {
    this.document.addEventListener('click', (event: MouseEvent) => {
      if (!this.isRecording$.getValue()) return;

      const target = event.target as HTMLElement;
      if (!target) return;

      const clickable = target.closest<HTMLElement>('[data-cy], [id]');
      if (clickable) {
        const dataCy = clickable.getAttribute('data-cy');
        const id = clickable.id;

        let cyCommand = '';

        if (dataCy) {
          cyCommand = `cy.get('[data-cy="${dataCy}"]').click()`;
        } else if (id) {
          cyCommand = `cy.get('#${id}').click()`;
        } else {
          cyCommand = '// No se pudo generar un selector confiable para click';
        }

        this.addCommand(cyCommand);
      }
    });
  }

  private listenToInput(): void {
    this.document.addEventListener('input', (event: Event) => {
      if (!this.isRecording$.getValue()) return;
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target) return;

      const inputTypes = [
        'text',
        'password',
        'email',
        'search',
        'tel',
        'url',
        'number',
        'textarea',
      ];
      const isTextInput =
        target.tagName.toLowerCase() === 'textarea' ||
        (target.tagName.toLowerCase() === 'input' &&
          inputTypes.includes(target.type));

      if (!isTextInput) return;

      const clickable = target.closest<HTMLElement>('[data-cy], [id]');
      if (!clickable) return;

      // Limpia cualquier temporizador anterior para este input
      if (this.inputDebounceTimers.has(target)) {
        clearTimeout(this.inputDebounceTimers.get(target));
      }

      // Ponemos un debounce de 500ms (ajustable)
      this.inputDebounceTimers.set(
        target,
        setTimeout(() => {
          const dataCy = clickable.getAttribute('data-cy');
          const id = clickable.id;
          const value = target.value.replace(/'/g, "\\'");

          let cyCommand = '';

          if (dataCy) {
            cyCommand = `cy.get('[data-cy="${dataCy}"]').clear().type('${value}')`;
          } else if (id) {
            cyCommand = `cy.get('#${id}').clear().type('${value}')`;
          } else {
            cyCommand = '// No se pudo generar un selector confiable para type';
          }

          this.addCommand(cyCommand);

          // Limpiamos el timer almacenado
          this.inputDebounceTimers.delete(target);
        }, 1000)
      );
    });
  }

  public addCommand(cmd: string): void {
    const current = this.commandList$.getValue();
    this.commandList$.next([...current, cmd]);
  }

  //#region Interceptores

  public registerInterceptor(method: string, url: string, alias: string): void {
    const current = this.interceptors$.getValue();

    const command = `cy.intercept('${method}', '${this.urlToWildcard(
      url
    )}', (req) => {
  if (req.url.includes('${this.extractFilter(url)}')) {
    req.alias = '${alias}';
  }
});`;

    if (!current.includes(command)) {
      this.interceptors$.next([...current, command]);
    }
  }

  public getInterceptors$() {
    return this.interceptors$.asObservable();
  }

  private urlToWildcard(url: string): string {
    // Convierte a algo tipo '**/api/v1/RequestJob/**'
    const u = new URL(url, 'http://localhost');
    return `**${u.pathname}/**`;
  }

  private extractFilter(url: string): string {
    const u = new URL(url, 'http://localhost');
    return u.search || '';
  }
  //#endregion Interceptores

  public getCommands$() {
    return this.commandList$.asObservable();
  }

  public getCommandsSnapshot(): string[] {
    return this.commandList$.getValue();
  }

  public clearCommands(): void {
    this.commandList$.next([]);
  }

  //#region Métodos publicos de comunicación con componente
  public startRecording(): void {
    this.clearCommands();
    this.isRecording$.next(true);
  }

  public stopRecording(): void {
    this.isRecording$.next(false);
    console.log(
      'Comandos Cypress generados:\n',
      this.getCommandsSnapshot().join('\n')
    );
    const interceptors = this.interceptors$.getValue();
    console.log(
      '\n📡 Interceptores Cypress generados:\n',
      interceptors.join('\n')
    );
  }

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
}
