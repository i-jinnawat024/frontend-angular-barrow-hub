import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './dashboard.service';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage implements OnInit {
  stats: ReturnType<typeof DashboardService.prototype.getStats>;

  constructor(private dashboardService: DashboardService) {
    this.stats = this.dashboardService.getStats();
  }

  public readonly tableHeader = [
    { label: 'เล่มทะเบียน', property: 'registrationNumber' },
    { label: 'ผู้ยืม', property: 'borrowerName' },
    { label: 'วันที่ยืม', property: 'borrowedAt' },
    { label: 'สถานะ', property: 'status' },
    // { label: 'จัดการ', property: 'actions' },
  ];

  ngOnInit(): void {
    // Stats are already loaded from the service
  }

  getActiveLoans() {
    return this.stats().activeLoans;
  }
}

