import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
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
import { readTabularFile } from '../../../../shared/utils/csv-utils';

type RegistryBookStatus = RegistryBook['status'];

interface RegistryBookImportPreviewRow {
  rowNumber: number;
  bookNumber: string;
  name: string;
  description?: string;
  status: RegistryBookStatus;
}

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
  protected readonly importPreview = signal<RegistryBookImportPreviewRow[]>([]);
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
  protected readonly templateDownloadUrl = '/samples/registry-books-template.xlsx';

  protected readonly columns: Array<{
    label: string;
    property: string;
    sortable: boolean;
    accessor?: (book: RegistryBook) => unknown;
  }> = [
    {
      label: 'เลขทะเบียน',
      property: 'DocumnetNumber',
      sortable: true,
      accessor: (book) => book.bookNumber,
    },
    {
      label: 'ชื่อ-นามสกุล',
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
      label: 'จัดการ',
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

  @ViewChild('registryImportInput') private registryImportInput?: ElementRef<HTMLInputElement>;

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
    if (confirm('ต้องการลบเล่มทะเบียนรายการนี้หรือไม่?')) {
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

  protected openImportDialog(): void {
    if (this.registryImportInput) {
      this.registryImportInput.nativeElement.value = '';
      this.registryImportInput.nativeElement.click();
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
      const { rows, errors } = this.parseRegistryBookImport(rawRows);
      this.importPreview.set(rows);
      this.importErrors.set([...readErrors, ...errors]);
    } catch (error) {
      console.error(error);
      this.importPreview.set([]);
      this.importErrors.set(['ไม่สามารถอ่านไฟล์สำหรับนำเข้าได้ กรุณาลองใหม่อีกครั้ง']);
    } finally {
      this.isImporting.set(false);
      if (this.registryImportInput) {
        this.registryImportInput.nativeElement.value = '';
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

    const result = this.registryBookService.importRegistryBooks(
      previewRows.map((row) => ({
        bookNumber: row.bookNumber,
        name: row.name,
        description: row.description,
        status: row.status,
      })),
    );

    this.loadRegistryBooks();
    this.resetImportState();

    let message = `นำเข้าเล่มทะเบียนสำเร็จ ${result.imported} รายการ`;
    if (result.duplicateBookNumbers.length > 0) {
      const duplicated = Array.from(new Set(result.duplicateBookNumbers))
        .filter((value) => value.trim().length > 0)
        .join(', ');
      message += `\nรายการที่ข้ามเนื่องจากข้อมูลซ้ำ: ${duplicated}`;
    }

    window.alert(message);
  }

  private parseRegistryBookImport(
    rows: string[][],
  ): { rows: RegistryBookImportPreviewRow[]; errors: string[] } {
    if (rows.length === 0) {
      return {
        rows: [],
        errors: ['ไฟล์ไม่มีข้อมูล กรุณาตรวจสอบไฟล์ Template ก่อนอัปโหลด'],
      };
    }

    const headers = rows[0].map((cell) =>
      this.normalizeHeader(String(cell ?? '')),
    );
    const bookNumberIndex = this.findHeaderIndex(headers, [
      'เลขเล่มทะเบียน',
      'หมายเลขเล่มทะเบียน',
      'รหัสเล่มทะเบียน',
    ]);
    const nameIndex = this.findHeaderIndex(headers, ['ชื่อเล่มทะเบียน', 'ชื่อเล่มทะเบียน/ทะเบียน']);
    const descriptionIndex = this.findHeaderIndex(headers, ['รายละเอียด', 'คำอธิบาย']);
    const statusIndex = this.findHeaderIndex(headers, ['สถานะ']);

    const errors: string[] = [];

    if (bookNumberIndex === -1 || nameIndex === -1) {
      errors.push('ไม่พบคอลัมน์ "เลขเล่มทะเบียน" หรือ "ชื่อเล่มทะเบียน" ในไฟล์');
      return { rows: [], errors };
    }

    const previewRows: RegistryBookImportPreviewRow[] = [];
    const seenBookNumbers = new Set<string>();

    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 1;

      if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
        continue;
      }

      const bookNumber = String(row[bookNumberIndex] ?? '').trim();
      const name = String(row[nameIndex] ?? '').trim();
      const description =
        descriptionIndex !== -1 ? String(row[descriptionIndex] ?? '').trim() : '';
      const statusRaw =
        statusIndex !== -1 ? String(row[statusIndex] ?? '').trim() : '';

      if (!bookNumber || !name) {
        errors.push(`แถวที่ ${rowNumber}: ต้องระบุเลขเล่มทะเบียนและชื่อเล่มทะเบียน`);
        continue;
      }

      const normalizedKey = bookNumber.toLowerCase();
      if (seenBookNumbers.has(normalizedKey)) {
        errors.push(`แถวที่ ${rowNumber}: เลขเล่มทะเบียน "${bookNumber}" ซ้ำกับข้อมูลก่อนหน้าในไฟล์`);
        continue;
      }

      let status: RegistryBookStatus = 'active';
      if (statusRaw) {
        const normalizedStatus = this.normalizeRegistryBookStatus(statusRaw);
        if (!normalizedStatus) {
          errors.push(
            `แถวที่ ${rowNumber}: ไม่สามารถตีความสถานะ "${statusRaw}" ได้ กรุณาใช้คำว่า พร้อมใช้งาน, กำลังยืม, เก็บถาวร หรือ ปิดใช้งาน`,
          );
          continue;
        }
        status = normalizedStatus;
      }

      seenBookNumbers.add(normalizedKey);
      previewRows.push({
        rowNumber,
        bookNumber,
        name,
        description: description || undefined,
        status,
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

  private normalizeRegistryBookStatus(value: string): RegistryBookStatus | null {
    const normalized = value.trim().toLowerCase();
    const statusMap: Record<string, RegistryBookStatus> = {
      พร้อมใช้งาน: 'active',
      ใช้งาน: 'active',
      ว่าง: 'active',
      active: 'active',
      กำลังยืม: 'borrowed',
      ยืม: 'borrowed',
      borrowed: 'borrowed',
      เก็บถาวร: 'archived',
      archived: 'archived',
      ปิดใช้งาน: 'inactive',
      ไม่ใช้งาน: 'inactive',
      inactive: 'inactive',
    };

    return statusMap[normalized] ?? null;
  }

  private resetImportState(): void {
    this.importPreview.set([]);
    this.importErrors.set([]);
    this.importFileName.set(null);
    this.isImporting.set(false);
  }
}
