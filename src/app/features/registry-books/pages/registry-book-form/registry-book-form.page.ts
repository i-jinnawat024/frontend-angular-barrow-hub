import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBookCreateDto } from '../../../../shared/models/registry-book.model';

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
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.bookId = params['id'];
        this.isEditMode = params['id'] !== 'create';
        if (this.isEditMode) {
          this.loadRegistryBook();
        }
      }
    });
  }

  loadRegistryBook(): void {
    if (!this.bookId) return;
    const book = this.registryBookService.getRegistryBookById(this.bookId);
    if (book) {
      this.form.patchValue({
        bookNumber: book.bookNumber,
        name: book.name,
        description: book.description || ''
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      if (this.isEditMode && this.bookId) {
        const updated = this.registryBookService.updateRegistryBook(this.bookId, this.form.value);
        if (updated) {
          this.router.navigate(['/registry-books']);
        }
      } else {
        const created = this.registryBookService.createRegistryBook(this.form.value);
        if (created) {
          this.router.navigate(['/registry-books']);
        }
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/registry-books']);
  }
}

