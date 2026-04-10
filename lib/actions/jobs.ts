'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canTransitionTo, STATUS_ORDER } from '@/lib/utils/status'
import { sendJobReceivedEmail, sendJobInProgressEmail, sendJobReadyEmail, sendAssignmentEmail } from '@/lib/services/email'
import type { CreateJobInput, JobStatus, UrgencyLevel, CertificationType } from '@/types'

export async function createJob(input: CreateJobInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      customer_id: user.id,
      title: input.title,
      description: input.description || null,
      source_language: input.source_language,
      target_language: input.target_language,
      urgency: input.urgency,
      certification_type: input.certification_type,
      status: 'received' as JobStatus,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Record status history
  await supabase.from('job_status_history').insert({
    job_id: job.id,
    from_status: null,
    to_status: 'received',
    changed_by: user.id,
    notes: 'Job created by customer',
  })

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'create_job',
    resource_type: 'job',
    resource_id: job.id,
    metadata: { title: input.title, urgency: input.urgency },
  })

  // Send email notification
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  if (profile) {
    await sendJobReceivedEmail(profile.email, input.title, job.id)
  }

  revalidatePath('/dashboard')
  return job
}

export async function updateJobStatus(
  jobId: string,
  newStatus: JobStatus,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  // Verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['staff_admin', 'translator', 'reviewer'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  // Get current job
  const { data: job } = await supabase
    .from('jobs')
    .select('*, customer:profiles!customer_id(email, full_name)')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job not found')

  // Validate transition
  if (!canTransitionTo(job.status, newStatus)) {
    throw new Error(`Cannot transition from ${job.status} to ${newStatus}`)
  }

  // Update status
  const { error } = await supabase
    .from('jobs')
    .update({ status: newStatus })
    .eq('id', jobId)

  if (error) throw new Error(error.message)

  // Record history
  await supabase.from('job_status_history').insert({
    job_id: jobId,
    from_status: job.status,
    to_status: newStatus,
    changed_by: user.id,
    notes: notes || null,
  })

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'update_job_status',
    resource_type: 'job',
    resource_id: jobId,
    metadata: { from: job.status, to: newStatus, notes },
  })

  // Create internal notification
  if (job.customer_id) {
    await supabase.from('notifications').insert({
      user_id: job.customer_id,
      job_id: jobId,
      title: `Job Status Updated`,
      message: `Your job "${job.title}" is now ${newStatus.replace(/_/g, ' ')}`,
      notification_type: 'job_updated',
    })
  }

  // Send email for key transitions
  if (job.customer) {
    const customer = job.customer as { email: string; full_name: string }
    if (newStatus === 'in_translation') {
      await sendJobInProgressEmail(customer.email, job.title, jobId)
    } else if (newStatus === 'ready') {
      await sendJobReadyEmail(customer.email, job.title, jobId)
    }
  }

  revalidatePath(`/admin/jobs/${jobId}`)
  revalidatePath('/admin')
  revalidatePath(`/jobs/${jobId}`)
}

export async function assignTranslator(jobId: string, translatorId: string, dueDate?: string, price?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'staff_admin') throw new Error('Only admins can assign translators')

  const { data: job } = await supabase.from('jobs').select('title').eq('id', jobId).single()
  if (!job) throw new Error('Job not found')

  const updates: Record<string, unknown> = { assigned_translator_id: translatorId }
  if (dueDate) updates.due_date = dueDate
  if (price !== undefined) updates.price = price

  const { error } = await supabase.from('jobs').update(updates).eq('id', jobId)
  if (error) throw new Error(error.message)

  // Get translator profile for email
  const { data: translator } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', translatorId)
    .single()

  if (translator) {
    // Internal notification
    await supabase.from('notifications').insert({
      user_id: translatorId,
      job_id: jobId,
      title: 'New Translation Assignment',
      message: `You have been assigned to translate "${job.title}"`,
      notification_type: 'assignment',
    })

    // Email
    await sendAssignmentEmail(
      translator.email,
      translator.full_name || 'Translator',
      job.title,
      jobId,
      'translator'
    )
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'assign_translator',
    resource_type: 'job',
    resource_id: jobId,
    metadata: { translatorId, dueDate, price },
  })

  revalidatePath(`/admin/jobs/${jobId}`)
  revalidatePath('/admin')
}

export async function assignReviewer(jobId: string, reviewerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'staff_admin') throw new Error('Only admins can assign reviewers')

  const { data: job } = await supabase.from('jobs').select('title').eq('id', jobId).single()
  if (!job) throw new Error('Job not found')

  const { error } = await supabase
    .from('jobs')
    .update({ assigned_reviewer_id: reviewerId })
    .eq('id', jobId)

  if (error) throw new Error(error.message)

  const { data: reviewer } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', reviewerId)
    .single()

  if (reviewer) {
    await supabase.from('notifications').insert({
      user_id: reviewerId,
      job_id: jobId,
      title: 'New Review Assignment',
      message: `You have been assigned to review "${job.title}"`,
      notification_type: 'review_request',
    })

    await sendAssignmentEmail(
      reviewer.email,
      reviewer.full_name || 'Reviewer',
      job.title,
      jobId,
      'reviewer'
    )
  }

  revalidatePath(`/admin/jobs/${jobId}`)
}

export async function updateJobDetails(
  jobId: string,
  updates: {
    notes?: string
    price?: number
    due_date?: string
    certification_type?: CertificationType
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('jobs').update(updates).eq('id', jobId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/jobs/${jobId}`)
}

export async function saveTranslation(
  jobId: string,
  sourceText: string,
  translatedText: string,
  isDraft: boolean = true
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check for existing translation
  const { data: existing } = await supabase
    .from('translations')
    .select('id')
    .eq('job_id', jobId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('translations')
      .update({ translated_text: translatedText, is_draft: isDraft })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('translations')
      .insert({
        job_id: jobId,
        translator_id: user.id,
        source_text: sourceText,
        translated_text: translatedText,
        is_draft: isDraft,
      })
    if (error) throw new Error(error.message)
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: isDraft ? 'save_draft_translation' : 'submit_translation',
    resource_type: 'translation',
    resource_id: jobId,
  })

  revalidatePath(`/translate/${jobId}`)
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
}
