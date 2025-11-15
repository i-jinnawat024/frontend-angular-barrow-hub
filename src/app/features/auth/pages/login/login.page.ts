import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true],
  });

  // Toggle this flag to expose the forgot-password navigation when needed
  protected readonly showForgotPasswordEntry = false;
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly authErrorMessage = signal('');

  protected readonly passwordInputType = computed(() =>
    this.passwordVisible() ? 'text' : 'password',
  );

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.authErrorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const { email, password, rememberMe } = this.loginForm.getRawValue();
      const result = await firstValueFrom(
        this.authService.login({
          email,
          password,
          rememberMe: rememberMe ?? true,
        }),
      );
      if (!result.success) {
        this.authErrorMessage.set(result.message ?? 'ไม่สามารถเข้าสู่ระบบได้ โปรดลองอีกครั้ง');
        return;
      }

      const redirect =
        this.route.snapshot.queryParamMap.get('redirect') ?? '/dashboard';
      await this.router.navigateByUrl(redirect === '/login' ? '/dashboard' : redirect, {
        replaceUrl: true,
      });
    } finally {
      this.submitting.set(false);
    }
  }

  protected hasError(controlName: 'email' | 'password', errorCode: string): boolean {
    const control = this.loginForm.get(controlName);
    if (!control) {
      return false;
    }

    return (
      control.hasError(errorCode) &&
      (control.dirty || control.touched || this.submitted())
    );
  }
}
