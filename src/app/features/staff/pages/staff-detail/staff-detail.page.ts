import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../../../shared/models/staff.model';

@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-detail.page.html',
  styleUrl: './staff-detail.page.scss'
})
export class StaffDetailPage implements OnInit {
  staff: Staff | undefined;

  constructor(
    private staffService: StaffService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.staff = this.staffService.getStaffById(id);
        if (!this.staff) {
          this.router.navigate(['/staff']);
        }
      }
    });
  }

  editStaff(): void {
    if (this.staff) {
      this.router.navigate(['/staff', this.staff.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/staff']);
  }

  viewBorrowHistory(): void {
    if (this.staff) {
      this.router.navigate(['/staff', this.staff.id, 'history']);
    }
  }
}

