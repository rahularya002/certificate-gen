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
import JSZip from 'jszip';

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
      
      // For now, return the DOCX blob (PDF conversion will be done separately)
      console.log('[CertificateGenerator] Returning DOCX blob');
      return docxBlob;
      
    } catch (error) {
      console.error('[CertificateGenerator] Error using template:', error);
      throw new Error(`Template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async convertToPDF(blob: Blob, filename: string): Promise<Blob> {
    try {
      console.log('[CertificateGenerator] Converting to PDF...');
      const pdfBlob = await this.convertDocxToPdf(blob);
      console.log('[CertificateGenerator] PDF conversion completed');
      return pdfBlob;
    } catch (pdfError) {
      console.error('[CertificateGenerator] PDF conversion failed:', pdfError);
      throw new Error('Failed to convert certificate to PDF. Please try downloading the DOCX version.');
    }
  }

  static async convertDocxToPdf(docxBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          console.log('[convertDocxToPdf] Converting DOCX to HTML...');
          
          // Convert DOCX to HTML using mammoth - use minimal options to avoid issues
          let result;
          try {
            result = await mammoth.convertToHtml({ arrayBuffer }, {
              ignoreEmptyParagraphs: true,
            });
          } catch (mammothError: any) {
            console.error('[convertDocxToPdf] Mammoth conversion error:', mammothError);
            // If mammoth fails, it means the DOCX has unsupported features
            throw new Error('unsupported_features');
          }
          
          let html = result.value;
          
          // Add basic styling
          html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { 
                  font-family: 'Arial', 'Times New Roman', sans-serif;
                  margin: 20mm;
                  padding: 0;
                  color: #000;
                }
                h1, h2, h3, h4, h5, h6 {
                  margin: 10px 0 5px 0;
                  font-weight: bold;
                }
                p {
                  margin: 5px 0;
                }
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 10px 0;
                }
                td, th {
                  border: 1px solid #ddd;
                  padding: 8px;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              ${html}
            </body>
            </html>
          `;
          
          // Create a temporary div to render the HTML
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.width = '210mm';
          tempDiv.style.backgroundColor = 'white';
          tempDiv.innerHTML = html;
          document.body.appendChild(tempDiv);
          
          // Wait for images to load
          const images = tempDiv.getElementsByTagName('img');
          if (images.length > 0) {
            const imagePromises = Array.from(images).map(img => {
              return new Promise<void>((imgResolve) => {
                if (img.complete) {
                  imgResolve();
                } else {
                  img.onload = () => imgResolve();
                  img.onerror = () => imgResolve();
                }
              });
            });
            await Promise.all(imagePromises);
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
          console.log('[convertDocxToPdf] Converting HTML to PDF...');
          
          // Convert HTML to canvas to PDF
          const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 210 * 3.779527559,
          });
          
          document.body.removeChild(tempDiv);
          
          // Convert canvas to PDF
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft > 0) {
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, -heightLeft, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          const pdfBlob = pdf.output('blob');
          console.log('[convertDocxToPdf] PDF conversion completed');
          resolve(pdfBlob);
        } catch (error) {
          console.error('[convertDocxToPdf] Error:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('[convertDocxToPdf] FileReader error:', error);
        reject(error);
      };
      
      reader.readAsArrayBuffer(docxBlob);
    });
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
