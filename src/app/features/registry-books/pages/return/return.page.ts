import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { ReturnCreateDto } from '../../../../shared/models/return.model';
import { Borrow } from '../../../../shared/models/borrow.model';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';

@Component({
  selector: 'app-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QrScannerComponent],
  templateUrl: './return.page.html',
  styleUrl: './return.page.scss',
  providers: [DatePipe]
})
export class ReturnPage implements OnInit {
  form: FormGroup;
  activeBorrows: Borrow[] = [];
  showScanner = false;

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

  openScanner(): void {
    this.showScanner = true;
  }

  onScanSuccess(decodedText: string): void {
    // Find active borrow by book ID from scanned QR code
    const borrow = this.activeBorrows.find(b => b.registryBook.id === decodedText);
    if (borrow) {
      this.form.patchValue({
        borrowId: borrow.id
      });
      this.showScanner = false;
    } else {
      alert('ไม่พบการยืมที่เกี่ยวข้องกับเล่มทะเบียนนี้');
    }
  }

  onScanError(error: string): void {
    alert('เกิดข้อผิดพลาดในการสแกน: ' + error);
  }

  onScannerClose(): void {
    this.showScanner = false;
  }
}

