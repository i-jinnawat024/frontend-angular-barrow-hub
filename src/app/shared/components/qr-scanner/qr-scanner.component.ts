import { Component, EventEmitter, OnDestroy, Output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.scss'
})
export class QrScannerComponent implements OnDestroy {
  @Output() scanSuccess = new EventEmitter<string>();
  @Output() scanError = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  isScanning = input<boolean>(false);
  continuousMode = input<boolean>(true);
  scanCooldownMs = input<number>(1500);

  private html5QrCode: Html5Qrcode | null = null;
  protected scannerId = 'qr-scanner-' + Date.now();
  private lastScannedText: string | null = null;
  private lastScannedTime = 0;
  private startInProgress = false;

  constructor() {
    effect(() => {
      if (this.isScanning()) {
        // Wait for view to be ready
        setTimeout(() => this.startScanning(), 100);
      } else {
        this.stopScanning();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  async startScanning(): Promise<void> {
    if (this.startInProgress) {
      return;
    }

    this.startInProgress = true;
    try {
      // Stop any existing scanner first
      await this.stopScanning();

      this.html5QrCode = new Html5Qrcode(this.scannerId);

      await this.html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => this.handleScanSuccess(decodedText),
        () => {
          // Error callback - ignore for continuous scanning
        }
      );
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      this.scanError.emit(error.message || 'ไม่สามารถเปิดกล้องได้');
    } finally {
      this.startInProgress = false;
    }
  }

  async stopScanning(): Promise<void> {
    if (this.html5QrCode) {
      try {
        const state = this.html5QrCode.getState();
        if (state !== 0) { // NOT_STARTED = 0
          await this.html5QrCode.stop();
          await this.html5QrCode.clear();
        }
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      this.html5QrCode = null;
      this.resetScanHistory();
    }
  }

  private handleScanSuccess(decodedText: string): void {
    const now = Date.now();
    if (this.lastScannedText === decodedText && now - this.lastScannedTime < this.scanCooldownMs()) {
      return;
    }

    this.lastScannedText = decodedText;
    this.lastScannedTime = now;
    this.scanSuccess.emit(decodedText);

    if (!this.continuousMode()) {
      this.stopScanning();
    }
  }

  private resetScanHistory(): void {
    this.lastScannedText = null;
    this.lastScannedTime = 0;
  }

  onClose(): void {
    this.stopScanning();
    this.close.emit();
  }
}

