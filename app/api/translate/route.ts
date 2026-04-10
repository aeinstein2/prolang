import { NextRequest, NextResponse } from 'next/server'
import { translateDocument } from '@/lib/services/translation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { text: string; sourceLanguage: string; targetLanguage: string }
    const { text, sourceLanguage, targetLanguage } = body

    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await translateDocument(text, sourceLanguage, targetLanguage)
    return NextResponse.json({ translatedText: result.translatedText, confidence: result.confidence })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    )
  }
}
