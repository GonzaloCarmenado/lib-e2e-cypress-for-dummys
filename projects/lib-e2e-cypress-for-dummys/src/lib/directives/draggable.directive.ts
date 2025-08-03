import { Directive, ElementRef, HostListener, Renderer2, AfterViewInit, inject } from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective implements AfterViewInit {
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private origX = 0;
  private origY = 0;
  private hasMoved = false;
  private dragTarget!: HTMLElement;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'move');
  }

  public ngAfterViewInit(): void {
    // Buscar el primer ancestro con la clase 'preview-modal'
    let parent = this.el.nativeElement.parentElement;
    while (parent && !parent.classList.contains('preview-modal')) {
      parent = parent.parentElement;
    }
    this.dragTarget = parent || this.el.nativeElement;
    this.renderer.setStyle(this.dragTarget, 'z-index', '1000');
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent): void {
    // Solo permitir drag con el botón izquierdo
    if (event.button !== 0) return;
    this.isDragging = true;
    this.hasMoved = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    // Guardar la posición real del modal ANTES de cualquier cambio
    const rect = this.dragTarget.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.origX = rect.left + scrollLeft;
    this.origY = rect.top + scrollTop;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (!this.hasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
      if (getComputedStyle(this.dragTarget).position !== 'fixed') {
        this.renderer.setStyle(this.dragTarget, 'position', 'fixed');
        this.renderer.setStyle(this.dragTarget, 'transform', 'none');
        this.renderer.setStyle(this.dragTarget, 'left', `${this.origX - (window.pageXOffset || document.documentElement.scrollLeft)}px`);
        this.renderer.setStyle(this.dragTarget, 'top', `${this.origY - (window.pageYOffset || document.documentElement.scrollTop)}px`);
      }
      this.hasMoved = true;
    }
    if (this.hasMoved) {
      this.renderer.setStyle(this.dragTarget, 'left', `${this.origX + dx - (window.pageXOffset || document.documentElement.scrollLeft)}px`);
      this.renderer.setStyle(this.dragTarget, 'top', `${this.origY + dy - (window.pageYOffset || document.documentElement.scrollTop)}px`);
    }
  }

  @HostListener('document:mouseup')
  public onMouseUp(): void {
    this.isDragging = false;
    this.hasMoved = false;
  }
}
