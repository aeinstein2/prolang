import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/layout/nav'
import { StatusTimeline } from '@/components/jobs/status-timeline'
import { StatusBadge } from '@/components/jobs/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatLanguage, formatCertificationType, formatUrgency, formatPrice } from '@/lib/utils/format'
import { Download, ArrowLeft, FileText, Calendar } from 'lucide-react'
import type { Job, JobStatusHistory, JobFile } from '@/types'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  // Permission check
  if (profile?.role === 'customer' && job.customer_id !== user.id) {
    redirect('/dashboard')
  }

  const { data: history } = await supabase
    .from('job_status_history')
    .select('*')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  const { data: files } = await supabase
    .from('job_files')
    .select('*')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  const deliveryFiles = (files || []).filter((f: JobFile) =>
    f.file_role === 'delivery' || f.file_role === 'certificate'
  )
  const sourceFiles = (files || []).filter((f: JobFile) => f.file_role === 'source')

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav profile={profile} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-600 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{(job as Job).title}</h1>
              <p className="text-slate-500 text-sm mt-1">Job ID: {id.slice(0, 8)}...</p>
            </div>
            <StatusBadge status={(job as Job).status} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column: details */}
          <div className="md:col-span-2 space-y-6">
            {/* Job details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Languages</div>
                    <div className="font-medium">
                      {formatLanguage((job as Job).source_language)} → {formatLanguage((job as Job).target_language)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Urgency</div>
                    <div className="font-medium">{formatUrgency((job as Job).urgency)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Certification</div>
                    <div className="font-medium">{formatCertificationType((job as Job).certification_type)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Submitted</div>
                    <div className="font-medium">{formatDate((job as Job).created_at)}</div>
                  </div>
                  {(job as Job).due_date && (
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Due Date</div>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate((job as Job).due_date)}
                      </div>
                    </div>
                  )}
                  {(job as Job).price && (
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Price</div>
                      <div className="font-medium">{formatPrice((job as Job).price)}</div>
                    </div>
                  )}
                </div>
                {(job as Job).description && (
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Notes</div>
                    <p className="text-sm text-slate-700">{(job as Job).description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source files */}
            {sourceFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sourceFiles.map((file: JobFile) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{file.file_name}</div>
                          <div className="text-xs text-slate-500">{file.file_type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery files */}
            {deliveryFiles.length > 0 && (
              <Card className="border-teal-200 bg-teal-50">
                <CardHeader>
                  <CardTitle className="text-base text-teal-800">Translation Ready for Download</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deliveryFiles.map((file: JobFile) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <FileText className="w-5 h-5 text-teal-600" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{file.file_name}</div>
                          <div className="text-xs text-slate-500 capitalize">{file.file_role}</div>
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* OCR text preview (for staff/translator/reviewer) */}
            {(profile?.role !== 'customer') && (job as Job).ocr_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Extracted Text (OCR)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {(job as Job).ocr_text}
                  </div>
                  {(job as Job).ocr_confidence && (
                    <p className="text-xs text-slate-500 mt-2">
                      OCR Confidence: {((job as Job).ocr_confidence! * 100).toFixed(1)}%
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline
                  currentStatus={(job as Job).status}
                  history={(history || []) as JobStatusHistory[]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
