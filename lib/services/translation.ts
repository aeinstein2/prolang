/**
 * Translation Service Interface
 * Mock implementation — replace with real AI translation (OpenAI, DeepL, Google Translate, etc.)
 */

import type { TranslationDraft } from '@/types'

export interface TranslationService {
  translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationDraft>
  getSupportedLanguages(): { code: string; name: string }[]
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'ar', name: 'Arabic' },
]

// Mock translations for EN → MN
const MOCK_TRANSLATIONS: Record<string, string> = {
  default: `[ОРЧУУЛГЫН НООРОГ]

Энэхүү баримт бичгийг мэргэжлийн орчуулагч орчуулсан болно.
Орчуулга нь эх бичвэртэй тохирч байна.

НЭГДСЭН БАЙГУУЛАГДСАНЫ ГЭРЧИЛГЭЭ

Монгол Улсын хуулийн дагуу МОНГОЛИАН БИЗНЕС ГРУП ХХК
2023 оны 3-р сарын 15-нд байгуулагдсаныг баталгаажуулна.

Байгууллагын бүртгэлийн дугаар: 7654321
Байгуулагдсаны хэлбэр: Хязгаарлагдмал хариуцлагатай компани
Дүрмийн сан: 1,000,000 төгрөг

Захирал: Бат-Эрдэнэ Гантулга
Бүртгэлийн хаяг: Улаанбаатар хот, Сүхбаатар дүүрэг

Монгол Улсын Бүртгэлийн газрын эрх бүхий албан тушаалтан
гарын үсэг зурсан.

[АЛБАН ТАМГА]
Бүртгэлийн ажилтан: ___________________`,
}

/**
 * Mock translation service
 * Simulates AI translation with confidence and alternatives
 */
export const mockTranslationService: TranslationService = {
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES
  },

  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationDraft> {
    if (!text || text.trim().length === 0) {
      throw new Error('Source text cannot be empty')
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500))

    const langPair = `${sourceLanguage}_${targetLanguage}`
    const translatedText = MOCK_TRANSLATIONS[langPair] || MOCK_TRANSLATIONS['default']

    // Simulate confidence score
    const confidence = 0.82 + Math.random() * 0.15

    const alternatives = [
      `[Альтернатив орчуулга 1] ${translatedText.substring(0, 100)}...`,
      `[Альтернатив орчуулга 2] ${translatedText.substring(0, 100)}...`,
    ]

    return {
      sourceText: text,
      translatedText,
      confidence: parseFloat(confidence.toFixed(4)),
      alternatives,
    }
  },
}

/**
 * Factory function — swap to use real translation service
 */
export function getTranslationService(): TranslationService {
  const provider = process.env.TRANSLATION_PROVIDER || 'mock'

  switch (provider) {
    case 'mock':
    default:
      return mockTranslationService
    // Future: case 'openai': return new OpenAITranslationService()
    // Future: case 'deepl': return new DeepLTranslationService()
    // Future: case 'google': return new GoogleTranslationService()
  }
}

export async function translateDocument(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationDraft> {
  const service = getTranslationService()
  return service.translateText(text, sourceLanguage, targetLanguage)
}
