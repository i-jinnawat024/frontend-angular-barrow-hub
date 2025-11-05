import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StaffService } from '../../services/staff.service';
import { Staff } from '../../../../shared/models/staff.model';
import {
  SortState,
  compareValues,
  cycleSortState,
  defaultSortState,
  toSearchableString,
} from '../../../../shared/utils/table-utils';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './staff-list.page.html',
  styleUrl: './staff-list.page.scss',
})
export class StaffListPage implements OnInit {
  private readonly staffMembers = signal<Staff[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly sortState = signal<SortState>({ ...defaultSortState });

  protected readonly columns: Array<{
    label: string;
    property: string;
    sortable: boolean;
    accessor?: (member: Staff) => unknown;
  }> = [
    {
      label: 'ชื่อ-นามสกุล',
      property: 'name',
      sortable: true,
      accessor: (member) => member.name,
    },
    {
      label: 'อีเมล',
      property: 'email',
      sortable: true,
      accessor: (member) => member.email,
    },
    {
      label: 'ตำแหน่ง',
      property: 'position',
      sortable: true,
      accessor: (member) => member.position,
    },
    {
      label: 'หน่วยงาน',
      property: 'department',
      sortable: true,
      accessor: (member) => member.department ?? '',
    },
    {
      label: 'สถานะ',
      property: 'isActive',
      sortable: true,
      accessor: (member) => (member.isActive ? 'active' : 'inactive'),
    },
    {
      label: 'การจัดการ',
      property: 'actions',
      sortable: false,
    },
  ];

  private readonly searchAccessors: Array<(member: Staff) => unknown> = [
    (member) => member.name,
    (member) => member.email,
    (member) => member.position,
    (member) => member.department ?? '',
    (member) => (member.isActive ? 'active' : 'inactive'),
  ];

  protected readonly filteredStaff = computed(() => {
    const raw = this.staffMembers();
    const term = this.searchTerm().trim().toLowerCase();

    const filtered = term
      ? raw.filter((member) =>
          this.searchAccessors.some((accessor) =>
            toSearchableString(accessor(member)).includes(term),
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

  protected readonly staffCount = computed(() => this.staffMembers().length);

  protected readonly hasSearchTerm = computed(
    () => this.searchTerm().trim().length > 0,
  );

  constructor(
    private readonly staffService: StaffService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.staffMembers.set(this.staffService.getStaff());
  }

  deleteStaff(id: string): void {
    if (confirm('ต้องการลบบุคลากรรายการนี้หรือไม่?')) {
      const success = this.staffService.deleteStaff(id);
      if (success) {
        this.loadStaff();
      }
    }
  }

  viewDetails(id: string): void {
    this.router.navigate(['/staff', id]);
  }

  editStaff(id: string): void {
    this.router.navigate(['/staff', id, 'edit']);
  }

  createStaff(): void {
    this.router.navigate(['/staff', 'create']);
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
