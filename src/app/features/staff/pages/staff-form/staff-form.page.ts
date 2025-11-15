import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StaffService } from '../../services/staff.service';
import { Staff, StaffCreateDto, StaffUpdateDto } from '../../../../shared/models/staff.model';

interface StaffFormValue {
  firstName: string;
  lastName: string;
  email: string;
  telNumber?: number | null;
  password: string;
  isActive: boolean;
}

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './staff-form.page.html',
  styleUrl: './staff-form.page.scss'
})
export class StaffFormPage implements OnInit {
  form: FormGroup;
  isEditMode = false;
  staffId: string | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telNumber: [''],
      password: ['', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        this.staffId = id;
        this.isEditMode = Boolean(id);

        if (this.isEditMode) {
          this.loadStaff();
        } else {
          this.form.reset({
            firstName: '',
            lastName: '',
            email: '',
            telNumber: '',
            password: '',
            isActive: true,
          });
        }
      });
  }

  loadStaff(): void {
    if (!this.staffId) {
      return;
    }

    this.staffService
      .getStaffById(this.staffId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (staff) => {
          this.form.patchValue({
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            telNumber: staff.telNumber ?? '',
            password: staff.password ?? '',
            isActive: staff.isActive,
          });
        },
        error: () => this.router.navigate(['/staff']),
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.mapFormToStaffDto();

    if (this.isEditMode && this.staffId) {
      const updateDto: StaffUpdateDto = { ...dto };
      this.staffService
        .updateStaff(this.staffId, updateDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigate(['/staff']),
          error: (error) => {
            console.error('Failed to update staff member', error);
            window.alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
          },
        });
    } else {
      this.staffService
        .createStaff(dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigate(['/staff']),
          error: (error) => {
            console.error('Failed to create staff member', error);
            window.alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
          },
        });
    }
  }

  private mapFormToStaffDto(): StaffCreateDto {
    const raw = this.form.value as StaffFormValue;
    const { firstName, lastName } = this.extractNameParts(`${raw.firstName ?? ''} ${raw.lastName ?? ''}`);

    return {
      firstName,
      lastName,
      email: (raw.email ?? '').trim(),
      telNumber: this.normalizeOptionalField(raw.telNumber),
      password: (raw.password ?? '').trim(),
    };
  }

  private normalizeOptionalField(value?: number | null): number | undefined {
    const normalized = value?.toString().trim();
    return normalized ? Number(normalized) : undefined;
  }

  private extractNameParts(fullName: string): { firstName: string; lastName: string } {
    const normalized = fullName.trim();
    if (!normalized) {
      return { firstName: '', lastName: '' };
    }
    const [firstName, ...rest] = normalized.split(/\s+/);
    const lastName = rest.length ? rest.join(' ') : firstName;
    return { firstName, lastName };
  }

  private composeFullName(staff: Staff): string {
    return [staff.firstName, staff.lastName].filter(Boolean).join(' ').trim();
  }

  cancel(): void {
    this.router.navigate(['/staff']);
  }
}

