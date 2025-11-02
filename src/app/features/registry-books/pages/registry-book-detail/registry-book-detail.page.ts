import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBook } from '../../../../shared/models/registry-book.model';
import { QrBarcodeService } from '../../../../shared/services/qr-barcode.service';

@Component({
  selector: 'app-registry-book-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registry-book-detail.page.html',
  styleUrl: './registry-book-detail.page.scss'
})
export class RegistryBookDetailPage implements OnInit, AfterViewInit, OnDestroy {
  registryBook: RegistryBook | undefined;
  qrCodeDataUrl: string | null = null;
  @ViewChild('barcodeContainer', { static: false }) barcodeContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private registryBookService: RegistryBookService,
    private router: Router,
    private route: ActivatedRoute,
    private qrBarcodeService: QrBarcodeService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.registryBook = this.registryBookService.getRegistryBookById(id);
        if (!this.registryBook) {
          this.router.navigate(['/registry-books']);
        } else {
          this.generateQrCode();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Generate barcode after view is ready
    if (this.registryBook) {
      setTimeout(() => this.generateBarcode(), 200);
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  async generateQrCode(): Promise<void> {
    if (this.registryBook) {
      try {
        this.qrCodeDataUrl = await this.qrBarcodeService.generateQRCode(this.registryBook.id);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
  }

  generateBarcode(): void {
    if (this.registryBook) {
      try {
        const barcodeId = 'barcode-' + this.registryBook.id;
        this.qrBarcodeService.generateBarcode(this.registryBook.bookNumber, barcodeId);
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }

  editRegistryBook(): void {
    if (this.registryBook) {
      this.router.navigate(['/registry-books', this.registryBook.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/registry-books']);
  }

  printQrCode(): void {
    if (!this.registryBook || !this.qrCodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${this.registryBook.bookNumber}</title>
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
            .qr-container {
              text-align: center;
            }
            .qr-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .qr-book-number {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .qr-info {
              font-size: 12px;
              color: #999;
              margin-top: 20px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">QR Code - เล่มทะเบียน</div>
            <div class="qr-book-number">${this.registryBook.bookNumber}</div>
            <div class="qr-code">
              <img src="${this.qrCodeDataUrl}" alt="QR Code" style="width: 256px; height: 256px;" />
            </div>
            <div class="qr-info">${this.registryBook.title}</div>
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
    if (!this.registryBook) return;
    
    const barcodeElement = document.getElementById('barcode-' + this.registryBook.id);
    if (!barcodeElement) return;

    const svgContent = barcodeElement.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${this.registryBook.bookNumber}</title>
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
            .barcode-container {
              text-align: center;
            }
            .barcode-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .barcode-book-number {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .barcode-code {
              margin: 20px 0;
            }
            .barcode-info {
              font-size: 12px;
              color: #999;
              margin-top: 20px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="barcode-title">Barcode - เล่มทะเบียน</div>
            <div class="barcode-book-number">${this.registryBook.bookNumber}</div>
            <div class="barcode-code">
              <svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>
            </div>
            <div class="barcode-info">${this.registryBook.title}</div>
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

