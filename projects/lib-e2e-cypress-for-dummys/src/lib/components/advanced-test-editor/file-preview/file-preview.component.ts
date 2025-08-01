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
} from '@angular/core';
import {
  EditorView,
  highlightSpecialChars,
  drawSelection,
} from '@codemirror/view';
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
  @Input() fileName: string | null = null;
  @Input() fileContent: string | null = null;
  @Input() commands: string[] = [];
  @Input() interceptors: string[] = [];
  @Input() itBlock: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();
  @ViewChild('editorContainer', { static: true })
  editorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('modal', { static: true }) modalRef!: ElementRef<HTMLDivElement>;
  private editorView: EditorView | null = null;

  public selectedText: string = '';

  constructor(
    private readonly constructorService: LibE2eCypressForDummysConstructorService
  ) {}

  get language(): 'typescript' | 'javascript' {
    if (!this.fileName) return 'javascript';
    const ext = this.fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    return 'javascript';
  }

  public ngAfterViewInit() {
    this.centerModal();
    this.injectGlobalSelectionStyle();
    this.initEditor();
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

  private handleSelectionEnd() {
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

  private highlightDataCyElements(selectedText: string) {
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

  public ngOnChanges(changes: SimpleChanges) {
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

  private initEditor() {
    if (this.editorView) return;
    let langExtension;
    if (this.language === 'typescript') {
      langExtension = javascript({ typescript: true });
    } else {
      langExtension = javascript();
    }
    const whiteCaretTheme = EditorView.theme({
      '& .cm-line': { caretColor: '#000' },
      '& .cm-content': { background: '#fff', color: '#222' },
      '& .cm-editor': { background: '#fff', color: '#222' },
      '& .cm-cursor': { borderLeft: '2px solid #000' },
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
        whiteCaretTheme,
        // Elimina el updateListener de selección aquí
      ],
    });
    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.nativeElement,
    });
  }

  private injectGlobalSelectionStyle() {
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

  private centerModal() {
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

  public onClose() {
    this.close.emit();
  }

  public saveFile() {
    if (this.editorView) {
      const content = this.editorView.state.doc.toString();
      this.save.emit(content);
      this.close.emit();
    }
  }

  public copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
}
