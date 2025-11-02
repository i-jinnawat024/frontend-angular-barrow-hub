import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type SidebarIcon = 'dashboard' | 'registry' | 'borrow' | 'return';

interface SidebarNavItem {
  label: string;
  route: string;
  icon: SidebarIcon;
  description?: string;
  badge?: string;
  exact?: boolean;
}

interface SidebarNavGroup {
  title?: string;
  items: SidebarNavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isOpen = input.required<boolean>();
  isCollapsed = input<boolean>(false);
  closeSidebar = output<void>();

  protected readonly navGroups: SidebarNavGroup[] = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Dashboard',
          route: '/dashboard',
          icon: 'dashboard',
          description: 'System overview',
          exact: true
        }
      ]
    },
    {
      title: 'Catalog',
      items: [
        {
          label: 'Book Registry',
          route: '/registry-books',
          icon: 'registry',
          description: 'Manage library records',
          exact: true
        },
        {
          label: 'Borrow',
          route: '/registry-books/borrow',
          icon: 'borrow',
          description: 'Track outgoing items',
          exact: true
        },
        {
          label: 'Return',
          route: '/registry-books/return',
          icon: 'return',
          description: 'Handle returns',
          exact: true,
          badge: 'New'
        }
      ]
    }
  ];

  protected readonly currentUser = {
    initials: 'JI',
    name: 'Jinnawat Inyos',
    email: 'user@example.com'
  };

  protected onOverlayClick(): void {
    this.closeSidebar.emit();
  }

  protected onNavigate(): void {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      this.closeSidebar.emit();
    }
  }

  protected getSidebarWidth(): string {
    if (!this.isOpen()) return '0';
    if (this.isCollapsed()) return '4rem'; // 64px for collapsed
    return '16rem'; // 256px for expanded
  }
}
