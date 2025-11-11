import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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
import { RegistryBookService } from '../../services/document.service';
import { BorrowCreateDto } from '../../../../shared/models/borrow.model';
import { Document } from '../../../../shared/models/registry-book.model';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import { MatIconModule } from "@angular/material/icon";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-borrow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QrScannerComponent, MatIconModule],
  templateUrl: './borrow.page.html',
  styleUrls: ['./borrow.page.scss'],
  providers: [DatePipe],
})
export class BorrowPage implements OnInit {
  form: FormGroup;
  availableBooks: Document[] = [];
  showScanner = false;
  currentStep: 1 | 2 = 1;
  scannedBookIds: Set<number> = new Set();
  private readonly destroyRef = inject(DestroyRef);
  
  private readonly selectedBookIdsControl: FormControl<number[]>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly registryBookService: RegistryBookService,
    private readonly router: Router,
    private readonly datePipe: DatePipe,
  ) {
    const now = new Date();

    this.selectedBookIdsControl = this.fb.nonNullable.control<number[]>([], {
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

  get selectedBookIds(): number[] {
    return this.selectedBookIdsControl.value ?? [];
  }

  get selectedBooks(): Document[] {
    const ids = new Set(this.selectedBookIds);
    return this.availableBooks.filter((book) => ids.has(book.id));
  }

  get selectedBookNumbers(): string {
    return this.selectedBooks.map((book) => book.documentId).join(', ');
  }

  private atLeastOneSelectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string[] | null;
      return value && value.length > 0 ? null : { requiredSelection: true };
    };
  }

  private updateSelectedBookIds(ids: number[], markTouched = true): void {
    this.selectedBookIdsControl.setValue(ids);
    if (markTouched) {
      this.selectedBookIdsControl.markAsTouched();
    }
    this.selectedBookIdsControl.updateValueAndValidity({ emitEvent: false });
  }

  loadAvailableBooks(): void {
    this.registryBookService
      .getRegistryBooks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (books) => {
          this.availableBooks = books.filter(
            (book) => book.status === 'ACTIVE',
          );

          const availableIds = new Set(
            this.availableBooks.map((book) => book.id),
          );
          const filtered = this.selectedBookIds.filter((id) =>
            availableIds.has(id),
          );
          if (filtered.length !== this.selectedBookIds.length) {
            this.updateSelectedBookIds(filtered, false);
          }
        },
        error: (error) =>
          console.error('Failed to load registry books', error),
      });
  }

  isBookSelected(bookId: number): boolean {
    return this.selectedBookIds.includes(bookId);
  }

  onBookSelectionChange(bookId: number, checked: boolean): void {
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
    const normalizedId = decodedText.trim();
    if (!normalizedId) {
      alert('ไม่พบเล่มทะเบียนที่ตรงกับ QR code นี้');
      return;
    }

    this.registryBookService
      .getRegistryBookById(Number(normalizedId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (book) => {
          if (book.status !== 'ACTIVE') {
            alert(`เล่มทะเบียน ${book.documentId} ไม่พร้อมให้ยืม (สถานะ: ${book.status})`);
            return;
          }

          if (this.isBookSelected(book.id)) {
            alert(`เล่มทะเบียน ${book.documentId} ถูกเลือกไปแล้ว`);
            return;
          }

          this.scannedBookIds.add(book.id);
          const selected = new Set(this.selectedBookIds);
          selected.add(book.id);
          this.updateSelectedBookIds(Array.from(selected));
          alert(`✅ เพิ่มเล่มทะเบียน ${book.documentId} แล้ว`);
        },
        error: () => alert('ไม่พบเล่มทะเบียนที่ตรงกับ QR code นี้'),
      });
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
      alert('�,?�,��,,�,"�,��,?�,��,-�,?�,,�1%�,-�,��,1�,��1��,��1%�,,�,��,s�,-�1%�,���,T');
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

    this.registryBookService
      .createBulkBorrows(borrowDtos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (borrows) => {
          if (!borrows.length) {
            return;
          }

          const scannedCount = this.selectedBookIds.filter((id) =>
            this.scannedBookIds.has(id),
          ).length;

          let message = `�,��,��,��1?�,��1^�,��,-�,��1?�,s�,�,��,T�,^�,3�,T�,���,T ${borrows.length} �1?�,��1^�,��,��,3�1?�,��1O.,^�1?�,��1%�,���`;
          if (scannedCount > 0) {
            message += ` (�,��1?�,?�,T QR ${scannedCount} �1?�,��1^�,�)`;
          }

          alert(message);
          this.router.navigate(['/registry-books']);
        },
        error: (error) => {
          console.error('Failed to create borrow records', error);
          alert('ไม่สามารถบันทึกการยืมได้ กรุณาลองใหม่อีกครั้ง');
        },
      });
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