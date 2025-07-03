import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysConstructorService {
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
    const { title, containerId, component, inputs = {}, stateFlag, onClose } = params;
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
        componentContext.clearAndCreateComponent(containerId, component, inputs);
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
   */
  public makeSwalDraggable() {
    const swal = document.querySelector('.swal2-popup') as HTMLElement;
    const header = document.querySelector('.swal2-title') as HTMLElement;
    if (!swal || !header) return;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    header.style.cursor = 'move';
    header.onmousedown = (e: MouseEvent) => {
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
