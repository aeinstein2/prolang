import { describe, it, expect } from 'vitest'
import { mockOCRService, runOCR } from '../lib/services/ocr'
import { mockTranslationService, translateDocument } from '../lib/services/translation'
import { generateCertificatePDF, generateTranslatedDocumentPDF } from '../lib/services/pdf'
import {
  canTransitionTo,
  getNextStatus,
  getPreviousStatus,
  getStatusProgress,
  isTerminalStatus,
  STATUS_ORDER,
  JOB_STATUS_CONFIG,
} from '../lib/utils/status'
import type { JobStatus } from '../types'

// ─── OCR Service Tests ────────────────────────────────────────────────────────

describe('OCR Service', () => {
  it('should report supported MIME types', () => {
    expect(mockOCRService.isSupported('application/pdf')).toBe(true)
    expect(mockOCRService.isSupported('image/jpeg')).toBe(true)
    expect(mockOCRService.isSupported('image/png')).toBe(true)
    expect(mockOCRService.isSupported('image/tiff')).toBe(true)
    expect(mockOCRService.isSupported('text/plain')).toBe(false)
    expect(mockOCRService.isSupported('video/mp4')).toBe(false)
  })

  it('should throw for unsupported MIME types', async () => {
    const buffer = Buffer.from('test')
    await expect(mockOCRService.extractText(buffer, 'text/plain')).rejects.toThrow(
      'Unsupported file type'
    )
  })

  it('should extract text from a PDF buffer', async () => {
    const buffer = Buffer.from('fake pdf content')
    const result = await runOCR(buffer, 'application/pdf')

    expect(result).toBeDefined()
    expect(result.text).toBeTruthy()
    expect(typeof result.confidence).toBe('number')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(Array.isArray(result.lowConfidenceAreas)).toBe(true)
  })

  it('should return confidence between 0.75 and 1.0', async () => {
    const buffer = Buffer.from('fake content')
    // Run multiple times to check range
    for (let i = 0; i < 3; i++) {
      const result = await mockOCRService.extractText(buffer, 'image/jpeg')
      expect(result.confidence).toBeGreaterThanOrEqual(0.75)
      expect(result.confidence).toBeLessThanOrEqual(1.0)
    }
  })
})

// ─── Translation Service Tests ────────────────────────────────────────────────

describe('Translation Service', () => {
  it('should return supported languages', () => {
    const langs = mockTranslationService.getSupportedLanguages()
    expect(langs.length).toBeGreaterThan(0)
    const codes = langs.map(l => l.code)
    expect(codes).toContain('en')
    expect(codes).toContain('mn')
  })

  it('should translate text successfully', async () => {
    const result = await translateDocument('Hello, world!', 'en', 'mn')
    expect(result.sourceText).toBe('Hello, world!')
    expect(result.translatedText).toBeTruthy()
    expect(typeof result.confidence).toBe('number')
    expect(result.confidence).toBeGreaterThan(0)
    expect(Array.isArray(result.alternatives)).toBe(true)
  })

  it('should throw on empty source text', async () => {
    await expect(mockTranslationService.translateText('', 'en', 'mn')).rejects.toThrow(
      'Source text cannot be empty'
    )
  })

  it('should throw on whitespace-only source text', async () => {
    await expect(mockTranslationService.translateText('   ', 'en', 'mn')).rejects.toThrow(
      'Source text cannot be empty'
    )
  })

  it('should return confidence between 0.82 and 1.0', async () => {
    const result = await mockTranslationService.translateText('Test document', 'en', 'mn')
    expect(result.confidence).toBeGreaterThanOrEqual(0.82)
    expect(result.confidence).toBeLessThanOrEqual(1.0)
  })
})

// ─── PDF Generation Tests ─────────────────────────────────────────────────────

