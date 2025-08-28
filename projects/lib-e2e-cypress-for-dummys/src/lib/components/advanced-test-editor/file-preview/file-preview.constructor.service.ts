import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FilePreviewConstructorService {
  public showToast(message: string, isSuccess = true): void {
    const toast: HTMLDivElement = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '30px';
    toast.style.right = '30px';
    toast.style.padding = '16px 24px';
    toast.style.background = isSuccess ? '#4caf50' : '#f44336';
    toast.style.color = '#fff';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '1rem';
    toast.style.fontWeight = 'bold';
    toast.style.pointerEvents = 'none';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}
