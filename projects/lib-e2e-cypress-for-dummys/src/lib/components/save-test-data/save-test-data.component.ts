import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/lib-e2e-cypress-for-dummys-translate.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'save-test-data-component',
  templateUrl: './save-test-data.component.html',
  styleUrls: ['./save-test-data.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SaveTestComponent {
  /**
   * Emite la respuesta del usuario al padre. Si se envia Cualquier valor distinto de null implica que el usuario
   * a guardado el test. Si se envia null, implica que el usuario ha cancelado la acción de guardar.
   * @memberof SaveTestComponent
   */
  @Output() private savetest = new EventEmitter<string | null>();
  @Output() private saveAndExport = new EventEmitter<string | null>();

  /**
   * Controla el paso de guardado para mostrar la diferentes pantallas
   * @type {('ask' | 'desc')}
   * @memberof SaveTestComponent
   */
  public step: 'ask' | 'desc' = 'ask';

  /**
   * Guarda la descripción de la prueba para construir el it();
   * @memberof SaveTestComponent
   */
  public description = '';

  public translation = inject(TranslationService);

  public askSave(): void {
    this.step = 'desc';
  }

  public confirmSave(): void {
    this.savetest.emit(this.description.trim());
    Swal.close();
  }

  public confirmSaveAndExport(): void {
    this.saveAndExport.emit(this.description.trim());
    Swal.close();
  }

  public cancel(): void {
    this.savetest.emit(null);
    Swal.close();
  }

  /**
   * Deja el componente en su estado original para la próxima ves que se abra.
   * @memberof SaveTestComponent
   */
  public restartComponent(): void {
    this.step = 'ask';
    this.description = '';
  }
}
