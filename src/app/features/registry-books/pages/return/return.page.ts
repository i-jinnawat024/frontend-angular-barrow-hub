import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { ReturnCreateDto } from '../../../../shared/models/return.model';
import { Borrow } from '../../../../shared/models/borrow.model';

@Component({
  selector: 'app-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './return.page.html',
  styleUrl: './return.page.scss',
  providers: [DatePipe]
})
export class ReturnPage implements OnInit {
  form: FormGroup;
  activeBorrows: Borrow[] = [];

  constructor(
    private fb: FormBuilder,
    private registryBookService: RegistryBookService,
    private router: Router,
    private datePipe: DatePipe
  ) {
    this.form = this.fb.group({
      borrowId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadActiveBorrows();
  }

  loadActiveBorrows(): void {
    this.activeBorrows = this.registryBookService.getActiveBorrows();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const returnDto: ReturnCreateDto = {
        borrowId: formValue.borrowId,
        returnedAt: new Date()
      };

      try {
        const returnRecord = this.registryBookService.createReturn(returnDto);
        if (returnRecord) {
          alert('คืนเล่มทะเบียนสำเร็จ');
          this.router.navigate(['/registry-books']);
        }
      } catch (error: any) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/registry-books']);
  }

  getSelectedBorrow(): Borrow | undefined {
    const borrowId = this.form.get('borrowId')?.value;
    return this.activeBorrows.find(b => b.id === borrowId);
  }
}

