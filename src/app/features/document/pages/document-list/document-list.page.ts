import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../../../shared/models/registry-book.model';
import {
  SortState,
  compareValues,
  cycleSortState,
  defaultSortState,
  toSearchableString,
} from '../../../../shared/utils/table-utils';
import { readTabularFile } from '../../../../shared/utils/csv-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'
import { AlertService } from '../../../../shared/services/alert.service';

type RegistryBookStatus = Document['status'];

interface RegistryBookImportPreviewRow {
  id: number;
  rowNumber: number;
  documentId: number;
  firstName:string,
  lastName:string,
  description?: string;
  status: RegistryBookStatus;
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './document-list.page.html',
  styleUrl: './document-list.page.scss',
})
export class DocumentListPage implements OnInit {
  private readonly documents = signal<Document[]>([]);
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
  protected readonly templateDownloadUrl = '/samples/documents-template.xlsx';
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns: Array<{
    label: string;
    property: string;
    sortable: boolean;
    accessor?: (book: Document) => unknown;
  }> = [
    {
      label: 'เลขเล่มทะเบียน',
      property: 'DocumnetNumber',
      sortable: true,
      accessor: (book) => book.documentId,
    },
    {
      label: 'ชื่อ-นามสกุล',
      property: 'name',
      sortable: true,
      accessor: (book) => `${book.firstName} ${book.lastName}`,
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

  private readonly searchAccessors: Array<(book: Document) => unknown> = [
    (book) => book.documentId,
    (book) => `${book.firstName} ${book.lastName}`,
    (book) => book.status,
  ];

  protected readonly filteredRegistryBooks = computed(() => {
    const raw = this.documents();
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
    () => this.documents().length,
  );

  protected readonly hasSearchTerm = computed(
    () => this.searchTerm().trim().length > 0,
  );

  constructor(
    private readonly documentService: DocumentService,
    private readonly router: Router,
    private readonly alert: AlertService,
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
    this.documentService
      .getDocuments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (books) => this.documents.set(books),
        error: (error) =>
          console.error('Failed to load documents', error),
      });
  }

  deleteRegistryBook(id: number): void {
    if (!confirm('ต้องการลบเล่มทะเบียนรายการนี้หรือไม่?')) {
      return;
    }

    this.documentService
      .deleteRegistryBook(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadRegistryBooks(),
        error: (error) => {
          console.error('Failed to delete document', error);
          this.alert.error('ไม่สามารถลบเอกสารได้','กรุณาลองใหม่อีกครั้ง');
        },
      });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/documents', id]);
  }

  editDocument(id: number): void {
    this.router.navigate(['/documents', id, 'edit']);
  }

