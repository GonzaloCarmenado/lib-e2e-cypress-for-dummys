import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'save-test-data-component',
  templateUrl: './save-test-data.component.html',
  styleUrls: ['./save-test-data.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SaveTestComponent {
  /**
   * Emite la respuesta del usuario al padre. Si se envia Cualquier valor distinto de null implica que el usuario
   * a guardado el test. Si se envia null, implica que el usuario ha cancelado la acción de guardar.
   * @memberof SaveTestComponent
   */
  @Output() savetest = new EventEmitter<string | null>();

  public step: 'ask' | 'desc' = 'ask';
  public description = '';

  public askSave() {
    this.step = 'desc';
  }

  public confirmSave() {
    this.savetest.emit(this.description.trim());
  }

  public cancel() {
    this.savetest.emit(null);
  }
}