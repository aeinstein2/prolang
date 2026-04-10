import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/layout/nav'
import { StatusBadge } from '@/components/jobs/status-badge'
import { Card } from '@/components/ui/card'
import { formatDate, formatLanguage } from '@/lib/utils/format'
import { JOB_STATUS_CONFIG, STATUS_ORDER } from '@/lib/utils/status'
import { Clock, Users, AlertCircle } from 'lucide-react'
import type { Job, JobStatus } from '@/types'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'staff_admin') redirect('/dashboard')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, customer:profiles!customer_id(id, email, full_name), assigned_translator:profiles!assigned_translator_id(id, full_name), assigned_reviewer:profiles!assigned_reviewer_id(id, full_name)')
    .order('created_at', { ascending: false })

  const allJobs = (jobs || []) as Job[]

  // Group by status
  const grouped: Record<JobStatus, Job[]> = {
    received: [],
    ocr_reviewed: [],
    in_translation: [],
    in_review: [],
    ready: [],
    delivered: [],
  }

  for (const job of allJobs) {
    grouped[job.status as JobStatus].push(job)
  }

  const totalActive = allJobs.filter(j => j.status !== 'delivered').length

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav profile={profile} />
      <main className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">
              {allJobs.length} total jobs · {totalActive} active
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4" />
              <span>{allJobs.filter(j => !j.assigned_translator_id && j.status === 'ocr_reviewed').length} unassigned</span>
            </div>
            {allJobs.filter(j => j.urgency === 'urgent' && j.status !== 'delivered').length > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                <AlertCircle className="w-4 h-4" />
                <span>{allJobs.filter(j => j.urgency === 'urgent' && j.status !== 'delivered').length} urgent</span>
              </div>
            )}
          </div>
        </div>

        {/* Kanban board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max max-w-[1600px] mx-auto">
            {STATUS_ORDER.map((status) => {
              const config = JOB_STATUS_CONFIG[status]
              const columnJobs = grouped[status]

              return (
                <div key={status} className="w-72 flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">{config.label}</span>
                      <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {columnJobs.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {columnJobs.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
                        No jobs
                      </div>
                    ) : (
                      columnJobs.map((job) => (
                        <KanbanCard key={job.id} job={job} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

function KanbanCard({ job }: { job: Job }) {
  const urgencyColors: Record<string, string> = {
    standard: 'bg-slate-100 text-slate-600',
    express: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  }

  return (
    <Link href={`/admin/jobs/${job.id}`}>
      <Card className="p-4 hover:border-slate-400 transition-all hover:shadow-md cursor-pointer bg-white group">
        {/* Urgency stripe */}
        {job.urgency === 'urgent' && (
          <div className="h-1 bg-red-500 rounded-t-sm -mt-4 -mx-4 mb-3 rounded-t-lg" />
        )}
        {job.urgency === 'express' && (
          <div className="h-1 bg-amber-400 rounded-t-sm -mt-4 -mx-4 mb-3 rounded-t-lg" />
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 flex-1 group-hover:text-blue-700">
            {job.title}
          </h3>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${urgencyColors[job.urgency]}`}>
            {job.urgency}
          </span>
        </div>

        <div className="text-xs text-slate-500 mb-3">
          {formatLanguage(job.source_language)} → {formatLanguage(job.target_language)}
        </div>

        {/* Customer */}
        {job.customer && (
          <div className="text-xs text-slate-400 mb-2 truncate">
            👤 {(job.customer as { email: string; full_name: string | null }).full_name || (job.customer as { email: string }).email}
          </div>
        )}

        {/* Assignees */}
        <div className="flex flex-col gap-1 mb-3">
          {job.assigned_translator ? (
            <div className="text-xs text-blue-600">
              🌐 {(job.assigned_translator as { full_name: string | null }).full_name || 'Translator'}
            </div>
          ) : (
            <div className="text-xs text-amber-600">⚠ No translator</div>
          )}
          {job.assigned_reviewer ? (
            <div className="text-xs text-purple-600">
              ✓ {(job.assigned_reviewer as { full_name: string | null }).full_name || 'Reviewer'}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(job.created_at)}
          </div>
          {job.due_date && (
            <span className="text-orange-500">{formatDate(job.due_date)}</span>
          )}
          {job.price !== null && (
            <span className="text-green-600 font-medium">₮{job.price?.toLocaleString()}</span>
          )}
        </div>
      </Card>
    </Link>
  )
}