  createDocument(): void {
    this.router.navigate(['/documents', 'create']);
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

    this.isImporting.set(true);

    const payload = previewRows.map((row) => ({
      documentId: row.documentId,
      firstName: row.firstName,
      lastName: row.lastName,
    }));

    this.documentService
      .importDocuments(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.loadRegistryBooks();
          this.resetImportState();

          let message = `�,T�,3�1?�,,�1%�,��,,�1%�,-�,��,1�,��1?�,��1^�,��,-�,��1?�,s�,�,��,T�,��,3�1?�,��1؅,^ ${result.imported} �,��,��,��,?�,��,�`;
          if (result.duplicateBookNumbers.length > 0) {
            const duplicated = Array.from(new Set(result.duplicateBookNumbers))
              .filter((value) => value.trim().length > 0)
              .join(', ');
            message += `
�,��,��,��,?�,��,��,-�,�1^�,,�1%�,��,��1?�,T�,��1^�,-�,؅,^�,��,?�,,�1%�,-�,��,1�,��,<�1%�,3: ${duplicated}`;
          }

          this.alert.success(message);
          this.isImporting.set(false);
        },
        error: (error) => {
          console.error('Failed to import document', error);
          this.alert.error('ไม่สามารถนำเข้าได้',error.status === 409 ? 'มีเลขเล่มทะเบียนซ้ำในไฟล์' : 'กรุณาตรวจสอบไฟล์ Template ก่อนอัปโหลด');
          this.isImporting.set(false);
        },
      });
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
    const documentIdIndex = this.findHeaderIndex(headers, [
      'เลขเล่มทะเบียน',
      'ชื่อ',
      'นามสกุล',
      'สถานะ',
    ]);
    const firstNameIndex = this.findHeaderIndex(headers, ['ชื่อ']);
    const lastNameIndex = this.findHeaderIndex(headers, [ 'นามสกุล']);
    const descriptionIndex = this.findHeaderIndex(headers, ['รายละเอียด', 'คำอธิบาย']);
    const statusIndex = this.findHeaderIndex(headers, ['สถานะ']);

    const errors: string[] = [];

    if (documentIdIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
      errors.push('ไม่พบคอลัมน์ "เลขเล่มทะเบียน" หรือ "ชื่อ-นามสกุล" ในไฟล์');
      return { rows: [], errors };
    }

    const previewRows: RegistryBookImportPreviewRow[] = [];
    const seenBookNumbers = new Set<number>();

    for (let index = 1; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 1;

      if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
        continue;
      }

      const documentId = (row[documentIdIndex] ?? '').trim();
      const firstName = String(row[firstNameIndex] ?? '').trim();
      const lastName = String(row[lastNameIndex] ?? '').trim();
      const description =
        descriptionIndex !== -1 ? String(row[descriptionIndex] ?? '').trim() : '';
      const statusRaw =
        statusIndex !== -1 ? String(row[statusIndex] ?? '').trim() : '';

      if (!documentId || !firstName || !lastName) {
        errors.push(`แถวที่ ${rowNumber-1}: ต้องระบุเลขเล่มทะเบียนและชื่อ-นามสกุล`);
        continue;
      }

      const normalizedKey = Number(documentId);
      if (seenBookNumbers.has(normalizedKey)) {
        errors.push(`แถวที่ ${rowNumber-1}: เลขเล่มทะเบียน "${documentId}" ซ้ำกับข้อมูลก่อนหน้าในไฟล์`);
        continue;
      }

      let status: Document['status'] = 'ACTIVE';
      if (statusRaw) {
        const normalizedStatus = this.normalizeRegistryBookStatus(statusRaw);
        if (!normalizedStatus) {
          errors.push(
            `แถวที่ ${rowNumber-1}: ไม่สามารถตีความสถานะ "${statusRaw}" ได้ กรุณาใช้คำว่า พร้อมใช้งาน, กำลังยืม, เก็บถาวร หรือ ปิดใช้งาน`,
          );
          continue;
        }
        status = normalizedStatus;
      }

      seenBookNumbers.add(normalizedKey);
      previewRows.push({
        id: 0,
        rowNumber,
        documentId: Number(documentId),
        firstName,
        lastName,
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
      พร้อมใช้งาน: 'ACTIVE',
      ใช้งาน: 'ACTIVE',
      ว่าง: 'ACTIVE',
      active: 'ACTIVE',
      กำลังยืม: 'BORROWED',
      ยืม: 'BORROWED',
      borrowed: 'BORROWED',
      เก็บถาวร: 'ARCHIVED',
      archived: 'ARCHIVED',
      ปิดใช้งาน: 'INACTIVE',
      ไม่ใช้งาน: 'INACTIVE',
      inactive: 'INACTIVE',
    };

    return statusMap[normalized] ?? null;
  }

  private resetImportState(): void {
    this.importPreview.set([]);
    this.importErrors.set([]);
    this.importFileName.set(null);
    this.isImporting.set(false);
  }

   exportToExcel() {
    const data = this.filteredRegistryBooks().map((book) => ({
      'เลขเล่มทะเบียน': book.documentId,
      'ชื่อ': book.firstName,
      'นามสกุล': book.lastName,
      'สถานะ': this.mapStatus(book.status),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto width (ปรับให้พอดี)
    const colWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, 12) }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RegistryBooks');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `document-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  mapStatus(status: string) {
    switch (status) {
      case 'ACTIVE': return 'พร้อมใช้งาน';
      case 'BORROWED': return 'กำลังยืม';
      case 'ARCHIVED': return 'เก็บถาวร';
      case 'INACTIVE': return 'ปิดใช้งาน';
      default: return 'ไม่ทราบสถานะ';
    }
  }

}
