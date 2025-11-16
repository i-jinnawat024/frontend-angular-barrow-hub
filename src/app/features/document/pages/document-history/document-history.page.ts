import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../../../shared/models/registry-book.model';
import { Borrow } from '../../../../shared/models/borrow.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { ThaiDatePipe } from '../../../../shared/pipes/thai-date.pipe';

@Component({
  selector: 'app-document-history',
  standalone: true,
  imports: [CommonModule, ThaiDatePipe],
  templateUrl: './document-history.page.html',
  styleUrl: './document-history.page.scss',
})
export class DocumentHistoryPage implements OnInit {
  document: Document | undefined;
  borrowHistory: Borrow[] = [];
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly documentService: DocumentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

ngOnInit(): void {
  this.route.paramMap
    .pipe(
      switchMap((params) => {
        const id = Number(params.get('id'));
        if (!id) {
          this.router.navigate(['/registry-books']);
          return EMPTY;
        }

        return this.documentService.getDocumentById(id).pipe(
          tap((document) => {
            this.document = document;
          }),
          switchMap(() => this.documentService.getBorrowHistoryByDocumentId(id)),
          tap((history) => console.log('history =', history))
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe({
      next: (history) => {
        this.borrowHistory = history;
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
