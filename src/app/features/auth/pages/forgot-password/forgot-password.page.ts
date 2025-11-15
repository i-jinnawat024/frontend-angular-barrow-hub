import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, ForgotPasswordResult } from '../../../../shared/services/auth.service';

type RequestStatus = 'idle' | 'success' | 'error';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly status = signal<RequestStatus>('idle');
  protected readonly response = signal<ForgotPasswordResult | null>(null);

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.status.set('idle');

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { email } = this.resetForm.getRawValue();
    this.submitting.set(true);

    try {
      const result = await firstValueFrom(this.authService.requestPasswordReset(email));
      this.response.set(result);
      this.status.set(result.success ? 'success' : 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  protected toLogin(): void {
    this.router.navigate(['/login']);
  }

  protected hasError(controlName: 'email', errorCode: string): boolean {
    const control = this.resetForm.get(controlName);
    if (!control) {
      return false;
    }

    return (
      control.hasError(errorCode) &&
      (control.dirty || control.touched || this.submitted())
    );
  }
}
