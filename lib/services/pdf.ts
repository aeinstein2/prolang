/**
 * PDF Generation Service
 * Uses pdf-lib for generating certified translation documents
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib'

export interface CertificateMetadata {
  jobId: string
  jobTitle: string
  sourceLanguage: string
  targetLanguage: string
  translatorName: string
  reviewerName?: string
  certificationType: 'certified' | 'notarized' | 'apostille'
  completedAt: string
  certificationNumber: string
  stampText?: string
}

export interface TranslatedDocumentOptions {
  title: string
  sourceText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  pageHeader?: string
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)

    if (width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function addPageBorder(page: PDFPage) {
  const { width, height } = page.getSize()
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.12, 0.18, 0.27),
    borderWidth: 2,
  })
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: rgb(0.12, 0.18, 0.27),
    borderWidth: 0.5,
  })
}

/**
 * Generate a translated document PDF with source and translation side by side
 */
export async function generateTranslatedDocumentPDF(
  options: TranslatedDocumentOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const page = pdfDoc.addPage([842, 595]) // A4 Landscape
  const { width, height } = page.getSize()
  addPageBorder(page)

  // Header
  page.drawText('ProLang Translation Services', {
    x: 40,
    y: height - 50,
    size: 14,
    font: timesBold,
    color: rgb(0.12, 0.18, 0.27),
  })

  page.drawText(options.title, {
    x: 40,
    y: height - 70,
    size: 10,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  })

  // Divider
  page.drawLine({
    start: { x: 40, y: height - 80 },
    end: { x: width - 40, y: height - 80 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Column headers
  const midX = width / 2
  page.drawText(`Source: ${options.sourceLanguage.toUpperCase()}`, {
    x: 40,
    y: height - 100,
    size: 10,
    font: timesBold,
    color: rgb(0.12, 0.18, 0.27),
  })

  page.drawText(`Translation: ${options.targetLanguage.toUpperCase()}`, {
    x: midX + 10,
    y: height - 100,
    size: 10,
    font: timesBold,
    color: rgb(0.12, 0.18, 0.27),
  })

  // Vertical divider
  page.drawLine({
    start: { x: midX, y: height - 85 },
    end: { x: midX, y: 40 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Source text
  const sourceLines = wrapText(options.sourceText, midX - 60, timesRoman, 9)
  let yPos = height - 120
  for (const line of sourceLines) {
    if (yPos < 50) break
    page.drawText(line, {
      x: 40,
      y: yPos,
      size: 9,
      font: timesRoman,
      color: rgb(0.2, 0.2, 0.2),
    })
    yPos -= 14
  }

  // Translated text
  const translatedLines = wrapText(options.translatedText, midX - 60, timesRoman, 9)
  yPos = height - 120
  for (const line of translatedLines) {
    if (yPos < 50) break
    page.drawText(line, {
      x: midX + 10,
      y: yPos,
      size: 9,
      font: timesRoman,
      color: rgb(0.2, 0.2, 0.2),
    })
    yPos -= 14
  }

  return pdfDoc.save()
}

/**
 * Generate a Certificate of Accuracy page
 */
export async function generateCertificatePDF(
  metadata: CertificateMetadata
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const page = pdfDoc.addPage([595, 842]) // A4 Portrait
  const { width, height } = page.getSize()
  addPageBorder(page)

  const navy = rgb(0.07, 0.11, 0.22)
  const gray = rgb(0.4, 0.4, 0.4)
  const gold = rgb(0.6, 0.5, 0.1)

  // Decorative top bar
  page.drawRectangle({
    x: 20,
    y: height - 60,
    width: width - 40,
    height: 40,
    color: navy,
  })

  // Logo text
  page.drawText('PROLANG', {
    x: 40,
    y: height - 47,
    size: 18,
    font: timesBold,
    color: rgb(1, 1, 1),
  })

  page.drawText('TRANSLATION SERVICES', {
    x: 40,
    y: height - 60,
    size: 8,
    font: helvetica,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Certificate title
  page.drawText('CERTIFICATE OF ACCURACY', {
    x: width / 2 - 140,
    y: height - 110,
    size: 22,
    font: timesBold,
    color: navy,
  })

  const certTypeLabel = {
    certified: 'Certified Translation',
    notarized: 'Notarized Translation',
    apostille: 'Apostille Certified Translation',
  }[metadata.certificationType]

  page.drawText(certTypeLabel, {
    x: width / 2 - 80,
    y: height - 135,
    size: 12,
    font: timesItalic,
    color: gold,
  })

  // Decorative line
  page.drawLine({
    start: { x: 60, y: height - 150 },
    end: { x: width - 60, y: height - 150 },
    thickness: 2,
    color: gold,
  })

  // Certificate body
  const bodyText = `This is to certify that the attached document, "${metadata.jobTitle}", ` +
    `has been translated from ${metadata.sourceLanguage} to ${metadata.targetLanguage} ` +
    `by a qualified professional translator. The translation is, to the best of our knowledge ` +
    `and ability, a true and accurate translation of the original document.`

  const bodyLines = wrapText(bodyText, width - 120, timesRoman, 11)
  let yPos = height - 180
  for (const line of bodyLines) {
    page.drawText(line, {
      x: 60,
      y: yPos,
      size: 11,
      font: timesRoman,
      color: rgb(0.15, 0.15, 0.15),
    })
    yPos -= 18
  }

  yPos -= 20

  // Details grid
  const details = [
    ['Document Title:', metadata.jobTitle],
    ['Source Language:', metadata.sourceLanguage],
    ['Target Language:', metadata.targetLanguage],
    ['Certification Number:', metadata.certificationNumber],
    ['Date Completed:', new Date(metadata.completedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })],
    ['Translator:', metadata.translatorName],
    ...(metadata.reviewerName ? [['Reviewer:', metadata.reviewerName]] : []),
    ['Certification Type:', certTypeLabel],
  ]

  for (const [label, value] of details) {
    page.drawText(label, {
      x: 60,
      y: yPos,
      size: 10,
      font: timesBold,
      color: navy,
    })
    page.drawText(value, {
      x: 220,
      y: yPos,
      size: 10,
      font: timesRoman,
      color: rgb(0.2, 0.2, 0.2),
    })
    yPos -= 18
  }

  yPos -= 30

  // Signature block
  page.drawLine({
    start: { x: 60, y: height - 150 },
    end: { x: width - 60, y: height - 150 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  })

  // Signature lines
  page.drawText('Translator Signature:', {
    x: 60,
    y: yPos,
    size: 10,
    font: timesBold,
    color: navy,
  })

  page.drawLine({
    start: { x: 60, y: yPos - 30 },
    end: { x: 240, y: yPos - 30 },
    thickness: 1,
    color: navy,
  })

  page.drawText(metadata.translatorName, {
    x: 60,
    y: yPos - 45,
    size: 9,
    font: timesRoman,
    color: gray,
  })

  if (metadata.reviewerName) {
    page.drawText('Reviewer Signature:', {
      x: 320,
      y: yPos,
      size: 10,
      font: timesBold,
      color: navy,
    })

    page.drawLine({
      start: { x: 320, y: yPos - 30 },
      end: { x: 520, y: yPos - 30 },
      thickness: 1,
      color: navy,
    })

    page.drawText(metadata.reviewerName, {
      x: 320,
      y: yPos - 45,
      size: 9,
      font: timesRoman,
      color: gray,
    })
  }

  yPos -= 80

  // Stamp block
  page.drawRectangle({
    x: width / 2 - 80,
    y: yPos - 70,
    width: 160,
    height: 70,
    borderColor: navy,
    borderWidth: 2,
  })

  page.drawText(metadata.stampText || 'OFFICIAL TRANSLATION', {
    x: width / 2 - 65,
    y: yPos - 30,
    size: 9,
    font: timesBold,
    color: navy,
  })

  page.drawText('ProLang Translation Services', {
    x: width / 2 - 70,
    y: yPos - 45,
    size: 7,
    font: helvetica,
    color: gray,
  })

  page.drawText('prolang.mbg.mn', {
    x: width / 2 - 40,
    y: yPos - 58,
    size: 7,
    font: helvetica,
    color: gray,
  })

  // Footer
  page.drawLine({
    start: { x: 20, y: 55 },
    end: { x: width - 20, y: 55 },
    thickness: 1,
    color: gold,
  })

  page.drawText(`ProLang Translation Services  |  prolang.mbg.mn  |  Cert. No: ${metadata.certificationNumber}`, {
    x: 60,
    y: 38,
    size: 8,
    font: helvetica,
    color: gray,
  })

  return pdfDoc.save()
}

/**
 * Bundle translation and certificate into a single PDF package
 */
export async function generateDeliveryPackagePDF(
  translationOptions: TranslatedDocumentOptions,
  certificateMetadata: CertificateMetadata
): Promise<Uint8Array> {
  const translationPdf = await PDFDocument.load(
    await generateTranslatedDocumentPDF(translationOptions)
  )
  const certificatePdf = await PDFDocument.load(
    await generateCertificatePDF(certificateMetadata)
  )

  const mergedPdf = await PDFDocument.create()

  // Add translation pages first
  const translationPages = await mergedPdf.copyPages(translationPdf, translationPdf.getPageIndices())
  for (const page of translationPages) {
    mergedPdf.addPage(page)
  }

  // Add certificate page
  const certPages = await mergedPdf.copyPages(certificatePdf, certificatePdf.getPageIndices())
  for (const page of certPages) {
    mergedPdf.addPage(page)
  }

  return mergedPdf.save()
}
