import { NextRequest, NextResponse } from 'next/server'
import { generateCertificatePDF } from '@/lib/services/pdf'
import type { CertificateMetadata } from '@/lib/services/pdf'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      jobId: string
      jobTitle: string
      sourceLanguage: string
      targetLanguage: string
      translatorName: string
      reviewerName?: string
      certificationType: 'certified' | 'notarized' | 'apostille'
      certificationNumber: string
    }

    const metadata: CertificateMetadata = {
      jobId: body.jobId,
      jobTitle: body.jobTitle,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      translatorName: body.translatorName,
      reviewerName: body.reviewerName,
      certificationType: body.certificationType,
      completedAt: new Date().toISOString(),
      certificationNumber: body.certificationNumber,
    }

    const pdfBytes = await generateCertificatePDF(metadata)
    // Convert Uint8Array to Buffer for BodyInit compatibility
    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${body.jobId}.pdf"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Certificate generation failed' },
      { status: 500 }
    )
  }
}
