import { Component, Input, OnInit } from '@angular/core';
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
export class TestEditorComponent implements OnInit {
  /**
   * Permite controlar cuando se deben recargar los tests.
   * Por defecto es false, y se activa cuando se abre el componente.(Quizas esto se merezca una revisión a futuro)
   * @memberof TestEditorComponent
   */
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

  public ngOnInit() {
    this.loadTests();
  }

  /**
   * Copia un texto al portapapeles.
   * @param {string} text - Texto a copiar al portapapeles.
   * @memberof TestEditorComponent
   */
  public copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }

  /**
   * Copia los interceptores de un test específico al portapapeles.
   * @param {number} testId - ID del test cuyos interceptores se van a copiar.
   * @memberof TestEditorComponent
   */
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
  public loadTests(): void {
    this.persistService
      .getAllTests()
      .subscribe((tests) => (this.tests = tests));
  }

  /**
   * Alterna la expansión de un test específico. Si el índice del test es el mismo que el índice expandido,
   * lo colapsa; de lo contrario, expande el test seleccionado.
   * Si se expande un test, también carga los interceptores asociados a ese test si aún no se han cargado.
   * @param {number} index - Índice del test a expandir o colapsar.
   * @memberof TestEditorComponent
   */
  public toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
    if (this.expandedIndex !== null) {
      const test = this.tests[this.expandedIndex];
      // Los interceptores ya vienen en test.interceptors (nuevo modelo)
      if (test?.id && !this.interceptorsByTest[test.id]) {
        this.interceptorsByTest[test.id] = Array.isArray(test.interceptors)
          ? test.interceptors
          : [];
      }
    }
  }

  /**
   * Elimina un test específico por su ID. Llama al servicio de persistencia para eliminar el test
   * y luego recarga la lista de tests.
   * @param {number} id - ID del test a eliminar.
   * @memberof TestEditorComponent
   */
  public deleteTest(id: number): void {
    this.persistService.deleteTest(id).subscribe(() => this.loadTests());
  }

  /**
   * Verifica si un test tiene interceptores asociados.
   * @param {number} testId - ID del test a verificar.
   * @return {boolean} - Retorna true si el test tiene interceptores, false en caso contrario.
   * @memberof TestEditorComponent
   */
  public hasInterceptors(testId: number): boolean {
    return (
      Array.isArray(this.interceptorsByTest[testId]) &&
      this.interceptorsByTest[testId].length > 0
    );
  }
}
