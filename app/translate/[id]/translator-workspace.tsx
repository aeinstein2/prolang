'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { saveTranslation, updateJobStatus } from '@/lib/actions/jobs'
import { toast } from 'sonner'
import { Sparkles, Save, CheckCircle, Loader2 } from 'lucide-react'
import { formatLanguage } from '@/lib/utils/format'
import type { JobStatus } from '@/types'

interface TranslatorWorkspaceProps {
  jobId: string
  sourceText: string
  sourceLanguage: string
  targetLanguage: string
  currentStatus: JobStatus
  existingTranslation: string | null
  isDraft: boolean
}

export function TranslatorWorkspace({
  jobId,
  sourceText,
  sourceLanguage,
  targetLanguage,
  currentStatus,
  existingTranslation,
}: TranslatorWorkspaceProps) {
  const [translatedText, setTranslatedText] = useState(existingTranslation || '')
  const [isPending, startTransition] = useTransition()
  const [isAiLoading, setIsAiLoading] = useState(false)

  const isComplete = currentStatus === 'in_review' || currentStatus === 'ready' || currentStatus === 'delivered'

  async function handleAiDraft() {
    if (!sourceText) {
      toast.error('No source text to translate')
      return
    }
    setIsAiLoading(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, sourceLanguage, targetLanguage }),
      })
      if (!response.ok) throw new Error('Translation failed')
      const data = await response.json() as { translatedText: string }
      setTranslatedText(data.translatedText)
      toast.success('AI draft generated!')
    } catch {
      // Fallback: call mock service inline via server action
      startTransition(async () => {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sourceText, sourceLanguage, targetLanguage }),
          })
          if (res.ok) {
            const d = await res.json() as { translatedText: string }
            setTranslatedText(d.translatedText)
            toast.success('AI draft generated!')
          }
        } catch {
          // Use built-in mock text
          const mockText = `[AI TRANSLATION DRAFT]

This document has been automatically translated from ${formatLanguage(sourceLanguage)} to ${formatLanguage(targetLanguage)}.

Please review and edit this draft translation carefully before submitting.

---

${sourceText.split('\n').map(line =>
  line.trim() ? `[Translated]: ${line}` : ''
).filter(Boolean).join('\n')}

---
[End of AI Draft - Please review carefully]`
          setTranslatedText(mockText)
          toast.success('AI draft generated (mock mode)')
        }
      })
    } finally {
      setIsAiLoading(false)
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveTranslation(jobId, sourceText, translatedText, true)
        toast.success('Progress saved')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  function handleMarkComplete() {
    if (!translatedText.trim()) {
      toast.error('Please add a translation before marking complete')
      return
    }
    startTransition(async () => {
      try {
        await saveTranslation(jobId, sourceText, translatedText, false)
        await updateJobStatus(jobId, 'in_review', 'Translation completed by translator')
        toast.success('Translation submitted for review!')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to submit')
      }
    })
  }

  return (
    <Card className="flex-1 flex flex-col min-h-[calc(100vh-200px)]">
      <div className="px-4 py-3 border-b bg-slate-50 rounded-t-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Translation — {formatLanguage(targetLanguage)}
          </h2>
          {existingTranslation && (
            <p className="text-xs text-teal-600 mt-0.5">Draft saved</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAiDraft}
            disabled={isAiLoading || isPending || isComplete}
            className="text-purple-700 border-purple-300 hover:bg-purple-50"
          >
            {isAiLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            AI Draft
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        <Textarea
          value={translatedText}
          onChange={(e) => setTranslatedText(e.target.value)}
          placeholder={`Enter ${formatLanguage(targetLanguage)} translation here...`}
          className="flex-1 min-h-[400px] font-mono text-sm resize-none"
          disabled={isComplete}
        />

        {isComplete ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            Translation submitted for review
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSave}
              disabled={isPending}
            >
              <Save className="w-3 h-3 mr-1" />
              {isPending ? 'Saving...' : 'Save Progress'}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={handleMarkComplete}
              disabled={isPending || !translatedText.trim()}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              {isPending ? 'Submitting...' : 'Mark Complete'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
