import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/layout/nav'
import { StatusBadge } from '@/components/jobs/status-badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { formatLanguage } from '@/lib/utils/format'
import { ReviewerWorkspace } from './reviewer-workspace'
import type { Job, Translation, Profile } from '@/types'

export default async function ReviewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || (profile.role !== 'reviewer' && profile.role !== 'staff_admin')) {
    redirect('/dashboard')
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('*, assigned_translator:profiles!assigned_translator_id(id, full_name), assigned_reviewer:profiles!assigned_reviewer_id(id, full_name)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  if (profile.role === 'reviewer' && job.assigned_reviewer_id !== user.id) {
    redirect('/dashboard')
  }

  const { data: translation } = await supabase
    .from('translations')
    .select('*')
    .eq('job_id', id)
    .single()

  const typedJob = job as Job
  const typedTranslation = translation as Translation | null

  const translatorName = typedJob.assigned_translator
    ? (typedJob.assigned_translator as Profile).full_name || 'Translator'
    : 'Unknown Translator'

  const reviewerName = typedJob.assigned_reviewer
    ? (typedJob.assigned_reviewer as Profile).full_name || 'Reviewer'
    : profile.full_name || 'Reviewer'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Nav profile={profile} />
      <div className="px-4 sm:px-6 py-4 border-b bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">{typedJob.title}</h1>
              <p className="text-xs text-slate-500">
                {formatLanguage(typedJob.source_language)} → {formatLanguage(typedJob.target_language)}
                {' · '}Translator: {translatorName}
              </p>
            </div>
          </div>
          <StatusBadge status={typedJob.status} />
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Source text */}
        <Card className="flex-1 flex flex-col min-h-[calc(100vh-200px)]">
          <div className="px-4 py-3 border-b bg-slate-50 rounded-t-xl">
            <h2 className="text-sm font-semibold text-slate-700">
              Source — {formatLanguage(typedJob.source_language)}
            </h2>
            {typedJob.ocr_confidence && (
              <p className="text-xs text-slate-400 mt-0.5">
                OCR: {(typedJob.ocr_confidence * 100).toFixed(1)}% confidence
              </p>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {typedJob.ocr_text ? (
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                {typedJob.ocr_text}
              </pre>
            ) : (
              <div className="text-center text-slate-400 py-12 text-sm">No source text available</div>
            )}
          </div>
        </Card>

        {/* Review workspace */}
        <ReviewerWorkspace
          jobId={id}
          translatedText={typedTranslation?.translated_text || null}
          sourceLanguage={typedJob.source_language}
          targetLanguage={typedJob.target_language}
          currentStatus={typedJob.status}
          translatorName={translatorName}
          reviewerName={reviewerName}
          jobTitle={typedJob.title}
          certificationTypeRaw={typedJob.certification_type}
        />
      </main>
    </div>
  )
}
