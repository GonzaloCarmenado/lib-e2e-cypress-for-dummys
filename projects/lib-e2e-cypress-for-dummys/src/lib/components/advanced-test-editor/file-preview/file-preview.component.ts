import {
  Component,
  EventEmitter,
  Input,
  Output,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { EditorView, highlightSpecialChars } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
} from '@codemirror/language';
import { history } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { CommonModule } from '@angular/common';
import { DraggableDirective } from '../../../directives/draggable.directive';
import { LibE2eCypressForDummysConstructorService } from '../../../lib-e2e-cypress-for-dummys.constructor.service';

@Component({
  selector: 'file-preview-component',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  standalone: true,
  imports: [CommonModule, DraggableDirective],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class FilePreviewComponent implements AfterViewInit, OnChanges {
  @Input() public fileName: string | null = null;
  @Input() public fileContent: string | null = null;
  @Input() public commands: string[] = [];
  @Input() public interceptors: string[] = [];
  @Input() public itBlock: string = '';
  @Output() public closeEmitter = new EventEmitter<void>();
  @Output() public saveEmitter = new EventEmitter<string>();
  @ViewChild('editorContainer', { static: true })
  public editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('modal', { static: true })
  public modalRef!: ElementRef<HTMLDivElement>;
  private editorView: EditorView | null = null;

  public selectedText: string = '';

  private readonly constructorService = inject(
    LibE2eCypressForDummysConstructorService
  );

  public get language(): 'typescript' | 'javascript' {
    if (!this.fileName) return 'javascript';
    const ext = this.fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    return 'javascript';
  }

  public ngAfterViewInit(): void {
    this.centerModal();
    this.injectGlobalSelectionStyle();
    this.initEditor();
    // Forzar caret-color negro en .cm-line para CodeMirror
    if (this.editorContainer?.nativeElement) {
      const style = document.createElement('style');
      style.innerHTML = `
        .cm-line { caret-color: #000 !important; }
      `;
      // Inyectar en el shadowRoot del editor si existe
      if (this.editorContainer.nativeElement.shadowRoot) {
        this.editorContainer.nativeElement.shadowRoot.appendChild(style);
      } else {
        this.editorContainer.nativeElement.appendChild(style);
      }
    }
    // Hacer el modal redimensionable usando el servicio
    setTimeout(() => {
      if (this.modalRef?.nativeElement) {
        this.constructorService.makeModalResizable(this.modalRef.nativeElement);
      }
    }, 0);
    // Escuchar mouseup y keyup para detectar selección finalizada
    const container = this.editorContainer.nativeElement;
    container.addEventListener('mouseup', this.handleSelectionEnd.bind(this));
    container.addEventListener('keyup', this.handleSelectionEnd.bind(this));
  }

  private handleSelectionEnd(): void {
    if (this.editorView) {
      const sel = this.editorView.state.sliceDoc(
        this.editorView.state.selection.main.from,
        this.editorView.state.selection.main.to
      );
      this.selectedText = sel;
      console.log('Texto seleccionado (on selection end):', sel);
      this.highlightDataCyElements(sel);
    }
  }

  private highlightDataCyElements(selectedText: string): void {
    // Eliminar marcas anteriores
    document.querySelectorAll('.data-cy-highlight').forEach((el) => {
      el.classList.remove('data-cy-highlight');
    });
    // Buscar todos los data-cy="..."
    const regex = /data-cy\s*=\s*"([^"]+)"/g;
    let match;
    const found: string[] = [];
    while ((match = regex.exec(selectedText)) !== null) {
      found.push(match[1]);
    }
    // Añadir clase a los elementos encontrados
    found.forEach((dataCy) => {
      const els = document.querySelectorAll(`[data-cy="${dataCy}"]`);
      els.forEach((el) => el.classList.add('data-cy-highlight'));
    });
    // Añadir la clase CSS si no existe
    if (!document.getElementById('data-cy-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'data-cy-highlight-style';
      style.innerHTML = `.data-cy-highlight { outline: 2px solid red !important; background: rgba(255,0,0,0.08) !important; }`;
      document.head.appendChild(style);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['fileContent'] && this.editorView) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: this.fileContent || '',
        },
      });
    }
  }

  private initEditor(): void {
    if (this.editorView) return;
    let langExtension;
    if (this.language === 'typescript') {
      langExtension = javascript({ typescript: true });
    } else {
      langExtension = javascript();
    }
    const blackCaretTheme = EditorView.theme({
      '& .cm-line': { caretColor: '#000' },
      '& .cm-content': { background: '#fff', color: '#222' },
      '& .cm-editor': { background: '#fff', color: '#222' },
      '& .cm-cursor': {
        borderLeft: '2px solid #000 !important',
        background: 'none !important',
      },
    });

    const state = EditorState.create({
      doc: this.fileContent || '',
      extensions: [
        highlightSpecialChars(),
        history(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        indentOnInput(),
        bracketMatching(),
        foldGutter(),
        autocompletion(),
        langExtension,
        EditorView.editable.of(true),
        blackCaretTheme,
      ],
    });
    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.nativeElement,
    });
  }

  private injectGlobalSelectionStyle(): void {
    const styleId = 'cm-global-selection-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .cm-editor .cm-selectionBackground, 
      .cm-editor ::selection, 
      .cm-editor ::-moz-selection {
        background: #1976d2 !important;
        color: #fff !important;
      }
      .cm-editor .cm-selectionMatch {
        background: #1976d2 !important;
      }
    `;
    document.head.appendChild(style);
  }

  private centerModal(): void {
    // Centrar el modal en la pantalla solo al abrir
    setTimeout(() => {
      const modal = this.modalRef?.nativeElement;
      if (!modal) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { width, height } = modal.getBoundingClientRect();
      const left = (vw - width) / 2;
      const top = (vh - height) / 2;
      modal.style.position = 'fixed';
      modal.style.left = `${left}px`;
      modal.style.top = `${top}px`;
      modal.style.transform = 'none';
    });
  }

  public onClose(): void {
    this.closeEmitter.emit();
  }

  public saveFile(): void {
    if (this.editorView) {
      const content = this.editorView.state.doc.toString();
      this.saveEmitter.emit(content);
      this.closeEmitter.emit();
    }
  }

  public copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }

  public launchTest(): void {
    const specPath = this.fileName ? `cypress/e2e/test.cy.ts` : '';
    const callbackUrl = 'http://localhost:9000/resultado';
    if (!specPath) {
      alert('No hay fichero de test seleccionado.');
      return;
    }
    // Lanzar el test
    fetch('http://localhost:8123/run-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specPath, callbackUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Prueba lanzada: ' + JSON.stringify(data));
        // Esperar el resultado del callback
        this.listenForTestResult();
      })
      .catch((err) => {
        alert('Error al lanzar la prueba: ' + err);
      });
  }

  private listenForTestResult(): void {
    fetch('http://localhost:8123/resultado/last')
      .then((res) => res.json())
      .then((result) => {
        if (result.error !== undefined) {
          setTimeout(() => this.listenForTestResult(), 2000);
        } else {
          console.log(result);
          console.log('Resultado Cypress recibido:', result.stdout);
          console.log('Resultado Cypress recibido:', result.stderr);
        }
      })
      .catch(() => {
        setTimeout(() => this.listenForTestResult(), 2000);
      });
  }
}
