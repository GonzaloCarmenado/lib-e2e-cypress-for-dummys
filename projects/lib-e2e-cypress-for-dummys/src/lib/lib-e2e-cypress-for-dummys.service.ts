import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysService {
  private commandList$ = new BehaviorSubject<string[]>([]);
  private inputDebounceTimers = new Map<HTMLElement, any>();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.listenToClicks();
    this.listenToInput();
  }

  private listenToClicks(): void {
    this.document.addEventListener('click', (event: MouseEvent) => {
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
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target) return;

      const inputTypes = ['text', 'password', 'email', 'search', 'tel', 'url', 'number', 'textarea'];
      const isTextInput =
        target.tagName.toLowerCase() === 'textarea' ||
        (target.tagName.toLowerCase() === 'input' && inputTypes.includes(target.type));

      if (!isTextInput) return;

      const clickable = target.closest<HTMLElement>('[data-cy], [id]');
      if (!clickable) return;

      // Limpia cualquier temporizador anterior para este input
      if (this.inputDebounceTimers.has(target)) {
        clearTimeout(this.inputDebounceTimers.get(target));
      }

      // Ponemos un debounce de 500ms (ajustable)
      this.inputDebounceTimers.set(target, setTimeout(() => {
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
      }, 1000));
    });
  }

  private addCommand(cmd: string): void {
    const current = this.commandList$.getValue();
    this.commandList$.next([...current, cmd]);
  }

  getCommands$() {
    return this.commandList$.asObservable();
  }

  getCommandsSnapshot(): string[] {
    return this.commandList$.getValue();
  }

  clearCommands(): void {
    this.commandList$.next([]);
  }
}
