import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private defaultConfirmText = 'ตกลง';

  private fire(icon: SweetAlertIcon, title: string, text?: string) {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: this.defaultConfirmText
    });
  }

  success(title: string, text?: string) {
    return this.fire('success', title, text);
  }

  error(title: string, text?: string) {
    return this.fire('error', title, text);
  }

  warning(title: string, text?: string) {
    return this.fire('warning', title, text);
  }

  info(title: string, text?: string) {
    return this.fire('info', title, text);
  }

  toast(options: { title: string; text?: string; icon?: SweetAlertIcon; timer?: number }) {
    const { title, text, icon = 'success', timer = 2000 } = options;
    return Swal.fire({
      icon,
      title,
      text,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true
    });
  }
}