describe('PDF Generation', () => {
  it('should generate a certificate PDF', async () => {
    const pdfBytes = await generateCertificatePDF({
      jobId: 'test-job-id',
      jobTitle: 'Test Certificate',
      sourceLanguage: 'English',
      targetLanguage: 'Mongolian',
      translatorName: 'John Doe',
      reviewerName: 'Jane Smith',
      certificationType: 'certified',
      completedAt: new Date().toISOString(),
      certificationNumber: 'PL-2024-123456',
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(1000)

    // Check PDF header magic bytes: %PDF-
    const header = String.fromCharCode(...pdfBytes.slice(0, 5))
    expect(header).toBe('%PDF-')
  })

  it('should generate a translated document PDF', async () => {
    const pdfBytes = await generateTranslatedDocumentPDF({
      title: 'Test Translation',
      sourceText: 'This is the original source text in English.',
      translatedText: 'Энэ бол орчуулсан текст юм.',
      sourceLanguage: 'en',
      targetLanguage: 'mn',
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(1000)

    const header = String.fromCharCode(...pdfBytes.slice(0, 5))
    expect(header).toBe('%PDF-')
  })

  it('should support all certification types', async () => {
    const types: Array<'certified' | 'notarized' | 'apostille'> = ['certified', 'notarized', 'apostille']

    for (const certType of types) {
      const pdfBytes = await generateCertificatePDF({
        jobId: 'test-id',
        jobTitle: `Test ${certType}`,
        sourceLanguage: 'English',
        targetLanguage: 'Mongolian',
        translatorName: 'Translator',
        certificationType: certType,
        completedAt: new Date().toISOString(),
        certificationNumber: `PL-2024-${Math.random()}`,
      })
      expect(pdfBytes.length).toBeGreaterThan(1000)
    }
  })
})

// ─── Status Transition Tests ──────────────────────────────────────────────────

describe('Status Transitions', () => {
  it('should define all statuses in order', () => {
    expect(STATUS_ORDER).toEqual([
      'received',
      'ocr_reviewed',
      'in_translation',
      'in_review',
      'ready',
      'delivered',
    ])
  })

  it('should allow valid forward transitions', () => {
    expect(canTransitionTo('received', 'ocr_reviewed')).toBe(true)
    expect(canTransitionTo('ocr_reviewed', 'in_translation')).toBe(true)
    expect(canTransitionTo('in_translation', 'in_review')).toBe(true)
    expect(canTransitionTo('in_review', 'ready')).toBe(true)
    expect(canTransitionTo('ready', 'delivered')).toBe(true)
  })

  it('should allow valid backward transitions', () => {
    expect(canTransitionTo('ocr_reviewed', 'received')).toBe(true)
    expect(canTransitionTo('in_translation', 'ocr_reviewed')).toBe(true)
    expect(canTransitionTo('in_review', 'in_translation')).toBe(true)
  })

  it('should reject skipping statuses', () => {
    expect(canTransitionTo('received', 'in_translation')).toBe(false)
    expect(canTransitionTo('received', 'delivered')).toBe(false)
    expect(canTransitionTo('in_review', 'received')).toBe(false)
  })

  it('should return next status correctly', () => {
    expect(getNextStatus('received')).toBe('ocr_reviewed')
    expect(getNextStatus('ocr_reviewed')).toBe('in_translation')
    expect(getNextStatus('in_translation')).toBe('in_review')
    expect(getNextStatus('in_review')).toBe('ready')
    expect(getNextStatus('ready')).toBe('delivered')
    expect(getNextStatus('delivered')).toBe(null)
  })

  it('should return previous status correctly', () => {
    expect(getPreviousStatus('delivered')).toBe('ready')
    expect(getPreviousStatus('ready')).toBe('in_review')
    expect(getPreviousStatus('in_review')).toBe('in_translation')
    expect(getPreviousStatus('in_translation')).toBe('ocr_reviewed')
    expect(getPreviousStatus('ocr_reviewed')).toBe('received')
    expect(getPreviousStatus('received')).toBe(null)
  })

  it('should correctly identify terminal status', () => {
    expect(isTerminalStatus('delivered')).toBe(true)
    expect(isTerminalStatus('ready')).toBe(false)
    expect(isTerminalStatus('received')).toBe(false)
  })

  it('should calculate status progress', () => {
    // received = step 1/6 = ~17%
    expect(getStatusProgress('received')).toBe(17)
    // delivered = step 6/6 = 100%
    expect(getStatusProgress('delivered')).toBe(100)
    // in_translation = step 3/6 = 50%
    expect(getStatusProgress('in_translation')).toBe(50)
  })

  it('should have config for all statuses', () => {
    const allStatuses: JobStatus[] = ['received', 'ocr_reviewed', 'in_translation', 'in_review', 'ready', 'delivered']
    for (const status of allStatuses) {
      const config = JOB_STATUS_CONFIG[status]
      expect(config).toBeDefined()
      expect(config.label).toBeTruthy()
      expect(config.color).toBeTruthy()
      expect(config.step).toBeGreaterThan(0)
    }
  })
})
