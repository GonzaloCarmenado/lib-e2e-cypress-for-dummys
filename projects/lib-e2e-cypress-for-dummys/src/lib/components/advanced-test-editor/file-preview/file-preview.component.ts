import { Component, EventEmitter, Input, Output, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { EditorView, highlightSpecialChars, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldGutter } from '@codemirror/language';
import { history } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';

@Component({
  selector: 'file-preview-component',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  standalone: true,
  imports: [],
})
export class FilePreviewComponent implements AfterViewInit, OnChanges {
  @Input() fileName: string | null = null;
  @Input() fileContent: string | null = null;
  @Output() close = new EventEmitter<void>();
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;
  private editorView: EditorView | null = null;

  get language(): 'typescript' | 'javascript' {
    if (!this.fileName) return 'javascript';
    const ext = this.fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    return 'javascript';
  }

  ngAfterViewInit() {
    this.injectGlobalSelectionStyle();
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fileContent'] && this.editorView) {
      this.editorView.dispatch({
        changes: { from: 0, to: this.editorView.state.doc.length, insert: this.fileContent || '' }
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
      "& .cm-line": { caretColor: "#000" },
      "& .cm-content": { background: "#fff", color: "#222" },
      "& .cm-editor": { background: "#fff", color: "#222" },
      "& .cm-cursor": { borderLeft: "2px solid #000" }
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
        whiteCaretTheme
      ]
    });
    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.nativeElement
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

  onClose() {
    this.close.emit();
  }
}
