import { Injectable } from '@angular/core';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

@Injectable({
  providedIn: 'root'
})
export class QrBarcodeService {
  /**
   * Generate QR Code data URL from book ID
   */
  async generateQRCode(bookId: string) {
    try {
      // Use book ID as the QR code data
      return await QRCode.toDataURL(bookId, {
        errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Generate Barcode SVG string from book number
   */
  generateBarcode(bookNumber: string, elementId: string): void {
    try {
      // Get the target element
      const targetElement = document.getElementById(elementId);
      if (!targetElement) {
        console.error(`Element with id ${elementId} not found`);
        return;
      }

      // Clear previous barcode
      targetElement.innerHTML = '';

      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'barcode-' + elementId);
      
      // Generate barcode using JsBarcode
      JsBarcode(svg, bookNumber, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });

      // Append to target element
      targetElement.appendChild(svg);
    } catch (error) {
      console.error('Error generating barcode:', error);
      throw error;
    }
  }

  /**
   * Decode QR code from image URL or data URL
   */
  async decodeQRCode(imageData: string): Promise<string | null> {
    // For now, we'll use html5-qrcode for scanning
    // This method will be used when scanning from file
    return null;
  }
}

