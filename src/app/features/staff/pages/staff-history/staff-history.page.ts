import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { DocumentService } from '../../../document/services/document.service';
import { Staff } from '../../../../shared/models/staff.model';
import { Borrow } from '../../../../shared/models/borrow.model';
import { MatIcon } from "@angular/material/icon";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly staffService: StaffService,
    private readonly documentService: DocumentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (!id) {
          this.router.navigate(['/staff']);
          return;
        }

        this.staffService
          .getStaffById(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (staff) => {
              this.staff = staff;
              this.loadBorrowHistory();
            },
            error: () => this.router.navigate(['/staff']),
          });
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


    this.documentService
      .getBorrowHistoryByUserId(this.staff.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (history) => (this.borrowHistory = history),
        error: (error) => {
          console.error('Failed to load borrow history', error);
          this.borrowHistory = [];
        },
      });
  }
}
