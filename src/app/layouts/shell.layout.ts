import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './shell.layout.html',
//   styleUrl: './shell.layout.scss'
})
export class ShellLayoutComponent implements OnInit, OnDestroy {
  // Sidebar state - closed by default, user can toggle
  protected readonly sidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);

  private resizeListener?: () => void;

  ngOnInit(): void {
    // Optional: Auto-open sidebar on desktop on initial load
    if (this.isDesktop()) {
      this.sidebarOpen.set(true);
      this.sidebarCollapsed.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private isDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }

  protected toggleSidebar(): void {
    // On desktop: toggle between expanded and collapsed
    // On mobile: toggle between open and closed (full sidebar)
    if (this.isDesktop()) {
      if (this.sidebarOpen()) {
        // If sidebar is open, toggle between expanded and collapsed
        this.sidebarCollapsed.update((collapsed) => !collapsed);
      } else {
        // If sidebar is closed, open it expanded
        this.sidebarOpen.set(true);
        this.sidebarCollapsed.set(false);
      }
    } else {
      // On mobile: just toggle open/closed (always expanded when open)
      this.sidebarOpen.update((isOpen) => !isOpen);
      this.sidebarCollapsed.set(false);
    }
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
    this.sidebarCollapsed.set(false);
  }

  protected getMainMarginLeft(): string {
    if (!this.sidebarOpen()) return '0';
    if (this.sidebarCollapsed()) return '4rem'; // 64px for collapsed
    return '16rem'; // 256px for expanded
  }
}
