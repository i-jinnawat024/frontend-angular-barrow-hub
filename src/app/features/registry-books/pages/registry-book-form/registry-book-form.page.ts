import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistryBookService } from '../../services/document.service';
import {
  Document,
  RegistryBookCreateDto,
  RegistryBookUpdateDto,
} from '../../../../shared/models/registry-book.model';

@Component({
  selector: 'app-registry-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registry-book-form.page.html',
  styleUrl: './registry-book-form.page.scss',
})
export class RegistryBookFormPage implements OnInit {
  form: FormGroup;
  isEditMode = false;
  id: string | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private registryBookService: RegistryBookService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      documentId: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      status: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      this.id = id;
      this.isEditMode = Boolean(id);

      if (this.isEditMode) {
        this.loadRegistryBook();
      } else {
        this.form.reset({
          documentId: '',
          title: '',
          description: '',
        });
      }
    });
    if (this.isEditMode) {
      this.form.get('status')?.addValidators(Validators.required);
    } else {
      this.form.get('status')?.clearValidators();
    }

    this.form.get('status')?.updateValueAndValidity();
  }

  loadRegistryBook(): void {
    if (!this.id) {
      return;
    }

    this.registryBookService
      .getRegistryBookById(Number(this.id))
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

    if (this.isEditMode && this.id) {
      const updateDto: RegistryBookUpdateDto = { ...dto, id: Number(this.id) };
      this.registryBookService
        .updateRegistryBook(this.id, updateDto)
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
      documentId: number;
      firstName: string;
      lastName: string;
      status: Document['status'];
    };
    if (this.isEditMode) {
      return {
        documentId: value.documentId,
        firstName: value.firstName,
        lastName: value.lastName,
        status: value.status,
      };
    }
    return {
      documentId: value.documentId,
      firstName: value.firstName,
      lastName: value.lastName,
    };
  }

  private patchForm(document: Document): void {
    this.form.patchValue({
      documentId: document.documentId,
      firstName: document.firstName,
      lastName: document.lastName,
      status: document.status,
    });
  }

  cancel(): void {
    this.router.navigate([`/registry-books`]);
  }
}
