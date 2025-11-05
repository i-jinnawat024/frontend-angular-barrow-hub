import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBook } from '../../../../shared/models/registry-book.model';
import {
  SortState,
  compareValues,
  cycleSortState,
  defaultSortState,
  toSearchableString,
} from '../../../../shared/utils/table-utils';

@Component({
  selector: 'app-registry-book-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './registry-book-list.page.html',
  styleUrl: './registry-book-list.page.scss',
})
export class RegistryBookListPage implements OnInit {
  private readonly registryBooks = signal<RegistryBook[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly sortState = signal<SortState>({ ...defaultSortState });
  private readonly isDesktopScreen = signal(this.checkIsDesktop());
  protected readonly isDesktopView = computed(() => this.isDesktopScreen());

  protected readonly columns: Array<{
    label: string;
    property: string;
    sortable: boolean;
    accessor?: (book: RegistryBook) => unknown;
  }> = [
    {
      label: 'เลขทะเบียน',
      property: 'bookNumber',
      sortable: true,
      accessor: (book) => book.bookNumber,
    },
    {
      label: 'ชื่อหนังสือ',
      property: 'name',
      sortable: true,
      accessor: (book) => book.name,
    },
    {
      label: 'สถานะ',
      property: 'status',
      sortable: true,
      accessor: (book) => book.status,
    },
    {
      label: 'การดำเนินการ',
      property: 'actions',
      sortable: false,
    },
  ];

  private readonly searchAccessors: Array<(book: RegistryBook) => unknown> = [
    (book) => book.bookNumber,
    (book) => book.name,
    (book) => book.status,
  ];

  protected readonly filteredRegistryBooks = computed(() => {
    const raw = this.registryBooks();
    const term = this.searchTerm().trim().toLowerCase();

    const filtered = term
      ? raw.filter((book) =>
          this.searchAccessors.some((accessor) =>
            toSearchableString(accessor(book)).includes(term),
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

  protected readonly registryBookCount = computed(
    () => this.registryBooks().length,
  );

  protected readonly hasSearchTerm = computed(
    () => this.searchTerm().trim().length > 0,
  );

  constructor(
    private readonly registryBookService: RegistryBookService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRegistryBooks();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isDesktopScreen.set(this.checkIsDesktop());
  }

  private checkIsDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }

  loadRegistryBooks(): void {
    this.registryBooks.set(this.registryBookService.getRegistryBooks());
  }

  deleteRegistryBook(id: string): void {
    if (confirm('ต้องการลบทะเบียนหนังสือรายการนี้หรือไม่?')) {
      const success = this.registryBookService.deleteRegistryBook(id);
      if (success) {
        this.loadRegistryBooks();
      }
    }
  }

  viewDetails(id: string): void {
    this.router.navigate(['/registry-books', id]);
  }

  editRegistryBook(id: string): void {
    this.router.navigate(['/registry-books', id, 'edit']);
  }

  createRegistryBook(): void {
    this.router.navigate(['/registry-books', 'create']);
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
