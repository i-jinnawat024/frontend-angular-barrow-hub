import { Component, EventEmitter, OnDestroy, Output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat, Result } from '@zxing/library';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
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

  allowedFormats = [BarcodeFormat.QR_CODE];
  private lastScannedText: string | null = null;
  private lastScannedTime = 0;
  hasPermission = false;
  hasDevices = false;
  currentDevice: MediaDeviceInfo | undefined = undefined;
  availableDevices: MediaDeviceInfo[] = [];

  constructor() {
    effect(() => {
      if (this.isScanning()) {
        this.checkPermissions();
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup handled by ZXing scanner component
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = devices && devices.length > 0;

    // Prefer back camera (environment facing)
    const backCamera = devices.find(device => 
      device.label.toLowerCase().includes('back') || 
      device.label.toLowerCase().includes('rear') ||
      device.label.toLowerCase().includes('environment')
    );

    if (backCamera) {
      this.currentDevice = backCamera;
    } else if (devices.length > 0) {
      this.currentDevice = devices[0];
    }
  }

  onHasPermission(has: boolean | Event): void {
    // Handle different event types from ZXing scanner
    let hasPermission = false;
    if (typeof has === 'boolean') {
      hasPermission = has;
    } else if (has instanceof Event) {
      // If it's an Event object, extract the value
      const target = has.target as any;
      hasPermission = target?.hasPermission ?? target?.value ?? false;
    }
    
    this.hasPermission = hasPermission;
    if (!hasPermission) {
      this.scanError.emit('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง');
    }
  }

  onScanSuccess(result: string | Result): void {
    // Extract text from Result object if needed, otherwise use string directly
    const decodedText = typeof result === 'string' ? result : result.getText();
    
    const now = Date.now();
    if (this.lastScannedText === decodedText && now - this.lastScannedTime < this.scanCooldownMs()) {
      return;
    }

    this.lastScannedText = decodedText;
    this.lastScannedTime = now;
    this.scanSuccess.emit(decodedText);

    if (!this.continuousMode()) {
      // In non-continuous mode, close scanner after successful scan
      this.onClose();
    }
  }

  onScanError(error: any): void {
    // Ignore scan errors for continuous scanning, only emit critical errors
    if (error && error.message && !error.message.includes('No QR code')) {
      console.error('Scan error:', error);
    }
  }

  onDeviceChange(device: MediaDeviceInfo): void {
    this.currentDevice = device;
  }

  private checkPermissions(): void {
    // Permissions are checked by ZXing scanner component
  }

  onClose(): void {
    this.close.emit();
  }
}


