import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { RegistryBookService } from '../../../registry-books/services/registry-book.service';
import { Staff } from '../../../../shared/models/staff.model';
import { Borrow } from '../../../../shared/models/borrow.model';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-staff-history',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './staff-history.page.html',
  styleUrl: './staff-history.page.scss',
})
export class StaffHistoryPage implements OnInit {
  staff: Staff | undefined;
  borrowHistory: Borrow[] = [];

  constructor(
    private readonly staffService: StaffService,
    private readonly registryBookService: RegistryBookService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (!id) {
        this.router.navigate(['/staff']);
        return;
      }

      this.staff = this.staffService.getStaffById(id);

      if (!this.staff) {
        this.router.navigate(['/staff']);
        return;
      }

      this.loadBorrowHistory();
    });
  }

  goBack(): void {
    if (this.staff) {
      this.router.navigate(['/staff', this.staff.id]);
    } else {
      this.router.navigate(['/staff']);
    }
  }

  private loadBorrowHistory(): void {
    if (!this.staff) {
      this.borrowHistory = [];
      return;
    }

    this.borrowHistory = this.registryBookService.getBorrowHistoryByStaffName(
      this.staff.firstName + ' ' + this.staff.lastName,
    );
  }
}
