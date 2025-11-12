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
  scannedDocumentIds: Set<number> = new Set();
  private readonly destroyRef = inject(DestroyRef);
  
  private readonly selectedDocumentIdsControl: FormControl<number[]>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly registryBookService: RegistryBookService,
    private readonly router: Router,
    private readonly datePipe: DatePipe,
  ) {
    const now = new Date();

    this.selectedDocumentIdsControl = this.fb.nonNullable.control<number[]>([], {
      validators: [this.atLeastOneSelectionValidator()],
    });

    this.form = this.fb.group({
      selectedDocumentIds: this.selectedDocumentIdsControl,
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

  get selectedDocumentIds(): number[] {
    return this.selectedDocumentIdsControl.value ?? [];
  }

  get selectedBooks(): Document[] {
    const ids = new Set(this.selectedDocumentIds);
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

  private updateSelectedDocumentIds(ids: number[], markTouched = true): void {
    this.selectedDocumentIdsControl.setValue(ids);
    if (markTouched) {
      this.selectedDocumentIdsControl.markAsTouched();
    }
    this.selectedDocumentIdsControl.updateValueAndValidity({ emitEvent: false });
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
          const filtered = this.selectedDocumentIds.filter((id) =>
            availableIds.has(id),
          );
          if (filtered.length !== this.selectedDocumentIds.length) {
            this.updateSelectedDocumentIds(filtered, false);
          }
        },
        error: (error) =>
          console.error('Failed to load registry books', error),
      });
  }

  isDocumentSelected(documentId: number): boolean {
    return this.selectedDocumentIds.includes(documentId);
  }

  onDocumentSelectionChange(documentId: number, checked: boolean): void {
    const selected = new Set(this.selectedDocumentIds);
    if (checked) {
      selected.add(documentId);
    } else {
      selected.delete(documentId);
    }   
    this.updateSelectedDocumentIds(Array.from(selected));
  }

  selectAllDocument(): void {
    if (!this.availableBooks.length) {
      this.updateSelectedDocumentIds([], false);
      return;
    }

    const allIds = this.availableBooks.map((book) => book.id);
    this.updateSelectedDocumentIds(allIds);
  }

  clearSelection(): void {
    this.updateSelectedDocumentIds([]);
    this.scannedDocumentIds.clear();
  }

  // Step Navigation
  goToStep2(): void {
    if (!this.selectedDocumentIds.length) {
      this.selectedDocumentIdsControl.markAsTouched();
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

          if (this.isDocumentSelected(book.id)) {
            alert(`เล่มทะเบียน ${book.documentId} ถูกเลือกไปแล้ว`);
            return;
          }

          this.scannedDocumentIds.add(book.id);
          const selected = new Set(this.selectedDocumentIds);
          selected.add(book.id);
          this.updateSelectedDocumentIds(Array.from(selected));
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
    if (!this.form.valid || !this.selectedDocumentIds.length) {
      this.form.markAllAsTouched();
      this.selectedDocumentIdsControl.updateValueAndValidity();
      alert('�,?�,��,,�,"�,��,?�,��,-�,?�,,�1%�,-�,��,1�,��1��,��1%�,,�,��,s�,-�1%�,���,T');
      return;
    }

    const formValue = this.form.value as {
      userId: "this.userId",
      documentId: number[],
      description?: string
    };

    // const borrowedDate = new Date(formValue.borrowedAt);
    // const [hours, minutes] = formValue.borrowedTime.split(':');
    // borrowedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    const borrowDtos: BorrowCreateDto = {
      userId: "this.userId",
      documentId: this.selectedDocumentIds,
      description: formValue.description || undefined,
    };
    this.registryBookService
      .createBulkBorrows(borrowDtos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (borrows) => {
          if (!borrows.length) {
            return;
          }

          const scannedCount = this.selectedDocumentIds.filter((id) =>
            this.scannedDocumentIds.has(id),
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
    if (this.selectedDocumentIds.length > 0 || 
        this.form.get('borrowerName')?.value ||
        this.form.get('reason')?.value) {
      if (!confirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการยกเลิกหรือไม่?')) {
        return;
      }
    }
    this.router.navigate(['/registry-books']);
  }

}