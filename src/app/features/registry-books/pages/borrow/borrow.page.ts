import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { BorrowCreateDto } from '../../../../shared/models/borrow.model';
import { RegistryBook } from '../../../../shared/models/registry-book.model';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-borrow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QrScannerComponent, MatIconModule],
  templateUrl: './borrow.page.html',
  styleUrl: './borrow.page.scss',
  providers: [DatePipe],
})
export class BorrowPage implements OnInit {
  form: FormGroup;
  availableBooks: RegistryBook[] = [];
  showScanner = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly registryBookService: RegistryBookService,
    private readonly router: Router,
    private readonly datePipe: DatePipe,
  ) {
    this.form = this.fb.group({
      registryBookId: ['', [Validators.required]],
      borrowerName: ['', [Validators.required]],
      borrowedAt: [new Date(), [Validators.required]],
      borrowedTime: [
        this.datePipe.transform(new Date(), 'HH:mm') || '',
        [Validators.required],
      ],
      reason: [''],
    });
  }

  ngOnInit(): void {
    this.loadAvailableBooks();
  }

  loadAvailableBooks(): void {
    this.availableBooks = this.registryBookService
      .getRegistryBooks()
      .filter((book) => book.status === 'active');
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const borrowedDate = new Date(formValue.borrowedAt);
    const [hours, minutes] = formValue.borrowedTime.split(':');
    borrowedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    const borrowDto: BorrowCreateDto = {
      registryBookId: formValue.registryBookId,
      borrowerName: formValue.borrowerName,
      borrowedAt: borrowedDate,
      reason: formValue.reason || undefined,
    };

    try {
      const borrow = this.registryBookService.createBorrow(borrowDto);
      if (borrow) {
        alert('บันทึกการยืมเรียบร้อยแล้ว');
        this.router.navigate(['/registry-books']);
      }
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    }
  }

  cancel(): void {
    this.router.navigate(['/registry-books']);
  }

  openScanner(): void {
    this.showScanner = true;
  }

  onScanSuccess(decodedText: string): void {
    const book = this.registryBookService.getRegistryBookById(decodedText);
    if (book && book.status === 'active') {
      this.form.patchValue({
        registryBookId: book.id,
      });
      this.showScanner = false;
    } else {
      alert('ไม่พบหนังสือที่พร้อมให้ยืมจากรหัสที่สแกน');
    }
  }

  onScanError(error: string): void {
    alert('เกิดข้อผิดพลาดในการสแกน: ' + error);
  }

  onScannerClose(): void {
    this.showScanner = false;
  }
}
