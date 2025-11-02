import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../../../shared/models/staff.model';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-list.page.html',
  styleUrl: './staff-list.page.scss'
})
export class StaffListPage implements OnInit {
  staff: Staff[] = [];

  constructor(
    private staffService: StaffService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.staff = this.staffService.getStaff();
  }

  deleteStaff(id: string): void {
    if (confirm('คุณแน่ใจหรือไม่ที่ต้องการลบเจ้าหน้าที่คนนี้?')) {
      const success = this.staffService.deleteStaff(id);
      if (success) {
        this.loadStaff();
      }
    }
  }

  viewDetails(id: string): void {
    this.router.navigate(['/staff', id]);
  }

  editStaff(id: string): void {
    this.router.navigate(['/staff', id, 'edit']);
  }

  createStaff(): void {
    this.router.navigate(['/staff', 'create']);
  }
}

