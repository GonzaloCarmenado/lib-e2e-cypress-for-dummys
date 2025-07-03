import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedTestEditorComponent } from './advanced-test-editor.component';

describe('AdvancedTestEditorComponent', () => {
  let component: AdvancedTestEditorComponent;
  let fixture: ComponentFixture<AdvancedTestEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedTestEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedTestEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
