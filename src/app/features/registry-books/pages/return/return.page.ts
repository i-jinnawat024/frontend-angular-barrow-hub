import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectChange } from '@angular/material/select';
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
import { ReturnCreateDto } from '../../../../shared/models/return.model';
import { Borrow } from '../../../../shared/models/borrow.model';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

type ReturnSortField = 'documentId' | 'name' | 'date';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QrScannerComponent],
  templateUrl: './return.page.html',
  styleUrl: './return.page.scss',
})
export class ReturnPage implements OnInit {
  form: FormGroup;
  activeBorrows: Borrow[] = [];
  uniqueBorrowers: string[] = [];
  showScanner = false;
  protected returnSearchTerm = '';
  protected returnSortField: ReturnSortField = 'documentId';
  protected returnSortDirection: SortDirection = 'asc';
  currentStep: 1 | 2 = 1;
  selectedBorrowersControl = new FormControl<string[]>([], { nonNullable: true });
  private readonly selectedBorrowIdsControl: FormControl<number[]>;
  private readonly destroyRef = inject(DestroyRef);
  constructor(
    private readonly fb: FormBuilder,
    private readonly registryBookService: RegistryBookService,
    private readonly router: Router
  ) {
    this.selectedBorrowIdsControl = this.fb.nonNullable.control<number[]>([], {
      validators: [Validators.required, Validators.minLength(1)],
    });

    this.form = this.fb.group({
      selectedBorrowIds: this.selectedBorrowIdsControl,
    });
  }

  ngOnInit(): void {
    this.loadActiveBorrows();
  }

  get selectedBorrowIds(): number[] {
    return this.selectedBorrowIdsControl.value ?? [];
  }

  get selectedBorrows(): Borrow[] {
    const ids = new Set(this.selectedBorrowIds);
    return this.activeBorrows.filter((borrow) => ids.has(borrow.document.id));
  }

  get selectedBorrowNumbers(): string {
    return this.selectedBorrows.map((borrow) => borrow.document.documentId).join(', ');
  }

  get selectedBorrowers(): string[] {
    return this.selectedBorrowersControl.value ?? [];
  }

  private updateSelectedBorrowIds(ids: number[], markTouched = true): void {
    this.selectedBorrowIdsControl.setValue(ids);
    if (markTouched) {
      this.selectedBorrowIdsControl.markAsTouched();
    }
    this.selectedBorrowIdsControl.updateValueAndValidity({ emitEvent: false });
  }

