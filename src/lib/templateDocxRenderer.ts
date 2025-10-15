import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
// Minimal image module interface; users can later swap to pro if needed
// We'll inline a simple replacement for {{QRCode}} using base64 PNG

export interface RenderContext {
  templateArrayBuffer: ArrayBuffer
  data: Record<string, any>
  qrCodeDataUrl?: string // data:image/png;base64,...
}

export function renderDocxTemplate({ templateArrayBuffer, data, qrCodeDataUrl }: RenderContext): Blob {
  console.log('[renderDocxTemplate] Starting template rendering...');
  const zip = new PizZip(templateArrayBuffer)
  
  // Clean up broken placeholders in the document.xml
  const documentXml = zip.file('word/document.xml');
  if (documentXml) {
    let xmlContent = documentXml.asText();
    
    // Fix broken placeholders by removing spell-check formatting
    // Handle the specific pattern we saw: {{</w:t></w:r><w:proofErr...>...fieldName</w:t></w:r><w:proofErr...><w:r>}}
    xmlContent = xmlContent.replace(
      /\{\{<\/w:t><\/w:r><w:proofErr[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>([^<]+)<\/w:t><\/w:r><w:proofErr[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\}\}/g,
      '{{$1}}'
    );
    
    // Handle pattern: {{</w:t></w:r><w:r...>...fieldName</w:t></w:r><w:r...>}}
    xmlContent = xmlContent.replace(
      /\{\{<\/w:t><\/w:r><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>([^<]+)<\/w:t><\/w:r><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\}\}/g,
      '{{$1}}'
    );
    
    // Handle pattern: {{A</w:t></w:r><w:r...>a</w:t></w:r><w:r...>dharNo}}
    xmlContent = xmlContent.replace(
      /\{\{([A-Za-z])<\/w:t><\/w:r><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>([^<]+)<\/w:t><\/w:r><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>([^<]+)<\/w:t><\/w:r><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\}\}/g,
      '{{$1$2$3}}'
    );
    
    // More aggressive cleanup - remove all XML tags between {{ and }}
    xmlContent = xmlContent.replace(
      /\{\{([^}]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>([^<]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\}\}/g,
      '{{$1$2}}'
    );
    
    // Fix placeholders broken by tabs and spaces
    // Pattern: {{Name}}</w:t></w:r><w:tab/><w:r><w:rPr><w:rFonts.../><w:t>{{AadharNo}}
    xmlContent = xmlContent.replace(
      /\{\{([^}]+)\}\}<\/w:t><\/w:r><w:tab\/><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>\{\{([^}]+)\}\}/g,
      '{{$1}} {{$2}}'
    );
    
    // Fix placeholders separated by spaces and other formatting
    xmlContent = xmlContent.replace(
      /\{\{([^}]+)\}\}<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>\{\{([^}]+)\}\}/g,
      '{{$1}} {{$2}}'
    );
    
    // Fix placeholders with whitespace between them
    xmlContent = xmlContent.replace(
      /\{\{([^}]+)\}\}<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\s*\{\{([^}]+)\}\}/g,
      '{{$1}} {{$2}}'
    );
    
    // Clean up any remaining broken placeholders with complex formatting
    xmlContent = xmlContent.replace(
      /\{\{([^<]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>([^<]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\}\}/g,
      '{{$1$2}}'
    );
    
    // Final cleanup: Remove any XML tags that might be breaking placeholders
    // This handles cases where placeholders are split across multiple XML elements
    xmlContent = xmlContent.replace(
      /\{\{([^}]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t>([^}]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\}\}/g,
      '{{$1$2}}'
    );
    
    // Handle placeholders that might be split by tabs, spaces, or other formatting
    xmlContent = xmlContent.replace(
      /\{\{([^}]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>([^}]*?)<\/w:t><\/w:r><w:[^>]*><w:r[^>]*><w:rPr[^>]*><\/w:rPr><w:t[^>]*>\}\}/g,
      '{{$1$2}}'
    );
    
    // Update the document.xml with cleaned content
    zip.file('word/document.xml', xmlContent);
    console.log('[renderDocxTemplate] Cleaned up broken placeholders in document.xml');
  }
  
  // Replace {{QRCode}} with an internal marker so docxtemplater doesn't consume it
  const docXmlPathInitial = 'word/document.xml';
  const xmlFileInitial = zip.file(docXmlPathInitial);
  if (xmlFileInitial) {
    let xml = xmlFileInitial.asText();
    xml = xml.replace(/\{\{\s*QRCode\s*\}\}/g, '[[QR_INLINE_IMG]]');
    zip.file(docXmlPathInitial, xml);
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' }
  })

  // Inject QRCode if a placeholder {{QRCode}} exists
  const enriched = {
    ...data,
    QRCode: qrCodeDataUrl || ''
  }

  console.log('[renderDocxTemplate] Setting data:', Object.keys(enriched));
  console.log('[renderDocxTemplate] Data values:', enriched);
  
  // Check for any unmapped placeholders in the template (after cleanup)
  const templateText = zip.file('word/document.xml').asText();
  const placeholderMatches = templateText.match(/\{\{[^}]+\}\}/g);
  console.log('[renderDocxTemplate] Found placeholders in template (after cleanup):', placeholderMatches);
  
  doc.setData(enriched)
  try {
    console.log('[renderDocxTemplate] Rendering template...');
    doc.render()
    console.log('[renderDocxTemplate] Template rendered successfully');
  } catch (e) {
    console.error('[renderDocxTemplate] Error rendering template:', e);
    console.error('[renderDocxTemplate] Template text preview:', templateText.substring(0, 500));
    throw e
  }
  console.log('[renderDocxTemplate] Generating blob...');
  // If QRCode image data is provided, replace any marker [[QR_INLINE_IMG]] with an inline image
  if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image')) {
    try {
      const zipInternal = doc.getZip();
      // 1) Decode image and add to media
      const base64 = qrCodeDataUrl.split(',')[1];
      const mediaPath = 'word/media/qrcode.png';
      zipInternal.file(mediaPath, base64, { base64: true });

      // 2) Add relationship in document.xml.rels
      const relsPath = 'word/_rels/document.xml.rels';
      const relsFile = zipInternal.file(relsPath);
      if (relsFile) {
        let relsXml = relsFile.asText();
        const newRid = 'rIdQRCodeImage';
        if (!relsXml.includes(newRid)) {
          const relTag = `\n    <Relationship Id="${newRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/qrcode.png"/>`;
          relsXml = relsXml.replace('</Relationships>', `${relTag}\n</Relationships>`);
          zipInternal.file(relsPath, relsXml);
        }

        // 3) Replace marker with drawing XML in document.xml
        const docXmlPath = 'word/document.xml';
        const docXmlFile = zipInternal.file(docXmlPath);
        if (docXmlFile) {
          let docXml = docXmlFile.asText();
          // Basic 60x60mm converted to EMUs (1mm = 36000 EMU). We'll use ~25mm square.
          const cx = 25 * 36000; // width
          const cy = 25 * 36000; // height
          const drawingXml = `
            <w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">
              <wp:extent cx="${cx}" cy="${cy}"/>
              <wp:docPr id="1" name="QRCode"/>
              <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:nvPicPr><pic:cNvPr id="0" name="qrcode.png"/><pic:cNvPicPr/></pic:nvPicPr>
                    <pic:blipFill>
                      <a:blip r:embed="${newRid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                      <a:stretch><a:fillRect/></a:stretch>
                    </pic:blipFill>
                    <pic:spPr>
                      <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
                      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                    </pic:spPr>
                  </pic:pic>
                </a:graphicData>
              </a:graphic>
            </wp:inline></w:drawing></w:r>`;

          // Replace all occurrences of the marker with the drawing
          // 1) Plain marker (not split across runs)
          docXml = docXml.replace(/\[\[QR_INLINE_IMG\]\]/g, drawingXml);
          // 2) Marker split across XML runs/tags (e.g., [[QR</w:t></w:r>..._IMG]])
          const splitMarkerPattern = /\[\[(?:<[^>]+>)*QR(?:<[^>]+>)*_(?:<[^>]+>)*INLINE(?:<[^>]+>)*_(?:<[^>]+>)*IMG(?:<[^>]+>)*\]\]/g;
          docXml = docXml.replace(splitMarkerPattern, drawingXml);
          // 3) Generic robust replacement: [[ ... QR_INLINE_IMG ... ]]
          const genericSplitMarker = /\[\[(?:<[^>]+>)*QR_INLINE_IMG(?:<[^>]+>)*\]\]/g;
          docXml = docXml.replace(genericSplitMarker, drawingXml);

          // 4) Paragraph-level fallback: replace any paragraph containing QR_INLINE_IMG (even if split arbitrarily)
          let qrMarkerStillPresent = false;
          if (docXml.includes('QR_INLINE_IMG')) {
            const paraFallback = new RegExp(
              '<w:p[^>]*>[^<]*[\\s\S]*?QR[_ ]?INLINE[_ ]?IMG[\\s\S]*?<\\/w:p>',
              'g'
            );
            const wrappedDrawing = `<w:p><w:r>${drawingXml}</w:r></w:p>`;
            docXml = docXml.replace(paraFallback, wrappedDrawing);
            qrMarkerStillPresent = docXml.includes('QR_INLINE_IMG');
          }

          // Log whether replacement succeeded
          if (docXml.includes('QR_INLINE_IMG') || docXml.includes('[[QR_INLINE_IMG]]')) {
            console.warn('[renderDocxTemplate] QR marker still present after replacements');
            qrMarkerStillPresent = true;
          } else {
            console.log('[renderDocxTemplate] QR image injected successfully');
          }

          // FINAL FALLBACK: If we still couldn't find/replace the marker,
          // anchor the QR image at bottom-left of the page regardless of placeholders.
          if (qrMarkerStillPresent) {
            console.warn('[renderDocxTemplate] Falling back to anchored QR at bottom-left');
            const anchorXml = `
              <w:p>
                <w:r>
                  <w:drawing>
                    <wp:anchor xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" simplePos="0" relativeHeight="0" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
                      <wp:simplePos x="0" y="0"/>
                      <wp:positionH relativeFrom="page"><wp:align>left</wp:align></wp:positionH>
                      <wp:positionV relativeFrom="page"><wp:align>bottom</wp:align></wp:positionV>
                      <wp:extent cx="${cx}" cy="${cy}"/>
                      <wp:effectExtent l="0" t="0" r="0" b="0"/>
                      <wp:wrapNone/>
                      <wp:docPr id="2" name="QRCodeAnchored"/>
                      <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                          <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                            <pic:nvPicPr><pic:cNvPr id="1" name="qrcode.png"/><pic:cNvPicPr/></pic:nvPicPr>
                            <pic:blipFill>
                              <a:blip r:embed="${newRid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                              <a:stretch><a:fillRect/></a:stretch>
                            </pic:blipFill>
                            <pic:spPr>
                              <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
                              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                            </pic:spPr>
                          </pic:pic>
                        </a:graphicData>
                      </a:graphic>
                    </wp:anchor>
                  </w:drawing>
                </w:r>
              </w:p>`;

            // Insert before the closing body tag
            docXml = docXml.replace('</w:body>', `${anchorXml}</w:body>`);
          }
          zipInternal.file(docXmlPath, docXml);
        }
      }
    } catch (err) {
      console.warn('[renderDocxTemplate] Failed to inject QRCode image, leaving text placeholder:', err);
    }
  }

  const out = doc.getZip().generate({ type: 'blob' })
  console.log('[renderDocxTemplate] Blob generated, size:', out.size);
  return out as Blob
}


