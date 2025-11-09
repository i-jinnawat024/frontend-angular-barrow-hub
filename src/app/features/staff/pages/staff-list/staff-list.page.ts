import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { StaffService } from '../../services/staff.service';
import { Staff } from '../../../../shared/models/staff.model';
import {
  SortState,
  compareValues,
  cycleSortState,
  defaultSortState,
  toSearchableString,
} from '../../../../shared/utils/table-utils';
import { readTabularFile } from '../../../../shared/utils/csv-utils';

interface StaffImportPreviewRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  isActive: boolean;
}

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
  protected readonly isDesktopView = computed(() => this.isDesktopScreen());
  private readonly isDesktopScreen = signal(this.checkIsDesktop());
  protected readonly importPreview = signal<StaffImportPreviewRow[]>([]);
  protected readonly importErrors = signal<string[]>([]);
  protected readonly importFileName = signal<string | null>(null);
  protected readonly isImporting = signal(false);
  protected readonly hasImportPreview = computed(
    () => this.importPreview().length > 0,
  );
  protected readonly hasImportErrors = computed(
    () => this.importErrors().length > 0,
  );
  protected readonly importPreviewSample = computed(() =>
    this.importPreview().slice(0, 10),
  );
  protected readonly importPreviewRemaining = computed(() => {
    const total = this.importPreview().length;
    return total > 10 ? total - 10 : 0;
  });
  protected readonly templateDownloadUrl = '/samples/staff-template.xlsx';
  private readonly destroyRef = inject(DestroyRef);


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
      accessor: (member) => member.firstName + ' ' + member.lastName,
    },
    {
      label: 'เบอร์โทร',
      property: 'phoneNumber',
      sortable: false,
      accessor: (member) => member.phone,
    },
    // {
    //   label: 'ตำแหน่ง',
    //   property: 'position',
    //   sortable: true,
    //   accessor: (member) => member.position,
    // },
    // {
    //   label: 'หน่วยงาน',
    //   property: 'department',
    //   sortable: true,
    //   accessor: (member) => member.department ?? '',
    // },
    {
      label: 'สถานะ',
      property: 'isActive',
      sortable: true,
      accessor: (member) => (member.isActive ? 'active' : 'inactive'),
    },
    {
      label: 'จัดการ',
      property: 'actions',
      sortable: false,
    },
  ];

  private readonly searchAccessors: Array<(member: Staff) => unknown> = [
    (member) => member.firstName + ' ' + member.lastName,
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

  @ViewChild('staffImportInput') private staffImportInput?: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.staffService
      .getStaff()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (staff) => this.staffMembers.set(staff),
        error: (error) =>
          console.error('Failed to load staff list from API', error),
      });
  }

  deleteStaff(id: string): void {
    if (!confirm('ต้องการลบบุคลากรรายการนี้หรือไม่?')) {
      return;
    }

    this.staffService
      .deleteStaff(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadStaff(),
        error: (error) => {
          console.error('Failed to delete staff member', error);
          window.alert('ไม่สามารถลบบุคลากรได้ กรุณาลองใหม่อีกครั้ง');
        },
      });
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

  protected openImportDialog(): void {
    if (this.staffImportInput) {
      this.staffImportInput.nativeElement.value = '';
      this.staffImportInput.nativeElement.click();
    }
  }

  protected async onImportFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    this.importFileName.set(file.name);
    this.importErrors.set([]);
    this.importPreview.set([]);

    this.isImporting.set(true);

    try {
      const { rows: rawRows, errors: readErrors } = await readTabularFile(file);
      const { rows, errors } = this.parseStaffImport(rawRows);
      this.importPreview.set(rows);
      this.importErrors.set([...readErrors, ...errors]);
    } catch (error) {
      console.error(error);
      this.importPreview.set([]);
      this.importErrors.set(['ไม่สามารถอ่านไฟล์สำหรับนำเข้าได้ กรุณาลองใหม่อีกครั้ง']);
    } finally {
      this.isImporting.set(false);
      if (this.staffImportInput) {
        this.staffImportInput.nativeElement.value = '';
      }
    }
  }

  protected cancelImportPreview(): void {
    this.resetImportState();
  }

  protected confirmImportPreview(): void {
    const previewRows = this.importPreview();
    if (previewRows.length === 0) {
      return;
    }

    this.isImporting.set(true);

    const payload = previewRows.map((row) => ({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      position: row.position,
      department: row.department,
      isActive: row.isActive,
    }));

    this.staffService
      .importStaff(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.loadStaff();
          this.resetImportState();

          let message = `�,T�,3�1?�,,�1%�,��,,�1%�,-�,��,1�,��,s�,,�,,�,��,��,?�,��,��,3�1?�,��1؅,^ ${result.imported} �,��,��,��,?�,��,�`;
          if (result.duplicateEmails.length > 0) {
            const duplicated = Array.from(new Set(result.duplicateEmails))
              .filter((value) => value.trim().length > 0)
              .join(', ');
            message += `
�,��,��,��,?�,��,��,-�,�1^�,,�1%�,��,��1?�,T�,��1^�,-�,؅,^�,��,?�,-�,�1?�,��,��,<�1%�,3: ${duplicated}`;
          }

          window.alert(message);
          this.isImporting.set(false);
        },
        error: (error) => {
          console.error('Failed to import staff data', error);
          window.alert('ไม่สามารถนำเข้าข้อมูลบุคลากรได้ กรุณาลองใหม่อีกครั้ง');
          this.isImporting.set(false);
        },
      });
  }

  private parseStaffImport(
    rows: string[][],
  ): { rows: StaffImportPreviewRow[]; errors: string[] } {
    if (rows.length === 0) {
      return {
        rows: [],
        errors: ['ไฟล์ไม่มีข้อมูล กรุณาตรวจสอบไฟล์ Template ก่อนอัปโหลด'],
      };
    }

    const headers = rows[0].map((cell) =>
      this.normalizeHeader(String(cell ?? '')),
    );
    const nameIndex = this.findHeaderIndex(headers, ['ชื่อ-นามสกุล', 'ชื่อและนามสกุล']);
    const emailIndex = this.findHeaderIndex(headers, ['อีเมล', 'อีเมล์', 'email']);
    const phoneIndex = this.findHeaderIndex(headers, ['เบอร์โทร', 'เบอร์โทรศัพท์', 'โทรศัพท์']);
    const positionIndex = this.findHeaderIndex(headers, ['ตำแหน่ง']);
    const departmentIndex = this.findHeaderIndex(headers, ['หน่วยงาน', 'แผนก']);
    const statusIndex = this.findHeaderIndex(headers, ['สถานะ']);

    const errors: string[] = [];

    if (nameIndex === -1 || emailIndex === -1 || positionIndex === -1) {
      errors.push('ไม่พบคอลัมน์ "ชื่อ-นามสกุล", "อีเมล" หรือ "ตำแหน่ง" ในไฟล์');
      return { rows: [], errors };
    }

    const previewRows: StaffImportPreviewRow[] = [];
    const seenEmails = new Set<string>();

    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 1;

      if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
        continue;
      }

      const name = String(row[nameIndex] ?? '').trim();
      const email = String(row[emailIndex] ?? '').trim();
      const phone = phoneIndex !== -1 ? String(row[phoneIndex] ?? '').trim() : '';
      const position = String(row[positionIndex] ?? '').trim();
      const department =
        departmentIndex !== -1 ? String(row[departmentIndex] ?? '').trim() : '';
      const statusRaw =
        statusIndex !== -1 ? String(row[statusIndex] ?? '').trim() : '';

      if (!name || !email || !position) {
        errors.push(`แถวที่ ${rowNumber}: ต้องระบุชื่อ-นามสกุล, อีเมล และตำแหน่ง`);
        continue;
      }

      if (!this.isValidEmail(email)) {
        errors.push(`แถวที่ ${rowNumber}: อีเมล "${email}" ไม่ถูกต้อง`);
        continue;
      }

      const normalizedEmail = email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        errors.push(`แถวที่ ${rowNumber}: อีเมล "${email}" ซ้ำกับข้อมูลก่อนหน้าในไฟล์`);
        continue;
      }

      let isActive = true;
      if (statusRaw) {
        const statusValue = this.normalizeStaffStatus(statusRaw);
        if (statusValue === null) {
          errors.push(
            `แถวที่ ${rowNumber}: ไม่สามารถตีความสถานะ "${statusRaw}" ได้ กรุณาใช้คำว่า เปิดใช้งาน หรือ ปิดใช้งาน`,
          );
          continue;
        }
        isActive = statusValue;
      }

      seenEmails.add(normalizedEmail);
      previewRows.push({
        rowNumber,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1],
        email,
        phone: phone || undefined,
        position,
        department: department || undefined,
        isActive,
      });
    }

    if (previewRows.length === 0 && errors.length === 0) {
      errors.push('ไม่พบข้อมูลที่สามารถนำเข้าได้');
    }

    return { rows: previewRows, errors };
  }

  private normalizeHeader(header: string): string {
    return header.replace(/\s+/g, '').replace(/\uFEFF/g, '').toLowerCase();
  }

  private findHeaderIndex(headers: string[], expectedHeaders: string[]): number {
    return headers.findIndex((header) => expectedHeaders.includes(header));
  }

  private normalizeStaffStatus(value: string): boolean | null {
    const normalized = value.trim().toLowerCase();
    const trueValues = ['เปิดใช้งาน', 'ใช้งาน', 'ใช้งานอยู่', 'พร้อมใช้งาน', 'active', 'true', '1', 'yes'];
    const falseValues = ['ปิดใช้งาน', 'ไม่ใช้งาน', 'หยุดใช้', 'inactive', 'false', '0', 'no'];

    if (trueValues.includes(normalized)) {
      return true;
    }
    if (falseValues.includes(normalized)) {
      return false;
    }
    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private resetImportState(): void {
    this.importPreview.set([]);
    this.importErrors.set([]);
    this.importFileName.set(null);
    this.isImporting.set(false);
  }

  private checkIsDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }
}
