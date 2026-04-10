import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/layout/nav'
import { StatusBadge } from '@/components/jobs/status-badge'
import { StatusTimeline } from '@/components/jobs/status-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminJobActions } from './admin-job-actions'
import { formatDate, formatDateTime, formatLanguage, formatCertificationType, formatUrgency, formatPrice, formatFileSize } from '@/lib/utils/format'
import { ArrowLeft, FileText, Calendar, User, DollarSign } from 'lucide-react'
import type { Job, Profile, JobStatusHistory, JobFile } from '@/types'

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'staff_admin') redirect('/dashboard')

  // Fetch job with all relations
  const { data: job } = await supabase
    .from('jobs')
    .select('*, customer:profiles!customer_id(*), assigned_translator:profiles!assigned_translator_id(*), assigned_reviewer:profiles!assigned_reviewer_id(*)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: history } = await supabase
    .from('job_status_history')
    .select('*, changed_by_profile:profiles!changed_by(*)')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  const { data: files } = await supabase
    .from('job_files')
    .select('*')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  // Fetch staff members for assignment dropdowns
  const { data: translators } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'translator')

  const { data: reviewers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'reviewer')

  const typedJob = job as Job
  const typedHistory = (history || []) as JobStatusHistory[]
  const typedFiles = (files || []) as JobFile[]

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav profile={profile} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back + Title */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{typedJob.title}</h1>
              <p className="text-slate-500 text-sm mt-1">Job ID: {id}</p>
            </div>
            <StatusBadge status={typedJob.status} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Languages</div>
                    <div className="font-medium">
                      {formatLanguage(typedJob.source_language)} → {formatLanguage(typedJob.target_language)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Urgency</div>
                    <div className="font-medium">{formatUrgency(typedJob.urgency)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Certification</div>
                    <div className="font-medium">{formatCertificationType(typedJob.certification_type)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Submitted</div>
                    <div className="font-medium">{formatDateTime(typedJob.created_at)}</div>
                  </div>
                  {typedJob.due_date && (
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Due Date</div>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(typedJob.due_date)}
                      </div>
                    </div>
                  )}
                  {typedJob.price !== null && (
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Price</div>
                      <div className="font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatPrice(typedJob.price)}
                      </div>
                    </div>
                  )}
                </div>
                {typedJob.description && (
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Description</div>
                    <p className="text-sm text-slate-700">{typedJob.description}</p>
                  </div>
                )}
                {typedJob.notes && (
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Internal Notes</div>
                    <p className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded p-2">{typedJob.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer info */}
            {typedJob.customer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="font-medium">{(typedJob.customer as Profile).full_name || 'No name'}</div>
                    <div className="text-slate-500">{(typedJob.customer as Profile).email}</div>
                    <div className="text-slate-400 text-xs mt-1">ID: {(typedJob.customer as Profile).id}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* OCR Text */}
            {typedJob.ocr_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Extracted Text (OCR)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {typedJob.ocr_text}
                  </div>
                  {typedJob.ocr_confidence && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-teal-500 h-1.5 rounded-full"
                          style={{ width: `${(typedJob.ocr_confidence * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {(typedJob.ocr_confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Files */}
            {typedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{file.file_name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="capitalize bg-slate-200 px-1.5 py-0.5 rounded">{file.file_role}</span>
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{formatDate(file.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin actions */}
            <AdminJobActions
              job={typedJob}
              translators={(translators || []) as Profile[]}
              reviewers={(reviewers || []) as Profile[]}
            />

            {/* Status timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline
                  currentStatus={typedJob.status}
                  history={typedHistory}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
