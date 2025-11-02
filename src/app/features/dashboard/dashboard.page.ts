import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage implements OnInit {
  stats: ReturnType<typeof DashboardService.prototype.getStats>;

  constructor(private dashboardService: DashboardService) {
    this.stats = this.dashboardService.getStats();
  }

  ngOnInit(): void {
    // Stats are already loaded from the service
  }

  getActiveLoans() {
    return this.stats().activeLoans;
  }
}

