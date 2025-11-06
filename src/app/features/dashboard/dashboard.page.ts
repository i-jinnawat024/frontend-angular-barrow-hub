import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from './dashboard.service';
import { Loan } from '../../shared/models/loan.model';
import {
  SortState,
  compareValues,
  cycleSortState,
  defaultSortState,
  toSearchableString,
} from '../../shared/utils/table-utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  stats: ReturnType<typeof DashboardService.prototype.getStats>;
  protected readonly searchTerm = signal('');
  protected readonly sortState = signal<SortState>({ ...defaultSortState });
  protected readonly today = new Date();
  protected readonly columns: Array<{
    label: string;
    property: string;
    sortable: boolean;
    accessor?: (loan: Loan) => unknown;
  }> = [
    {
      label: 'ข้อมูลเล่มทะเบียน',
      property: 'documentTitle',
      sortable: true,
      accessor: (loan) => loan.document.first_name + ' ' + loan.document.last_name,
    },
    {
      label: 'ข้อมูลผู้ยืม',
      property: 'borrowerName',
      sortable: true,
      accessor: (loan) => loan.borrower.name,
    },
    {
      label: 'วันที่ยืม',
      property: 'borrowedAt',
      sortable: true,
      accessor: (loan) => loan.borrowedAt,
    },
    {
      label: 'ระยะเวลาการยืม (วัน)',
      property: 'borrowedDays',
      sortable: true,
    }
  ];

  private readonly searchAccessors: Array<(loan: Loan) => unknown> = [
    (loan) => loan.document.first_name + ' ' + loan.document.last_name,
    (loan) => loan.document.documentNumber,
    (loan) => loan.borrower.name,
    (loan) => loan.borrower.position,
    (loan) => loan.status,
  ];

  protected readonly activeLoans = computed(() => this.stats().activeLoans);

  protected readonly filteredLoans = computed(() => {
    const loans = this.activeLoans();
    const term = this.searchTerm().trim().toLowerCase();

    const filtered = term
      ? loans.filter((loan) =>
          this.searchAccessors.some((accessor) =>
            toSearchableString(accessor(loan)).includes(term),
          ),
        )
      : loans;

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

  protected readonly totalActiveLoans = computed(() => this.activeLoans().length);

  protected readonly hasSearchTerm = computed(
    () => this.searchTerm().trim().length > 0,
  );

  constructor(private readonly dashboardService: DashboardService) {
    this.stats = this.dashboardService.getStats();
  }

  ngOnInit(): void {
    // Stats are already loaded from the service
  }

  getActiveLoans(): Loan[] {
    return this.filteredLoans();
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

  protected getDaysDifference(borrowedAt: Date): number {
    const today = new Date();
    const borrowed = new Date(borrowedAt);
    const diffTime = Math.abs(today.getTime() - borrowed.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

}
