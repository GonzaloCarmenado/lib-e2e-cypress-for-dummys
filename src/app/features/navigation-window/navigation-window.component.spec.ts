import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationWindowComponent } from './navigation-window.component';

describe('NavigationWindowComponent', () => {
  let component: NavigationWindowComponent;
  let fixture: ComponentFixture<NavigationWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationWindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