  loadActiveBorrows(): void {
    this.registryBookService
      .getActiveBorrows()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (borrows) => {
          this.activeBorrows = borrows
             .slice()
             .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const borrowerSet = new Set(this.activeBorrows.map((borrow) => borrow.name));
          this.uniqueBorrowers = Array.from(borrowerSet).sort();
          const availableIds = new Set(this.activeBorrows.map((borrow) => borrow.document.id));
          const filtered = this.selectedBorrowIds.filter((id) => availableIds.has(id));
          if (filtered.length !== this.selectedBorrowIds.length) {
            this.updateSelectedBorrowIds(filtered, false);
          }

          const selectedBorrowerNames = [
            ...new Set(this.selectedBorrows.map((borrow) => borrow.name)),
          ];
          this.selectedBorrowersControl.setValue(selectedBorrowerNames);
        },
        error: (error) => console.error('Failed to load active borrows', error),
      });
  }

  getBorrowsByBorrower(borrower: string): Borrow[] {
    return this.activeBorrows.filter((borrow) => borrow.name === borrower);
  }

  getFilteredBorrows(): Borrow[] {
    if (!this.selectedBorrowers.length) {
      return [];
    }
    const selectedBorrowerSet = new Set(this.selectedBorrowers);
    const relevant = this.activeBorrows.filter((borrow) => selectedBorrowerSet.has(borrow.name));
    return this.applyReturnFilters(relevant);
  }

  isBorrowSelected(borrowId: number): boolean {
    return this.selectedBorrowIds.includes(borrowId);
  }

  isBorrowerSelected(borrower: string): boolean {
    return this.selectedBorrowers.includes(borrower);
  }

  getBorrowCountByBorrower(borrower: string): number {
    return this.getBorrowsByBorrower(borrower).length;
  }

  getSelectedCountByBorrower(borrower: string): number {
    const borrowerBorrows = this.getBorrowsByBorrower(borrower);
    return borrowerBorrows.filter((borrow) => this.selectedBorrowIds.includes(borrow.document.id))
      .length;
  }

  getTotalBorrowsCount(): number {
    const selectedBorrowerSet = new Set(this.selectedBorrowers);
    return this.activeBorrows.filter((borrow) => selectedBorrowerSet.has(borrow.name)).length;
  }

  getBorrowRowsForBorrower(borrower: string): Borrow[] {
    return this.getFilteredBorrows().filter((record) => record.name === borrower);
  }

  getVisibleBorrowIds(): string[] {
    return this.getFilteredBorrows().map((borrow) => borrow.id);
  }

  private syncSelectedBorrowIdsWithBorrowers(borrowers: string[]): void {
    if (!borrowers.length) {
      this.updateSelectedBorrowIds([], false);
      return;
    }

    const borrowerSet = new Set(borrowers);
    const ids = Array.from(
      new Set(
        this.activeBorrows
          .filter((borrow) => borrowerSet.has(borrow.name))
          .map((borrow) => borrow.document.id),
      ),
    );
    this.updateSelectedBorrowIds(ids, false);
  }

 private buildReturnDto(): ReturnCreateDto | null {
  const borrows = this.selectedBorrows;

  if (!borrows.length) {
    return null;
  }

  const userId = borrows[0].userId;
  if (!userId) return null;

  // ตรวจว่ามีหลาย user หรือไม่
  if (borrows.some((b) => b.userId !== userId)) {
    // invalid
    return null;
  }

  return {
    userId,
    documentIds: borrows.map((b) => b.document.id),
  };
}


  onReturnSearch(term: string): void {
    this.returnSearchTerm = term;
  }

  clearReturnSearch(): void {
    this.returnSearchTerm = '';
  }

  changeReturnSort(field: ReturnSortField): void {
    if (this.returnSortField === field) {
      this.returnSortDirection = this.returnSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.returnSortField = field;
      this.returnSortDirection = 'asc';
    }
  }

  getReturnSortIcon(field: ReturnSortField): string {
    if (this.returnSortField !== field) {
      return 'unfold_more';
    }

    return this.returnSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  getBorrowDurationDays(borrow: Borrow): number {
    const now = new Date();
    const borrowedAt =
      borrow.createdAt instanceof Date ? borrow.createdAt : new Date(borrow.createdAt);
    const diffTime = now.getTime() - borrowedAt.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getDocumentFullName(borrow: Borrow): string {
    return `${borrow.document.firstName} ${borrow.document.lastName}`.trim();
  }

  getDocumentDescription(borrow: Borrow): string | null {
    return borrow.document.description ?? borrow.description ?? null;
  }

  onBorrowersSelectionChange(event: MatSelectChange): void {
    const selected = event.value as string[] | null;
    this.syncSelectedBorrowIdsWithBorrowers(selected ?? []);
  }

  onBorrowerSelectionChange(borrower: string, checked: boolean): void {
    const current = this.selectedBorrowersControl.value ?? [];
    const newSelected = checked ? [...current, borrower] : current.filter((b) => b !== borrower);

    this.selectedBorrowersControl.setValue(newSelected);
    this.syncSelectedBorrowIdsWithBorrowers(newSelected);
  }

  selectAllBorrowers(): void {
    this.selectedBorrowersControl.setValue([...this.uniqueBorrowers]);
    this.syncSelectedBorrowIdsWithBorrowers(this.uniqueBorrowers);
  }

  clearBorrowerSelection(): void {
    this.selectedBorrowersControl.setValue([]);
    this.syncSelectedBorrowIdsWithBorrowers([]);
  }

  onBorrowSelectionChange(borrowId: number, checked: boolean): void {
    const selected = new Set(this.selectedBorrowIds);
    if (checked) {
      selected.add(borrowId);
    } else {
      selected.delete(borrowId);
    }
    this.updateSelectedBorrowIds(Array.from(selected));

    // Update selected borrowers if needed
    // const borrow = this.activeBorrows.find((b) => b.document.id === borrowId);
    // if (borrow && !checked) {
    //   const borrowerBorrows = this.getBorrowsByBorrower(borrow.name);
    //   const selectedInBorrower = borrowerBorrows.some((b) => selected.has(b.document.id));
    //   if (!selectedInBorrower) {
    //     const current = this.selectedBorrowersControl.value ?? [];
    //     const newSelected = current.filter((b) => b !== borrow.name);
    //     this.selectedBorrowersControl.setValue(newSelected);
    //   }
    // }
  }

  selectAllBorrows(): void {
    const visible = this.getFilteredBorrows();
    if (!visible.length) {
      this.updateSelectedBorrowIds([], false);
      return;
    }

    const borrowerNames = Array.from(new Set(visible.map((borrow) => borrow.name)));
    this.selectedBorrowersControl.setValue(borrowerNames);
    const allIds = visible.map((borrow) => borrow.document.id);
    this.updateSelectedBorrowIds(allIds);
  }

  clearSelection(): void {
    this.updateSelectedBorrowIds([]);
    this.selectedBorrowersControl.setValue([]);
  }

  clearBorrowSelection(): void {
    this.updateSelectedBorrowIds([]);
  }

  private applyReturnFilters(borrows: Borrow[]): Borrow[] {
    const term = this.returnSearchTerm.trim().toLowerCase();
    let filtered = borrows;
    if (term) {
      filtered = filtered.filter((borrow) => {
        const documentNumber = String(borrow.document.documentId);
        const fullName = `${borrow.document.firstName} ${borrow.document.lastName}`.toLowerCase();
        const description = (borrow.description ?? '').toLowerCase();
        return (
          documentNumber.includes(term) || fullName.includes(term) || description.includes(term)
        );
      });
    }

    const direction = this.returnSortDirection === 'asc' ? 1 : -1;
    return filtered.slice().sort((a, b) => {
      let compare = 0;
      switch (this.returnSortField) {
        case 'documentId':
          compare = a.document.documentId - b.document.documentId;
          break;
        case 'name':
          compare = `${a.document.firstName} ${a.document.lastName}`.localeCompare(
            `${b.document.firstName} ${b.document.lastName}`,
            'th'
          );
          break;
        case 'date':
          const createdAtA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const createdAtB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          compare = createdAtA.getTime() - createdAtB.getTime();
          break;
      }

      if (compare === 0) {
        compare = a.id.localeCompare(b.id);
      }

      return compare * direction;
    });
  }

  goToStep1(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToStep2(): void {
    if (!this.selectedBorrowers.length) {
      alert('กรุณาเลือกผู้ยืมอย่างน้อย 1 คน');
      return;
    }
    this.currentStep = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit(): void {
    if (!this.selectedBorrowIds.length) {
      this.selectedBorrowIdsControl.markAsTouched();
      this.selectedBorrowIdsControl.updateValueAndValidity();
      return;
    }

    const returnDto = this.buildReturnDto();
    if (!returnDto) {
      alert('ไม่พบข้อมูลผู้ยืมที่ตรงกับการเลือก');
      return;
    }

    this.registryBookService
      .createBulkReturns(returnDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdReturns) => {
          if (!createdReturns) {
            return;
          }

          Swal.fire({
            title: 'คืนเล่มสำเร็จ',
            text: ``,
            icon: 'success',
            confirmButtonText: 'ตกลง',
          }).then(() => window.location.reload());
        },
        error: (error) => {
          console.error('Failed to create return records', error);
          alert('ไม่สามารถบันทึกการคืนเล่มได้ในขณะนี้');
        },
      });
  }
  cancel(): void {
    this.router.navigate(['/registry-books']);
  }

  openScanner(): void {
    this.showScanner = true;
  }

  onScanSuccess(decodedText: string): void {
    const normalizedId = decodedText.trim();
    if (!normalizedId) {
      alert('QR นี้ไม่ตรงกับข้อมูลการยืมที่ยังไม่คืน');
      return;
    }

    this.registryBookService
      .getBorrowByBookId(normalizedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (borrow) => {
          if (!borrow || borrow.status !== 'BORROWED') {
            alert('QR นี้ไม่ตรงกับข้อมูลการยืมที่ยังไม่คืน');
            return;
          }

          const selected = new Set(this.selectedBorrowIds);
          selected.add(borrow.document.id);
          this.updateSelectedBorrowIds(Array.from(selected));
          const current = this.selectedBorrowersControl.value ?? [];
          if (!current.includes(borrow.name)) {
            this.selectedBorrowersControl.setValue([...current, borrow.name]);
          }
        },
        error: () => alert('QR นี้ไม่ตรงกับข้อมูลการยืมที่ยังไม่คืน'),
      });
  }

  onScanError(error: string): void {
    alert('เกิดข้อผิดพลาดจากการสแกน: ' + error);
  }

  onScannerClose(): void {
    this.showScanner = false;
  }
}
