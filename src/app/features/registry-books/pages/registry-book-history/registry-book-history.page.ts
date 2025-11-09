import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBook } from '../../../../shared/models/registry-book.model';
import { Borrow } from '../../../../shared/models/borrow.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-registry-book-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registry-book-history.page.html',
  styleUrl: './registry-book-history.page.scss',
})
export class RegistryBookHistoryPage implements OnInit {
  registryBook: RegistryBook | undefined;
  borrowHistory: Borrow[] = [];
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly registryBookService: RegistryBookService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.router.navigate(['/registry-books']);
            return EMPTY;
          }

          return this.registryBookService.getRegistryBookById(id).pipe(
            switchMap((book) => {
              this.registryBook = book;
              return this.registryBookService.getBorrowHistoryByBookId(book.id);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (history) => (this.borrowHistory = history),
        error: () => this.router.navigate(['/registry-books']),
      });
  }

  goBack(): void {
    if (this.registryBook) {
      this.router.navigate(['/registry-books', this.registryBook.id]);
    } else {
      this.router.navigate(['/registry-books']);
    }
  }
}
