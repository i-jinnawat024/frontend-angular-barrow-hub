import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistryBookService } from '../../services/document.service';
import { Document } from '../../../../shared/models/registry-book.model';
import { Borrow } from '../../../../shared/models/borrow.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { ThaiDatePipe } from '../../../../shared/pipes/thai-date.pipe';

@Component({
  selector: 'app-registry-book-history',
  standalone: true,
  imports: [CommonModule, ThaiDatePipe],
  templateUrl: './registry-book-history.page.html',
  styleUrl: './registry-book-history.page.scss',
})
export class RegistryBookHistoryPage implements OnInit {
  document: Document | undefined;
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
        const id = Number(params.get('id'));
        console.log('param id =', id);
        if (!id) {
          this.router.navigate(['/registry-books']);
          return EMPTY;
        }

        return this.registryBookService.getRegistryBookById(id).pipe(
          tap((document) => {
            console.log('book =', document);
            this.document = document;
          }),
          switchMap(() => this.registryBookService.getBorrowHistoryByDocumentId(id)),
          tap((history) => console.log('history =', history))
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe({
      next: (history) => {
        console.log('object');
        this.borrowHistory = history;
        console.log('set borrowHistory done', this.borrowHistory);
      },
      error: (err) => console.error('error =', err),
    });
}


  goBack(): void {
    if (this.document) {
      this.router.navigate(['/registry-books', this.document.documentId]);
    } else {
      this.router.navigate(['/registry-books']);
    }
  }
}
