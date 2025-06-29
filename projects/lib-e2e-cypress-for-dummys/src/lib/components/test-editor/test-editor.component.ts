import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LibE2eCypressForDummysPersistentService } from '../../services/lib-e2e-cypress-for-dummys-persist.service';
import { DatePipe } from '@angular/common';
import { TranslationService } from '../../services/lib-e2e-cypress-for-dummys-translate.service';

@Component({
  selector: 'test-editor-component',
  templateUrl: './test-editor.component.html',
  styleUrls: ['./test-editor.component.scss'],
  standalone: true,
  imports: [DatePipe],
})
export class TestEditorComponent implements OnChanges {
  @Input() public visible = false;
  public tests: any[] = [];
  public expandedIndex: number | null = null;
  public interceptorsByTest!: { [testId: number]: string[] };
  public translation: TranslationService;

  constructor(
    private readonly persistService: LibE2eCypressForDummysPersistentService,
    translation: TranslationService
  ) {
    this.interceptorsByTest = {};
    this.translation = translation;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue) {
      this.loadTests();
    }
  }

  public copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  public copyInterceptors(testId: number): void {
    const interceptors = this.interceptorsByTest[testId];
    if (interceptors?.length) {
      navigator.clipboard.writeText(interceptors.join('\n'));
    }
  }
  /**
   * Carga todos los tests desde el servicio de persistencia y los asigna a la propiedad tests.
   * Se llama al iniciar el componente o cuando se cambia la visibilidad del componente.
   * @memberof TestEditorComponent
   */
  public loadTests():void {
    this.persistService
      .getAllTests()
      .subscribe((tests) => (this.tests = tests));
  }

  public toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
    if (this.expandedIndex !== null) {
      const test = this.tests[this.expandedIndex];
      if (test?.id && !this.interceptorsByTest[test.id]) {
        this.persistService
          .getInterceptorsByTestId(test.id)
          .subscribe((records) => {
            const allCommands = records.map((r) => r.commands).join('\n');
            this.interceptorsByTest[test.id] = allCommands
              ? allCommands
                  .split('\n')
                  .map((line) => line.trim())
                  .filter((line) => !!line)
              : [];
          });
      }
    }
  }

  public deleteTest(id: number) {
    this.persistService.deleteTest(id).subscribe(() => this.loadTests());
  }

  public hasInterceptors(testId: number): boolean {
    return (
      Array.isArray(this.interceptorsByTest[testId]) &&
      this.interceptorsByTest[testId].length > 0
    );
  }
}
