import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReportService } from '../../services/report.service';
import { Borrow } from '../../../../shared/models/borrow.model';
import {
  SortState,
  compareValues,
  cycleSortState,
  defaultSortState,
  toSearchableString,
} from '../../../../shared/utils/table-utils';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './report.page.html',
  styleUrl: './report.page.scss',
  providers: [DatePipe],
})
export class ReportPage implements OnInit {
  form: FormGroup;
  private readonly borrows = signal<Borrow[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly sortState = signal<SortState>({ ...defaultSortState });
  selectedMonth = 0;
  selectedYear = 0;

  protected readonly columns: Array<{
    label: string;
    property: string;
    sortable: boolean;
    accessor?: (borrow: Borrow) => unknown;
  }> = [
    {
      label: 'เลขเล่มทะเบียน',
      property: 'bookNumber',
      sortable: true,
      accessor: (borrow) => borrow.registryBook.bookNumber,
    },
    {
      label: 'ชื่อ-นามสกุล',
      property: 'title',
      sortable: true,
      accessor: (borrow) => borrow.registryBook.name,
    },
    {
      label: 'ผู้ยืม',
      property: 'borrowerName',
      sortable: true,
      accessor: (borrow) => borrow.borrowerName,
    },
    {
      label: 'วันที่ยืม',
      property: 'borrowedDate',
      sortable: true,
      accessor: (borrow) => borrow.borrowedAt,
    },
    {
      label: 'เวลาที่ยืม',
      property: 'borrowedTime',
      sortable: true,
      accessor: (borrow) => borrow.borrowedAt,
    },
    {
      label: 'เหตุผล',
      property: 'reason',
      sortable: true,
      accessor: (borrow) => borrow.reason ?? '-',
    },
    {
      label: 'สถานะ',
      property: 'status',
      sortable: true,
      accessor: (borrow) => borrow.status,
    },
  ];

  private readonly searchAccessors: Array<(borrow: Borrow) => unknown> = [
    (borrow) => borrow.registryBook.bookNumber,
    (borrow) => borrow.registryBook.name,
    (borrow) => borrow.borrowerName,
    (borrow) => borrow.reason ?? '',
    (borrow) => borrow.status,
  ];

  protected readonly filteredBorrows = computed(() => {
    const raw = this.borrows();
    const term = this.searchTerm().trim().toLowerCase();

    const filtered = term
      ? raw.filter((borrow) =>
          this.searchAccessors.some((accessor) =>
            toSearchableString(accessor(borrow)).includes(term),
          ),
        )
      : raw;

    const sort = this.sortState();
    if (!sort.active) {
      return filtered;
    }

    const column = this.columns.find(
      (col) => col.property === sort.active && col.sortable && col.accessor,
    );

    if (!column?.accessor) {
      return filtered;
    }

    return [...filtered].sort((a, b) =>
      compareValues(column.accessor!(a), column.accessor!(b), sort.direction),
    );
  });

  protected readonly borrowsCount = computed(() => this.borrows().length);

  protected readonly hasSearchTerm = computed(
    () => this.searchTerm().trim().length > 0,
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportService: ReportService,
    private readonly datePipe: DatePipe,
  ) {
    const now = new Date();
    this.form = this.fb.group({
      month: [now.getMonth() + 1],
      year: [now.getFullYear()],
    });
  }

  ngOnInit(): void {
    this.loadReport();
    this.form.valueChanges.subscribe(() => {
      this.loadReport();
    });
  }

  loadReport(): void {
    const formValue = this.form.value;
    this.selectedMonth = formValue.month;
    this.selectedYear = formValue.year;
    this.borrows.set(
      this.reportService.getBorrowsByMonth(formValue.year, formValue.month),
    );
  }

  exportToCSV(): void {
    const data = this.filteredBorrows();
    if (data.length > 0) {
      this.reportService.exportToCSV(data, this.selectedYear, this.selectedMonth);
    } else {
      alert('ไม่มีข้อมูลให้ส่งออก กรุณาเลือกช่วงเวลาที่มีข้อมูลก่อน');
    }
  }

  exportToJSON(): void {
    const data = this.filteredBorrows();
    if (data.length > 0) {
      this.reportService.exportToJSON(
        data,
        this.selectedYear,
        this.selectedMonth,
      );
    } else {
      alert('ไม่มีข้อมูลให้ส่งออก กรุณาเลือกช่วงเวลาที่มีข้อมูลก่อน');
    }
  }

  getMonthName(month: number): string {
    const months = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    return months[month - 1] || '';
  }

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.reverse();
  }

  protected onSearchTermChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchTerm.set(value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected toggleSort(property: string): void {
    const column = this.columns.find((col) => col.property === property);
    if (!column?.sortable) {
      return;
    }

    const nextState = cycleSortState(this.sortState(), property);
    this.sortState.set(nextState);
  }

  protected isSortedAscending(property: string): boolean {
    const sort = this.sortState();
    return sort.active === property && sort.direction === 'asc';
  }

  protected isSortedDescending(property: string): boolean {
    const sort = this.sortState();
    return sort.active === property && sort.direction === 'desc';
  }
}
