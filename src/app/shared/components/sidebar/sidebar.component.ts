import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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

  protected readonly menuItems = [
    {
      label: 'แดชบอร์ด',
      route: '/dashboard'
    },
    {
      label: 'เอกสาร',
      route: '/documents'
    },
    {
      label: 'การยืม',
      route: '/loans'
    },
    {
      label: 'เจ้าหน้าที่',
      route: '/staff'
    }
  ];

  protected onOverlayClick(): void {
    this.closeSidebar.emit();
  }

  protected getSidebarWidth(): string {
    if (!this.isOpen()) return '0';
    if (this.isCollapsed()) return '4rem'; // 64px for collapsed
    return '16rem'; // 256px for expanded
  }
}

