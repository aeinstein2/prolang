import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/layout/nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/jobs/status-badge'
import { formatDate, formatLanguage, formatUrgency } from '@/lib/utils/format'
import { Plus, FileText, Clock } from 'lucide-react'
import type { Job } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'staff_admin') redirect('/admin')

  // Fetch jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  // For translators/reviewers, show assigned jobs too
  let assignedJobs: Job[] = []
  if (profile?.role === 'translator') {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('assigned_translator_id', user.id)
      .order('created_at', { ascending: false })
    assignedJobs = (data || []) as Job[]
  } else if (profile?.role === 'reviewer') {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('assigned_reviewer_id', user.id)
      .order('created_at', { ascending: false })
    assignedJobs = (data || []) as Job[]
  }

  const allJobs = (jobs || []) as Job[]

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav profile={profile} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {profile?.role === 'translator' ? 'My Assignments' :
               profile?.role === 'reviewer' ? 'My Reviews' :
               'My Translations'}
            </h1>
            <p className="text-slate-600 mt-1">
              {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Your translation jobs'}
            </p>
          </div>
          {profile?.role === 'customer' && (
            <Link href="/jobs/new">
              <Button className="bg-slate-900 hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" />
                New Translation
              </Button>
            </Link>
          )}
        </div>

        {/* Stats row */}
        {profile?.role === 'customer' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Jobs', value: allJobs.length, color: 'text-slate-900' },
              { label: 'In Progress', value: allJobs.filter(j => ['in_translation', 'in_review', 'ocr_reviewed'].includes(j.status)).length, color: 'text-amber-600' },
              { label: 'Ready', value: allJobs.filter(j => j.status === 'ready').length, color: 'text-teal-600' },
              { label: 'Delivered', value: allJobs.filter(j => j.status === 'delivered').length, color: 'text-green-600' },
            ].map(stat => (
              <Card key={stat.label} className="p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Assigned jobs for translator/reviewer */}
        {assignedJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Assigned to Me</h2>
            <div className="space-y-3">
              {assignedJobs.map(job => (
                <JobCard key={job.id} job={job} role={profile?.role || 'customer'} />
              ))}
            </div>
          </div>
        )}

        {/* Customer jobs */}
        {allJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-600 mb-2">No translations yet</h2>
            <p className="text-slate-500 mb-6">Submit your first document to get started</p>
            <Link href="/jobs/new">
              <Button className="bg-slate-900 hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" />
                Submit Document
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {allJobs.map(job => (
              <JobCard key={job.id} job={job} role={profile?.role || 'customer'} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function JobCard({ job, role }: { job: Job; role: string }) {
  const href = role === 'translator' ? `/translate/${job.id}` :
               role === 'reviewer' ? `/review/${job.id}` :
               `/jobs/${job.id}`

  return (
    <Link href={href}>
      <Card className="p-4 hover:border-slate-400 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-slate-900 truncate">{job.title}</h3>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
              <span>{formatLanguage(job.source_language)} → {formatLanguage(job.target_language)}</span>
              <span className="capitalize">{job.urgency}</span>
              {job.certification_type !== 'none' && (
                <span className="capitalize text-teal-600">{job.certification_type}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {formatDate(job.created_at)}
          </div>
        </div>
      </Card>
    </Link>
  )
}
