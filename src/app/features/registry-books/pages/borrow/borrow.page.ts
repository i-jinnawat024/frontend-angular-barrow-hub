import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { BorrowCreateDto } from '../../../../shared/models/borrow.model';
import { RegistryBook } from '../../../../shared/models/registry-book.model';

@Component({
  selector: 'app-borrow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './borrow.page.html',
  styleUrl: './borrow.page.scss',
  providers: [DatePipe]
})
export class BorrowPage implements OnInit {
  form: FormGroup;
  availableBooks: RegistryBook[] = [];

  constructor(
    private fb: FormBuilder,
    private registryBookService: RegistryBookService,
    private router: Router,
    private datePipe: DatePipe
  ) {
    this.form = this.fb.group({
      registryBookId: ['', [Validators.required]],
      borrowerName: ['', [Validators.required]],
      borrowedAt: [new Date(), [Validators.required]],
      borrowedTime: [this.datePipe.transform(new Date(), 'HH:mm') || '', [Validators.required]],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableBooks();
  }

  loadAvailableBooks(): void {
    this.availableBooks = this.registryBookService.getRegistryBooks()
      .filter(book => book.status === 'available');
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const borrowedDate = new Date(formValue.borrowedAt);
      const [hours, minutes] = formValue.borrowedTime.split(':');
      borrowedDate.setHours(parseInt(hours), parseInt(minutes));

      const borrowDto: BorrowCreateDto = {
        registryBookId: formValue.registryBookId,
        borrowerName: formValue.borrowerName,
        borrowedAt: borrowedDate,
        reason: formValue.reason || undefined
      };

      try {
        const borrow = this.registryBookService.createBorrow(borrowDto);
        if (borrow) {
          alert('ยืมเล่มทะเบียนสำเร็จ');
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
}

