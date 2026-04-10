'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateJobStatus } from '@/lib/actions/jobs'
import { toast } from 'sonner'
import { CheckCircle, XCircle, FileText, Loader2, Download } from 'lucide-react'
import { formatLanguage } from '@/lib/utils/format'
import { generateCertificationNumber } from '@/lib/utils/format'
import type { JobStatus, CertificationType } from '@/types'

interface ReviewerWorkspaceProps {
  jobId: string
  translatedText: string | null
  sourceLanguage: string
  targetLanguage: string
  currentStatus: JobStatus
  translatorName: string
  reviewerName: string
  jobTitle: string
  certificationTypeRaw: CertificationType
}

export function ReviewerWorkspace({
  jobId,
  translatedText,
  sourceLanguage,
  targetLanguage,
  currentStatus,
  translatorName,
  reviewerName,
  jobTitle,
  certificationTypeRaw,
}: ReviewerWorkspaceProps) {
  const [isPending, startTransition] = useTransition()
  const [editNotes, setEditNotes] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [certUrl, setCertUrl] = useState<string | null>(null)
  const [isGeneratingCert, setIsGeneratingCert] = useState(false)

  const isApproved = currentStatus === 'ready' || currentStatus === 'delivered'
  const isInReview = currentStatus === 'in_review'

  function handleApprove() {
    startTransition(async () => {
      try {
        await updateJobStatus(jobId, 'ready', 'Approved by reviewer')
        toast.success('Translation approved — status set to Ready')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to approve')
      }
    })
  }

  function handleRequestEdits() {
    if (!editNotes.trim()) {
      toast.error('Please add notes explaining what needs to be edited')
      return
    }
    startTransition(async () => {
      try {
        await updateJobStatus(jobId, 'in_translation', `Edit request: ${editNotes}`)
        toast.success('Edits requested — sent back to translator')
        setEditNotes('')
        setShowEditForm(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to request edits')
      }
    })
  }

  async function handleGenerateCertificate() {
    if (certificationTypeRaw === 'none') {
      toast.error('This job does not require a certificate')
      return
    }
    if (!translatedText) {
      toast.error('No translation available to certify')
      return
    }
    setIsGeneratingCert(true)
    try {
      const response = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobTitle,
          sourceLanguage,
          targetLanguage,
          translatorName,
          reviewerName,
          certificationType: certificationTypeRaw,
          certificationNumber: generateCertificationNumber(),
        }),
      })
      if (!response.ok) throw new Error('Certificate generation failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setCertUrl(url)
      toast.success('Certificate generated!')
    } catch {
      // Mock fallback
      toast.success('Certificate generated (mock mode) — would download PDF')
      setCertUrl('mock')
    } finally {
      setIsGeneratingCert(false)
    }
  }

  return (
    <Card className="flex-1 flex flex-col min-h-[calc(100vh-200px)]">
      <div className="px-4 py-3 border-b bg-slate-50 rounded-t-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Translation — {formatLanguage(targetLanguage)}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Translated by: {translatorName}</p>
        </div>
        {isApproved && (
          <span className="text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {translatedText ? (
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
            {translatedText}
          </pre>
        ) : (
          <div className="text-center text-slate-400 py-12">
            <p className="text-sm">No translation submitted yet.</p>
            <p className="text-xs mt-1">The translator has not completed this job.</p>
          </div>
        )}
      </div>

      {/* Review actions */}
      <div className="p-4 border-t space-y-3">
        {isApproved ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">
              <CheckCircle className="w-4 h-4" />
              Translation approved and ready
            </div>
            {certificationTypeRaw !== 'none' && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
                onClick={handleGenerateCertificate}
                disabled={isGeneratingCert}
              >
                {isGeneratingCert ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 mr-1" />
                )}
                {isGeneratingCert ? 'Generating...' : 'Generate Certificate'}
              </Button>
            )}
            {certUrl && certUrl !== 'mock' && (
              <a href={certUrl} download={`certificate-${jobId}.pdf`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-3 h-3 mr-1" />
                  Download Certificate
                </Button>
              </a>
            )}
          </div>
        ) : isInReview ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                size="sm"
                onClick={handleApprove}
                disabled={isPending || !translatedText}
              >
                {isPending ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowEditForm(!showEditForm)}
                disabled={isPending}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Request Edits
              </Button>
            </div>

            {showEditForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Describe what needs to be corrected or improved..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="text-sm min-h-[80px]"
                />
                <Button
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={handleRequestEdits}
                  disabled={isPending || !editNotes.trim()}
                >
                  {isPending ? 'Sending...' : 'Send Back for Edits'}
                </Button>
              </div>
            )}

            {certificationTypeRaw !== 'none' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleGenerateCertificate}
                disabled={isGeneratingCert || !translatedText}
              >
                {isGeneratingCert ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 mr-1" />
                )}
                Preview Certificate
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            Job is not in review status. Current: {currentStatus.replace(/_/g, ' ')}
          </div>
        )}
      </div>
    </Card>
  )
}
