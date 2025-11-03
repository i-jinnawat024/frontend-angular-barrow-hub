import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ElementRef, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.scss'
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @Output() scanSuccess = new EventEmitter<string>();
  @Output() scanError = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  isScanning = input<boolean>(false);
  private html5QrCode: Html5Qrcode | null = null;
  protected scannerId = 'qr-scanner-' + Date.now();

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

  ngOnInit(): void {
    // Start scanning if already set to true
    if (this.isScanning()) {
      setTimeout(() => this.startScanning(), 100);
    }
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  async startScanning(): Promise<void> {
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
        (decodedText) => {
          // Success callback
          this.scanSuccess.emit(decodedText);
          this.stopScanning();
        },
        (errorMessage) => {
          // Error callback - ignore for continuous scanning
        }
      );
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      this.scanError.emit(error.message || 'ไม่สามารถเปิดกล้องได้');
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
    }
  }

  onClose(): void {
    this.stopScanning();
    this.close.emit();
  }
}

