import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { EditorView, keymap, highlightSpecialChars, drawSelection, EditorViewConfig } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { history, historyKeymap } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';

@Component({
  selector: 'codemirror-wrapper',
  template: `<div #editorContainer class="codemirror-container"></div>`,
  styleUrls: ['./codemirror-wrapper.component.scss'],
    standalone: true,
})
export class CodemirrorWrapperComponent implements AfterViewInit, OnChanges {
  @Input() code: string = '';
  @Input() readOnly: boolean = true;
  @Input() language: 'typescript' | 'javascript' = 'javascript';
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;
  private editorView: EditorView | null = null;

  ngAfterViewInit() {
    this.initEditor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['code'] && this.editorView) {
      this.editorView.dispatch({
        changes: { from: 0, to: this.editorView.state.doc.length, insert: this.code || '' }
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
    const state = EditorState.create({
      doc: this.code,
      extensions: [
        highlightSpecialChars(),
        history(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        indentOnInput(),
        bracketMatching(),
        foldGutter(),
        autocompletion(),
        langExtension,
        EditorView.editable.of(!this.readOnly)
      ]
    });
    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.nativeElement
    });
  }
}
