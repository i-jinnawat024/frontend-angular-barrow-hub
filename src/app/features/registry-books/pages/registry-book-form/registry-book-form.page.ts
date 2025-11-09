import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBook, RegistryBookCreateDto, RegistryBookUpdateDto } from '../../../../shared/models/registry-book.model';

@Component({
  selector: 'app-registry-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registry-book-form.page.html',
  styleUrl: './registry-book-form.page.scss'
})
export class RegistryBookFormPage implements OnInit {
  form: FormGroup;
  isEditMode = false;
  bookId: string | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private registryBookService: RegistryBookService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      bookNumber: ['', [Validators.required]],
      title: ['', [Validators.required]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        this.bookId = id;
        this.isEditMode = Boolean(id);

        if (this.isEditMode) {
          this.loadRegistryBook();
        } else {
          this.form.reset({
            bookNumber: '',
            title: '',
            description: '',
          });
        }
      });
  }

  loadRegistryBook(): void {
    if (!this.bookId) {
      return;
    }

    this.registryBookService
      .getRegistryBookById(this.bookId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (book) => this.patchForm(book),
        error: () => this.router.navigate(['/registry-books']),
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.mapFormToDto();

    if (this.isEditMode && this.bookId) {
      const updateDto: RegistryBookUpdateDto = { ...dto };
      this.registryBookService
        .updateRegistryBook(this.bookId, updateDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigate(['/registry-books']),
          error: (error) => {
            console.error('Failed to update registry book', error);
            window.alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
          },
        });
    } else {
      this.registryBookService
        .createRegistryBook(dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigate(['/registry-books']),
          error: (error) => {
            console.error('Failed to create registry book', error);
            window.alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
          },
        });
    }
  }

  private mapFormToDto(): RegistryBookCreateDto {
    const value = this.form.value as {
      bookNumber: string;
      title: string;
      description?: string | null;
    };

    return {
      bookNumber: (value.bookNumber ?? '').trim(),
      name: (value.title ?? '').trim(),
      description: value.description?.trim() || undefined,
    };
  }

  private patchForm(document: RegistryBook): void {
    this.form.patchValue({
      bookNumber: document.documentId,
      title: document.firstName + ' ' + document.lastName,
      description: '-',
    });
  }

  cancel(): void {
    this.router.navigate(['/registry-books']);
  }
}

