import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
  currentStep: 1 | 2 = 1;
  scannedBookIds: Set<string> = new Set();
  
  private readonly selectedBookIdsControl: FormControl<string[]>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly registryBookService: RegistryBookService,
    private readonly router: Router,
    private readonly datePipe: DatePipe,
  ) {
    const now = new Date();

    this.selectedBookIdsControl = this.fb.nonNullable.control<string[]>([], {
      validators: [this.atLeastOneSelectionValidator()],
    });

    this.form = this.fb.group({
      selectedBookIds: this.selectedBookIdsControl,
      borrowerName: ['', [Validators.required]],
      borrowedAt: [now, [Validators.required]],
      borrowedTime: [
        this.datePipe.transform(now, 'HH:mm') || '',
        [Validators.required],
      ],
      reason: [''],
    });
  }

  ngOnInit(): void {
    this.loadAvailableBooks();
  }

  get selectedBookIds(): string[] {
    return this.selectedBookIdsControl.value ?? [];
  }

  get selectedBooks(): RegistryBook[] {
    const ids = new Set(this.selectedBookIds);
    return this.availableBooks.filter((book) => ids.has(book.id));
  }

  get selectedBookNumbers(): string {
    return this.selectedBooks.map((book) => book.bookNumber).join(', ');
  }

  private atLeastOneSelectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string[] | null;
      return value && value.length > 0 ? null : { requiredSelection: true };
    };
  }

  private updateSelectedBookIds(ids: string[], markTouched = true): void {
    this.selectedBookIdsControl.setValue(ids);
    if (markTouched) {
      this.selectedBookIdsControl.markAsTouched();
    }
    this.selectedBookIdsControl.updateValueAndValidity({ emitEvent: false });
  }

  loadAvailableBooks(): void {
    this.availableBooks = this.registryBookService
      .getRegistryBooks()
      .filter((book) => book.status === 'active');

    const availableIds = new Set(this.availableBooks.map((book) => book.id));
    const filtered = this.selectedBookIds.filter((id) => availableIds.has(id));
    if (filtered.length !== this.selectedBookIds.length) {
      this.updateSelectedBookIds(filtered, false);
    }
  }

  isBookSelected(bookId: string): boolean {
    return this.selectedBookIds.includes(bookId);
  }

  onBookSelectionChange(bookId: string, checked: boolean): void {
    const selected = new Set(this.selectedBookIds);
    if (checked) {
      selected.add(bookId);
    } else {
      selected.delete(bookId);
    }
    this.updateSelectedBookIds(Array.from(selected));
  }

  selectAllBooks(): void {
    if (!this.availableBooks.length) {
      this.updateSelectedBookIds([], false);
      return;
    }

    const allIds = this.availableBooks.map((book) => book.id);
    this.updateSelectedBookIds(allIds);
  }

  clearSelection(): void {
    this.updateSelectedBookIds([]);
    this.scannedBookIds.clear();
  }

  // Step Navigation
  goToStep2(): void {
    if (!this.selectedBookIds.length) {
      this.selectedBookIdsControl.markAsTouched();
      alert('กรุณาเลือกเล่มทะเบียนอย่างน้อย 1 เล่ม');
      return;
    }
    this.currentStep = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToStep1(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // QR Scanner
  openScanner(): void {
    this.showScanner = true;
  }

  onScanSuccess(decodedText: string): void {
    const book = this.registryBookService.getRegistryBookById(decodedText);
    
    if (!book) {
      alert('ไม่พบเล่มทะเบียนที่ตรงกับ QR code นี้');
      return;
    }

    if (book.status !== 'active') {
      alert(`เล่มทะเบียน ${book.bookNumber} ไม่พร้อมให้ยืม (สถานะ: ${book.status})`);
      return;
    }

    if (this.isBookSelected(book.id)) {
      alert(`เล่มทะเบียน ${book.bookNumber} ถูกเลือกไว้แล้ว`);
      return;
    }

    // Add to scanned books tracking
    this.scannedBookIds.add(book.id);
    
    // Add to selection
    const selected = new Set(this.selectedBookIds);
    selected.add(book.id);
    this.updateSelectedBookIds(Array.from(selected));
    
    // Show success feedback
    alert(`✓ เพิ่มเล่มทะเบียน ${book.bookNumber} แล้ว`);
  }

  onScanError(error: string): void {
    console.error('Scan error:', error);
    alert('เกิดข้อผิดพลาดจากการสแกน: ' + error);
  }

  onScannerClose(): void {
    this.showScanner = false;
  }

  // Form Submission
  onSubmit(): void {
    if (!this.form.valid || !this.selectedBookIds.length) {
      this.form.markAllAsTouched();
      this.selectedBookIdsControl.updateValueAndValidity();
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const formValue = this.form.value as {
      borrowerName: string;
      borrowedAt: Date | string;
      borrowedTime: string;
      reason?: string;
    };

    const borrowedDate = new Date(formValue.borrowedAt);
    const [hours, minutes] = formValue.borrowedTime.split(':');
    borrowedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    const borrowDtos: BorrowCreateDto[] = this.selectedBookIds.map((bookId) => ({
      registryBookId: bookId,
      borrowerName: formValue.borrowerName,
      borrowedAt: new Date(borrowedDate),
      reason: formValue.reason || undefined,
    }));

    try {
      const borrows = this.registryBookService.createBulkBorrows(borrowDtos);
      if (borrows.length) {
        const scannedCount = this.selectedBookIds.filter(id => 
          this.scannedBookIds.has(id)
        ).length;
        
        let message = `ยืมเล่มทะเบียนจำนวน ${borrows.length} เล่มสำเร็จแล้ว`;
        if (scannedCount > 0) {
          message += ` (สแกน QR ${scannedCount} เล่ม)`;
        }
        
        alert(message);
        this.router.navigate(['/registry-books']);
      }
    } catch (error: any) {
      alert('ไม่สามารถบันทึกการยืมได้: ' + (error?.message ?? 'ไม่ทราบสาเหตุ'));
    }
  }

  cancel(): void {
    if (this.selectedBookIds.length > 0 || 
        this.form.get('borrowerName')?.value ||
        this.form.get('reason')?.value) {
      if (!confirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการยกเลิกหรือไม่?')) {
        return;
      }
    }
    this.router.navigate(['/registry-books']);
  }
}
