import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysConstructorService {
  /**
   * Inyecta estilos personalizados para el scrollbar de los modales.
   * Se aplica a SweetAlert2 y a cualquier modal con clase .modal-resizer o .swal2-popup.
   */
  public injectModalScrollbarStyles(
    styleId = 'lib-e2e-cypress-scrollbar-styles'
  ) {
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* Scrollbar para SweetAlert2 y modales custom */
      .swal2-popup, .modal-resizer, .swal2-html-container, .swal2-content, .swal2-container, .modal {
        scrollbar-width: thin;
        scrollbar-color: #1976d2 #e0e0e0;
      }
      .swal2-popup::-webkit-scrollbar, .modal-resizer::-webkit-scrollbar, .swal2-html-container::-webkit-scrollbar, .swal2-content::-webkit-scrollbar, .swal2-container::-webkit-scrollbar, .modal::-webkit-scrollbar {
        width: 8px;
        background: #e0e0e0;
        border-radius: 8px;
      }
      .swal2-popup::-webkit-scrollbar-thumb, .modal-resizer::-webkit-scrollbar-thumb, .swal2-html-container::-webkit-scrollbar-thumb, .swal2-content::-webkit-scrollbar-thumb, .swal2-container::-webkit-scrollbar-thumb, .modal::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #1976d2 60%, #42a5f5 100%);
        border-radius: 8px;
        min-height: 24px;
      }
      .swal2-popup::-webkit-scrollbar-thumb:hover, .modal-resizer::-webkit-scrollbar-thumb:hover, .swal2-html-container::-webkit-scrollbar-thumb:hover, .swal2-content::-webkit-scrollbar-thumb:hover, .swal2-container::-webkit-scrollbar-thumb:hover, .modal::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #1565c0 60%, #1976d2 100%);
      }
      .swal2-popup::-webkit-scrollbar-track, .modal-resizer::-webkit-scrollbar-track, .swal2-html-container::-webkit-scrollbar-track, .swal2-content::-webkit-scrollbar-track, .swal2-container::-webkit-scrollbar-track, .modal::-webkit-scrollbar-track {
        background: #e0e0e0;
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
  }
  /**
   * Hace redimensionable cualquier modal pasado por referencia.
   * Retorna una función para limpiar listeners si el padre lo necesita.
   */
  public makeModalResizable(
    modal: HTMLElement,
    options?: { minWidth?: number; minHeight?: number }
  ) {
    if (!modal || modal.querySelector('.modal-resizer')) return () => {};
    modal.style.resize = 'both';
    modal.style.overflow = 'auto';
    modal.style.minWidth = (options?.minWidth || 320) + 'px';
    modal.style.minHeight = (options?.minHeight || 180) + 'px';
    modal.style.position = 'fixed';
    // Crear el resizer visual (esquina inferior derecha)
    const resizer = document.createElement('div');
    resizer.className = 'modal-resizer';
    resizer.style.position = 'absolute';
    resizer.style.width = '16px';
    resizer.style.height = '16px';
    resizer.style.right = '2px';
    resizer.style.bottom = '2px';
    resizer.style.cursor = 'nwse-resize';
    resizer.style.background = 'rgba(0,0,0,0.1)';
    resizer.style.zIndex = '10';
    modal.appendChild(resizer);
    // Lógica de resize manual
    let isResizing = false;
    let lastX = 0;
    let lastY = 0;
    const mouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const rect = modal.getBoundingClientRect();
      modal.style.width = rect.width + dx + 'px';
      modal.style.height = rect.height + dy + 'px';
    };
    const mouseUp = () => {
      isResizing = false;
      document.body.style.userSelect = '';
    };
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      lastX = e.clientX;
      lastY = e.clientY;
      document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
    // Retornar función para limpiar listeners si el padre lo necesita
    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', mouseUp);
      if (resizer.parentNode) resizer.parentNode.removeChild(resizer);
    };
  }
  /**
   * Devuelve la configuración para un modal SweetAlert2 reutilizable.
   * No ejecuta el modal, solo retorna el objeto de configuración.
   */
  public buildSwalModalConfig(
    params: {
      title: string;
      containerId: string;
      component: any;
      inputs?: Record<string, any>;
      stateFlag: string;
      onClose?: () => void;
    },
    componentContext: any
  ) {
    const {
      title,
      containerId,
      component,
      inputs = {},
      stateFlag,
      onClose,
    } = params;
    return {
      title,
      html: `<div id="${containerId}"></div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: 600,
      allowOutsideClick: false,
      backdrop: false,
      didOpen: () => {
        componentContext.constructorService.makeSwalDraggable();
        componentContext.constructorService.setSwal2DataCyAttribute();
        componentContext.clearAndCreateComponent(
          containerId,
          component,
          inputs
        );
        componentContext.setModalFlag(stateFlag, true);
      },
      willClose: () => {
        componentContext.setModalFlag(stateFlag, false);
        if (onClose) onClose();
      },
    };
  }
  public injectSwal2Styles(
    styles: string,
    styleId = 'lib-e2e-cypress-for-dummys-swal2-styles'
  ) {
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = styles;
    document.head.appendChild(style);
  }

  /**
   * Hace draggable el modal de SweetAlert2.
   * Ahora siempre actúa sobre el último modal abierto (el último .swal2-popup del DOM).
   */
  public makeSwalDraggable() {
    const popups = document.querySelectorAll('.swal2-popup');
    if (!popups.length) return;
    const swal = popups[popups.length - 1] as HTMLElement;
    let dragArea = swal.querySelector('.swal2-header') as HTMLElement;
    if (!dragArea) {
      dragArea = swal.querySelector('.swal2-title') as HTMLElement;
    }
    if (!swal || !dragArea) return;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    dragArea.style.cursor = 'move';
    dragArea.onmousedown = (e: MouseEvent) => {
      isDragging = true;
      const rect = swal.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.onmousemove = (ev: MouseEvent) => {
        if (isDragging) {
          swal.style.position = 'fixed';
          swal.style.margin = '0';
          swal.style.left = `${ev.clientX - offsetX}px`;
          swal.style.top = `${ev.clientY - offsetY}px`;
        }
      };
      document.onmouseup = () => {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  /**
   * Hace draggable el modal de SweetAlert2, buscando el swal2-popup que contenga el contentId indicado.
   * Si no se encuentra, hace fallback al primero.
   */
  public makeSwalDraggableByContentId(contentId: string) {
    // Busca el contenedor del contenido
    debugger;
    const content = document.getElementById(contentId);
    if (!content) {
      this.makeSwalDraggable(); // fallback
      return;
    }
    // Busca el swal2-popup que contenga este content
    let swal: HTMLElement | null = content.closest('.swal2-popup');
    if (!swal) {
      // fallback al primero
      swal = document.querySelector('.swal2-popup') as HTMLElement;
    }
    // Busca el header dentro de ese swal
    let dragArea = swal
      ? (swal.querySelector('.swal2-header') as HTMLElement)
      : null;
    if (!dragArea && swal) {
      dragArea = swal.querySelector('.swal2-title') as HTMLElement;
    }
    if (!swal || !dragArea) return;
    dragArea.style.cursor = 'move';
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    dragArea.onmousedown = (e: MouseEvent) => {
      isDragging = true;
      const rect = swal!.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.onmousemove = (ev: MouseEvent) => {
        if (isDragging) {
          swal!.style.position = 'fixed';
          swal!.style.margin = '0';
          swal!.style.left = `${ev.clientX - offsetX}px`;
          swal!.style.top = `${ev.clientY - offsetY}px`;
        }
      };
      document.onmouseup = () => {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  }

  /**
   * Añade el atributo data-cy a los contenedores de SweetAlert2.
   */
  public setSwal2DataCyAttribute(dataCy = 'lib-e2e-cypress-for-dummys') {
    const htmlContainer = document.querySelector('.swal2-html-container');
    if (htmlContainer) {
      htmlContainer.setAttribute('data-cy', dataCy);
    }
    const title = document.querySelector('.swal2-title');
    if (title) {
      title.setAttribute('data-cy', dataCy);
    }
  }
}
