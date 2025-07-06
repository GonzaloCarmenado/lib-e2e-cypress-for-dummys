import { Directive, ElementRef, HostListener, Renderer2, AfterViewInit } from '@angular/core';

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

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'z-index', '1000');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'move');
  }

  ngAfterViewInit() {}

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.hasMoved = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (!this.hasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
      const rect = this.el.nativeElement.getBoundingClientRect();
      // Eliminar márgenes automáticos y transformaciones
      this.el.nativeElement.style.margin = '0';
      this.el.nativeElement.style.transform = 'none';
      // Calcular posición absoluta respecto al viewport y scroll
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      this.origX = rect.left + scrollLeft;
      this.origY = rect.top + scrollTop;
      this.renderer.setStyle(this.el.nativeElement, 'position', 'fixed');
      this.renderer.setStyle(this.el.nativeElement, 'left', `${rect.left}px`);
      this.renderer.setStyle(this.el.nativeElement, 'top', `${rect.top}px`);
      this.hasMoved = true;
    }
    if (this.hasMoved) {
      this.renderer.setStyle(this.el.nativeElement, 'left', `${this.origX + dx - (window.pageXOffset || document.documentElement.scrollLeft)}px`);
      this.renderer.setStyle(this.el.nativeElement, 'top', `${this.origY + dy - (window.pageYOffset || document.documentElement.scrollTop)}px`);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.hasMoved = false;
  }
}
