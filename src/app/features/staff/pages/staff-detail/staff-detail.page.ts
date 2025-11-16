import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../../../shared/models/staff.model';
import { MatIcon } from "@angular/material/icon";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './staff-detail.page.html',
  styleUrl: './staff-detail.page.scss'
})
export class StaffDetailPage implements OnInit {
  staff: Staff | undefined;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private staffService: StaffService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.router.navigate(['/staff']);
            return EMPTY;
          }
          return this.staffService.getStaffById(id);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (staff) => (this.staff = staff),
        error: () => this.router.navigate(['/staff']),
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

