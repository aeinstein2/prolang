/**
 * OCR Service Interface
 * Mock implementation — replace with real OCR service (Tesseract.js, AWS Textract, Google Vision, etc.)
 */

import type { OCRResult } from '@/types'

export interface OCRService {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult>
  isSupported(mimeType: string): boolean
}

const SUPPORTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
]

// Sample texts for mock OCR
const MOCK_SOURCE_TEXTS = [
  `CERTIFICATE OF INCORPORATION

This is to certify that MONGOLIAN BUSINESS GROUP LLC
has been duly incorporated under the laws of Mongolia
on the 15th day of March, 2023.

Company Registration Number: 7654321
Business Type: Limited Liability Company
Registered Capital: MNT 1,000,000

Director: Bat-Erdene Gantulga
Registered Address: Ulaanbaatar, Sukhbaatar District

Signed and sealed this day by the authority of
the Registration Office of Mongolia.

[OFFICIAL SEAL]
Registration Officer: ___________________`,

  `POWER OF ATTORNEY

I, Enkhjargal Dorj, residing at Peace Avenue 12-34, Ulaanbaatar, Mongolia,
hereby authorize and appoint Solongo Bat as my lawful attorney to act on
my behalf in all matters relating to the purchase, sale, and management
of real property located at Khan-Uul District, Ulaanbaatar.

This Power of Attorney shall remain in effect until revoked in writing.

Date: April 10, 2024
Signature: ___________________

Witness: ___________________
Notarized by: ___________________`,

  `BIRTH CERTIFICATE

Full Name: Tsendsuren Munkhbat
Date of Birth: July 22, 1995
Place of Birth: Darkhan-Uul Aimag, Mongolia
Father's Name: Munkhbat Gantulga
Mother's Name: Oyuntsetseg Dorj

Registration Number: UB-1995-07-22-4521
Issued by: State Registry Office
Date of Issue: July 25, 1995

[OFFICIAL SEAL]`,
]

const LOW_CONFIDENCE_SAMPLES = [
  { text: '[OFFICIAL SEAL]', confidence: 0.45 },
  { text: 'Signature: ___________________', confidence: 0.52 },
  { text: 'Registration Number: UB-1995-07-22-4521', confidence: 0.78 },
]

/**
 * Mock OCR service implementation
 * Simulates text extraction with confidence scores
 */
export const mockOCRService: OCRService = {
  isSupported(mimeType: string): boolean {
    return SUPPORTED_TYPES.includes(mimeType.toLowerCase())
  },

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    if (!this.isSupported(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Pick random mock text
    const text = MOCK_SOURCE_TEXTS[Math.floor(Math.random() * MOCK_SOURCE_TEXTS.length)]

    // Simulate confidence score (0.75 - 0.98)
    const overallConfidence = 0.75 + Math.random() * 0.23

    // Generate low confidence areas
    const numLowConfidence = Math.floor(Math.random() * 3)
    const lowConfidenceAreas = LOW_CONFIDENCE_SAMPLES
      .slice(0, numLowConfidence)
      .map(area => ({
        ...area,
        position: {
          x: Math.floor(Math.random() * 400),
          y: Math.floor(Math.random() * 600),
          width: 200 + Math.floor(Math.random() * 200),
          height: 20 + Math.floor(Math.random() * 20),
        },
      }))

    return {
      text,
      confidence: parseFloat(overallConfidence.toFixed(4)),
      lowConfidenceAreas,
    }
  },
}

/**
 * Factory function — swap this to use real OCR service
 * Example: return new TesseractOCRService() or new AWSTextractService()
 */
export function getOCRService(): OCRService {
  // Check for environment variable to select real implementation
  const ocrProvider = process.env.OCR_PROVIDER || 'mock'

  switch (ocrProvider) {
    case 'mock':
    default:
      return mockOCRService
    // Future: case 'tesseract': return new TesseractOCRService()
    // Future: case 'aws': return new AWSTextractService()
    // Future: case 'google': return new GoogleVisionService()
  }
}

export async function runOCR(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
  const service = getOCRService()
  return service.extractText(fileBuffer, mimeType)
}
