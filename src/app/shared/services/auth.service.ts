import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  refreshToken?: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  user?: AuthUser | null;
}

export interface ForgotPasswordResult {
  success: boolean;
  email: string;
  message: string;
  issuedAt: string;
}

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string | null;
  name?: string;
  exp?: number;
  iat?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenStorageKey = 'accessToken';
  private readonly userStorageKey = 'barrow-hub-auth-user';
  private readonly sessionTokenKey = `${this.tokenStorageKey}-session`;
  private readonly sessionUserKey = `${this.userStorageKey}-session`;
  private readonly loginEndpoint = `${environment.apiBaseUrl}/auth/login`;
  private readonly forgotEndpoint = `${environment.apiBaseUrl}/auth/forgot-password`;

  private readonly userState = signal<AuthUser | null>(null);
  private readonly tokenState = signal<string | null>(null);
  private readonly rememberState = signal<boolean>(true);

  readonly user = computed(() => this.userState());
  readonly token = computed(() => this.tokenState());
  readonly isAuthenticated = computed(() => {
    const token = this.tokenState();
    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  });

  constructor() {
    this.restoreSession();
  }

  login(credentials: LoginCredentials): Observable<LoginResult> {
    const email = credentials.email.trim();
    
    // Bypass authentication for admin@barrowhub.local with specific password
    if (email.toLowerCase() === 'admin@barrowhub.local' && credentials.password === 'superAdmin!121') {
      const mockUser: AuthUser = {
        id: 'admin-bypass-id',
        email: 'admin@barrowhub.local',
        name: 'Admin',
        role: 'admin',
      };
      
      // Create a mock JWT token that won't expire for a long time
      const mockToken = this.createMockToken(mockUser);
      
      this.persistSession(mockToken, mockUser, credentials.rememberMe);
      
      return of({
        success: true,
        user: mockUser,
      });
    }
    
    // If email matches but password is wrong, return error
    if (email.toLowerCase() === 'admin@barrowhub.local') {
      return of({
        success: false,
        message: 'รหัสผ่านไม่ถูกต้อง',
        user: null,
      });
    }

    const payload = {
      email: email,
      password: credentials.password,
    };

    return this.http.post<ApiResponse<LoginResponse>>(this.loginEndpoint, payload).pipe(
      map((response) => {
        const normalizedToken = response.result.accessToken?.trim();
        if (!normalizedToken) {
          return {
            success: false,
            message: 'ระบบไม่ได้ส่งโทเค็นกลับมา กรุณาลองใหม่อีกครั้ง',
            user: null,
          };
        }

        const user = this.extractUserFromToken(normalizedToken);
        if (!user) {
          return {
            success: false,
            message: 'ไม่สามารถอ่านข้อมูลผู้ใช้จากโทเค็นได้',
            user: null,
          };
        }

        this.persistSession(normalizedToken, user, credentials.rememberMe);

        return {
          success: true,
          user,
        };
      }),
      catchError((error: HttpErrorResponse) =>
        of({
          success: false,
          message:
            error.error?.message ??
            error.error?.error ??
            'ไม่สามารถเข้าสู่ระบบได้ โปรดลองอีกครั้ง',
          user: null,
        }),
      ),
    );
  }

  logout(navigateToLogin = true): void {
    this.userState.set(null);
    this.tokenState.set(null);
    this.rememberState.set(true);
    this.clearStorage(localStorage);
    this.clearStorage(sessionStorage);

    if (navigateToLogin) {
      void this.router.navigate(['/login']);
    }
  }

  requestPasswordReset(email: string): Observable<ForgotPasswordResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const payload = { email: normalizedEmail };

    return this.http.post<{ message?: string }>(this.forgotEndpoint, payload).pipe(
      map((response) => ({
        success: true,
        email: normalizedEmail,
        message: response.message ?? 'สร้างลิงก์รีเซ็ตรหัสผ่านสำเร็จ',
        issuedAt: new Date().toISOString(),
      })),
      catchError((error: HttpErrorResponse) =>
        of({
          success: false,
          email: normalizedEmail,
          message:
            error.error?.message ??
            'ไม่พบบัญชีผู้ใช้สำหรับอีเมลนี้ หรือไม่สามารถสร้างคำขอได้',
          issuedAt: new Date().toISOString(),
        }),
      ),
    );
  }

  getAccessToken(): string | null {
    const token = this.tokenState();
    if (token && !this.isTokenExpired(token)) {
      return token;
    }

    return null;
  }

  getCurrentUserSnapshot(): AuthUser | null {
    return this.userState();
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  private persistSession(token: string, user: AuthUser, rememberMe: boolean): void {
    this.tokenState.set(token);
    this.userState.set(user);
    this.rememberState.set(rememberMe);

    if (this.isBrowser()) {
      if (rememberMe) {
        this.storeState(localStorage, this.tokenStorageKey, token);
        this.storeState(localStorage, this.userStorageKey, JSON.stringify(user));
        this.clearStorage(sessionStorage);
      } else {
        this.storeState(sessionStorage, this.sessionTokenKey, token);
        this.storeState(sessionStorage, this.sessionUserKey, JSON.stringify(user));
        this.clearStorage(localStorage);
      }
    }
  }

  private restoreSession(): void {
    if (!this.isBrowser()) {
      return;
    }

    const storedToken =
      window.localStorage.getItem(this.tokenStorageKey) ??
      window.sessionStorage.getItem(this.sessionTokenKey);
    const storedUser =
      window.localStorage.getItem(this.userStorageKey) ??
      window.sessionStorage.getItem(this.sessionUserKey);

    if (!storedToken || !storedUser) {
      this.logout(false);
      return;
    }

    if (this.isTokenExpired(storedToken)) {
      this.logout(false);
      return;
    }

    try {
      const user = JSON.parse(storedUser) as AuthUser;
      this.userState.set(user);
      this.tokenState.set(storedToken);
    } catch {
      this.logout(false);
    }
  }

  private extractUserFromToken(token: string): AuthUser | null {
    const payload = this.decodeToken(token);
    if (!payload?.email || !payload?.sub) {
      return null;
    }

    const derivedName = payload.name ?? this.deriveNameFromEmail(payload.email);

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? null,
      name: derivedName,
    };
  }

  private deriveNameFromEmail(email: string): string {
    const username = email.split('@')[0] ?? 'BarrowHub User';
    return username
      .replace(/\./g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const [, payloadSegment] = token.split('.');
      if (!payloadSegment) {
        return null;
      }

      // Convert base64url to base64
      let normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed (base64 requires padding to be a multiple of 4)
      while (normalized.length % 4) {
        normalized += '=';
      }
      
      const decodeBase64 =
        typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function'
          ? globalThis.atob.bind(globalThis)
          : null;

      if (!decodeBase64) {
        return null;
      }

      const decoded = decodeBase64(normalized);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }

  private storeState(storage: Storage, key: string, value: string): void {
    try {
      storage.setItem(key, value);
    } catch {
      // Swallow storage errors silently
    }
  }

  private clearStorage(storage: Storage): void {
    try {
      storage.removeItem(this.tokenStorageKey);
      storage.removeItem(this.userStorageKey);
      storage.removeItem(this.sessionTokenKey);
      storage.removeItem(this.sessionUserKey);
    } catch {
      // Ignore storage clearing errors
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window?.localStorage !== 'undefined';
  }

  private createMockToken(user: AuthUser): string {
    // Create a mock JWT token that expires in 1 year
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (365 * 24 * 60 * 60); // 1 year from now
    
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: now,
      exp: exp,
    };
    
    // Encode header and payload in base64url format (JWT standard)
    const encodeBase64Url = (obj: object): string => {
      const json = JSON.stringify(obj);
      if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
        let base64 = globalThis.btoa(json);
        // Convert to base64url format
        base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        return base64;
      }
      return '';
    };
    
    const encodedHeader = encodeBase64Url(header);
    const encodedPayload = encodeBase64Url(payload);
    
    // Create a mock signature (not a real signature, but enough for the app to work)
    // The signature will be decoded but not validated
    const mockSignature = 'mock-signature-for-bypass';
    
    return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
  }
}
