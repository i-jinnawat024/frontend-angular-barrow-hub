import { CommonModule } from '@angular/common';
import {
  Component,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  effect,
  computed,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  sidebarOpen = input<boolean>(false);
  toggleSidebar = output<void>();
  closeSidebar = output<void>();

  private readonly isDesktopScreen = signal(this.checkIsDesktop());
  private resizeListener?: () => void;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly headerMarginLeft = signal('0');
  protected readonly isDesktopView = computed(() => this.isDesktopScreen());
  protected readonly currentUser = computed(() => this.authService.user());

  sidebarCollapsed = input<boolean>(false);

  protected readonly toggleIcon = computed(() => {
    const isDesktop = this.isDesktopView();
    const isOpen = this.sidebarOpen();
    const isCollapsed = this.sidebarCollapsed();

    if (!isDesktop) {
      return isOpen ? 'close' : 'menu';
    }

    if (!isOpen) {
      return 'menu';
    }

    return isCollapsed ? 'expand' : 'collapse';
  });

  protected readonly toggleLabel = computed(() => {
    const icon = this.toggleIcon();

    switch (icon) {
      case 'close':
        return 'Close navigation menu';
      case 'expand':
        return 'Expand sidebar';
      case 'collapse':
        return 'Collapse sidebar';
      default:
        return 'Open navigation menu';
    }
  });

  constructor() {
    // Update header margin when sidebar state or screen size changes
    effect(() => {
      const sidebarOpen = this.sidebarOpen();
      const sidebarCollapsed = this.sidebarCollapsed();
      const isDesktop = this.isDesktopScreen();

      if (isDesktop && sidebarOpen) {
        if (sidebarCollapsed) {
          this.headerMarginLeft.set('4rem'); // 64px for collapsed
        } else {
          this.headerMarginLeft.set('16rem'); // 256px for expanded
        }
      } else {
        this.headerMarginLeft.set('0');
      }
    });
  }

  ngOnInit(): void {
    this.resizeListener = () => {
      this.isDesktopScreen.set(this.checkIsDesktop());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  protected onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  protected getHeaderMarginLeft(): string {
    return this.headerMarginLeft();
  }

  protected async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/login']);
  }

  protected getUserInitials(user: AuthUser | null): string {
    if (!user?.name) {
      return 'BH';
    }

    const names = user.name.trim().split(' ').filter(Boolean);
    if (names.length === 0) {
      return 'BH';
    }

    const [first, second] = names;
    if (!second) {
      return first.slice(0, 2).toUpperCase();
    }

    return `${first[0]}${second[0]}`.toUpperCase();
  }

  private checkIsDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }
}
