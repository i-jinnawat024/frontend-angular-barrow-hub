import { AfterViewInit, Component, OnDestroy, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../../../shared/models/registry-book.model';
import { QrBarcodeService } from '../../../../shared/services/qr-barcode.service';
import { MatIcon } from "@angular/material/icon";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './document-detail.page.html',
  styleUrl: './document-detail.page.scss',
})
export class DocumentDetailPage implements OnInit, AfterViewInit, OnDestroy {
  document: Document | undefined;
  qrCodeDataUrl: string | null = null;
  private readonly destroyRef = inject(DestroyRef);
  private hasViewInitialized = false;
  private id: number | null = null;
  
  constructor(
    private readonly documentService: DocumentService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly qrBarcodeService: QrBarcodeService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.id = Number(id);
          if (!id) {
            this.router.navigate(['/registry-books']);
            return EMPTY;
          }
          return this.documentService.getDocumentById(this.id);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (book) => this.handleRegistryBook(book),
        error: () => this.router.navigate(['/registry-books']),
      });
  }

  ngAfterViewInit(): void {
    this.hasViewInitialized = true;
    this.tryGenerateBarcode();
  }

  ngOnDestroy(): void {
    // reserved for subscriptions or listeners
  }

  private handleRegistryBook(book: Document): void {
    this.document = book;
    this.generateQrCode();
    this.tryGenerateBarcode();
  }

  async generateQrCode(): Promise<void> {
    if (!this.document) {
      return;
    }

    try {
      this.qrCodeDataUrl = await this.qrBarcodeService.generateQRCode(
        this.document.id,
      );
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  generateBarcode(): void {
    if (!this.document) {
      return;
    }

    try {
      const barcodeId = `barcode-${this.document.documentId}`;
      this.qrBarcodeService.generateBarcode(
        this.document.documentId,
        barcodeId,
      );
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  }

  private tryGenerateBarcode(): void {
    if (!this.hasViewInitialized || !this.document) {
      return;
    }

    setTimeout(() => this.generateBarcode(), 200);
  }

  editDocument(): void {
    if (this.document) {
      this.router.navigate(['/registry-books', this.document.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/registry-books']);
  }

  viewBorrowHistory(): void {
    if (this.document) {
      this.router.navigate([
        '/registry-books',
        this.document.id,
        'history',
      ]);
    }
  }

  printQrCode(): void {
    if (!this.document || !this.qrCodeDataUrl) {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>QR Code - ${this.document.documentId}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .qr-container { text-align: center; }
            .qr-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .qr-book-number { font-size: 14px; color: #666; margin-bottom: 20px; }
            .qr-code { margin: 20px 0; }
            .qr-info { font-size: 12px; color: #999; margin-top: 20px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">QR Code - เล่มทะเบียน</div>
            <div class="qr-book-number">${this.document.documentId}</div>
            <div class="qr-code">
              <img src="${this.qrCodeDataUrl}" alt="QR Code" style="width: 256px; height: 256px;" />
            </div>
            <div class="qr-info">${this.document.firstName} ${this.document.lastName}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  printBarcode(): void {
    if (!this.document) {
      return;
    }

    const barcodeElement = document.getElementById(
      `barcode-${this.document.id}`,
    );
    if (!barcodeElement) {
      return;
    }

    const svgContent = barcodeElement.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Barcode - ${this.document.documentId}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .barcode-container { text-align: center; }
            .barcode-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .barcode-book-number { font-size: 14px; color: #666; margin-bottom: 20px; }
            .barcode-code { margin: 20px 0; }
            .barcode-info { font-size: 12px; color: #999; margin-top: 20px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="barcode-title">Barcode - เล่มทะเบียน</div>
            <div class="barcode-book-number">${this.document.documentId}</div>
            <div class="barcode-code">
              <svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>
            </div>
            <div class="barcode-info">${this.document.firstName} ${this.document.lastName}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

}
