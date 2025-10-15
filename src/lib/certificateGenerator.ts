import React from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } from 'docx';
import { renderDocxTemplate } from '@/lib/templateDocxRenderer';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';
import mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';
import ReactPdfCertificate from '@/lib/reactPdfRenderer';

export interface CertificateData {
  participantName: string;
  certificateNo: string;
  issueDate: string;
  aadhar?: string;
  dob?: string;
  sonOrDaughterOf?: string;
  jobRole?: string;
  duration?: string;
  trainingCenter?: string;
  district?: string;
  state?: string;
  assessmentPartner?: string;
  enrollmentNo?: string;
  issuePlace?: string;
  grade?: string;
  qrCodeData?: string;
}

export class CertificateGenerator {
  static async generateQRCodeAsBase64(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  static async generatePDF(data: CertificateData, filename: string): Promise<Blob> {
    throw new Error('Hardcoded PDF generation is disabled. Use template-based generation only.');
  }

  static async generatePDFFromTemplate(templateArrayBuffer: ArrayBuffer, mappedData: Record<string, any>, qrDataUrl?: string): Promise<Blob> {
    try {
      console.log('[CertificateGenerator] Using your DOCX template for PDF generation...');
      
      // First, render the DOCX template with data
      console.log('[CertificateGenerator] Rendering DOCX template with data...');
      const docxBlob = renderDocxTemplate({ templateArrayBuffer, data: mappedData, qrCodeDataUrl: qrDataUrl });
      console.log('[CertificateGenerator] DOCX template rendered, blob size:', docxBlob.size);
      
      // For now, return the DOCX blob as PDF (browser will handle it)
      // TODO: Implement proper DOCX→PDF conversion that preserves formatting
      console.log('[CertificateGenerator] Returning DOCX as PDF (formatting preserved)');
      return docxBlob;
      
    } catch (error) {
      console.error('[CertificateGenerator] Error using template:', error);
      throw new Error(`Template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateDOCX(data: CertificateData, filename: string): Promise<Blob> {
    // Keep a minimal fallback DOCX for direct downloads when a template isn't provided
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: 'CERTIFICATE', bold: true, size: 32 }) ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: 'This is to certify that', size: 22 }) ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: data.participantName, bold: true, size: 28 }) ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: `Certificate No: ${data.certificateNo}`, size: 18 }) ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: `Date: ${data.issueDate}`, size: 18 }) ] })
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    return blob as Blob;
  }

  static async generateDOCXFromTemplate(templateArrayBuffer: ArrayBuffer, mappedData: Record<string, any>, qrDataUrl?: string): Promise<Blob> {
    const blob = renderDocxTemplate({ templateArrayBuffer, data: mappedData, qrCodeDataUrl: qrDataUrl });
    return blob;
  }

  static async downloadCertificate(data: CertificateData, filename: string, format: 'pdf' | 'docx'): Promise<void> {
    try {
      let blob: Blob;
      
      if (format === 'pdf') {
        throw new Error('PDF generation requires a template. Use generatePDFFromTemplate instead.');
      } else {
        blob = await this.generateDOCX(data, filename);
      }

      // Download the file
      saveAs(blob, filename);
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw new Error('Failed to generate certificate');
    }
  }

  static async downloadAllCertificates(certificates: CertificateData[], format: 'pdf' | 'docx'): Promise<void> {
    try {
      // For now, download certificates one by one
      // In a real implementation, you might want to create a ZIP file
      for (const cert of certificates) {
        const filename = `${cert.certificateNo}_${cert.participantName}.${format}`;
        await this.downloadCertificate(cert, filename, format);
        
        // Small delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error downloading certificates:', error);
      throw new Error('Failed to download certificates');
    }
  }
}
