import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StaffService } from '../../services/staff.service';

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

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: ['', [Validators.required]],
      department: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.staffId = params['id'];
        this.isEditMode = params['id'] !== 'create';
        if (this.isEditMode) {
          this.loadStaff();
        }
      }
    });
  }

  loadStaff(): void {
    if (!this.staffId) return;
    const staff = this.staffService.getStaffById(this.staffId);
    if (staff) {
      this.form.patchValue({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone || '',
        position: staff.position,
        department: staff.department || '',
        isActive: staff.isActive
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      if (this.isEditMode && this.staffId) {
        const updated = this.staffService.updateStaff(this.staffId, this.form.value);
        if (updated) {
          this.router.navigate(['/staff']);
        }
      } else {
        const created = this.staffService.createStaff(this.form.value);
        if (created) {
          this.router.navigate(['/staff']);
        }
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/staff']);
  }
}

