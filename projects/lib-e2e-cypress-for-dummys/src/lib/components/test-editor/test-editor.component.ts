import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LibE2eCypressForDummysPersistentService } from '../../services/lib-e2e-cypress-for-dummys-persist.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'test-editor-component',
  templateUrl: './test-editor.component.html',
  styleUrls: ['./test-editor.component.scss'],
  standalone: true,
  imports: [DatePipe]
})
export class TestEditorComponent implements OnChanges {
  @Input() public visible = false;
  public tests: any[] = [];
  public expandedIndex: number | null = null;

  constructor(private persistService: LibE2eCypressForDummysPersistentService) { }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue) {
      this.loadTests();
    }
  }

  public copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  public loadTests() {
    this.persistService.getAllTests().subscribe(tests => this.tests = tests);
  }

  public toggleExpand(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  public deleteTest(id: number) {
    this.persistService.deleteTest(id).subscribe(() => this.loadTests());
  }
}