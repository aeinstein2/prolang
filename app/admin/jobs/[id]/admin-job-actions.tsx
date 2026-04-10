'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { assignTranslator, assignReviewer, updateJobStatus, updateJobDetails } from '@/lib/actions/jobs'
import { getNextStatus, getPreviousStatus, JOB_STATUS_CONFIG } from '@/lib/utils/status'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Save, Settings } from 'lucide-react'
import type { Job, Profile, JobStatus } from '@/types'

interface AdminJobActionsProps {
  job: Job
  translators: Profile[]
  reviewers: Profile[]
}

export function AdminJobActions({ job, translators, reviewers }: AdminJobActionsProps) {
  const [isPending, startTransition] = useTransition()

  // Assign translator
  const [selectedTranslator, setSelectedTranslator] = useState(job.assigned_translator_id || '')
  const [dueDate, setDueDate] = useState(job.due_date ? job.due_date.slice(0, 10) : '')
  const [price, setPrice] = useState(job.price?.toString() || '')

  // Assign reviewer
  const [selectedReviewer, setSelectedReviewer] = useState(job.assigned_reviewer_id || '')

  // Notes & details
  const [notes, setNotes] = useState(job.notes || '')

  // Status transition notes
  const [statusNotes, setStatusNotes] = useState('')

  const nextStatus = getNextStatus(job.status)
  const prevStatus = getPreviousStatus(job.status)

  function handleAssignTranslator() {
    if (!selectedTranslator) return
    startTransition(async () => {
      try {
        await assignTranslator(
          job.id,
          selectedTranslator,
          dueDate || undefined,
          price ? parseFloat(price) : undefined
        )
        toast.success('Translator assigned')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to assign translator')
      }
    })
  }

  function handleAssignReviewer() {
    if (!selectedReviewer) return
    startTransition(async () => {
      try {
        await assignReviewer(job.id, selectedReviewer)
        toast.success('Reviewer assigned')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to assign reviewer')
      }
    })
  }

  function handleUpdateStatus(status: JobStatus) {
    startTransition(async () => {
      try {
        await updateJobStatus(job.id, status, statusNotes || undefined)
        toast.success(`Status updated to ${JOB_STATUS_CONFIG[status].label}`)
        setStatusNotes('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update status')
      }
    })
  }

  function handleSaveDetails() {
    startTransition(async () => {
      try {
        await updateJobDetails(job.id, {
          notes: notes || undefined,
          price: price ? parseFloat(price) : undefined,
          due_date: dueDate || undefined,
        })
        toast.success('Job details saved')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save details')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Status transitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Status Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-slate-500 mb-1">
            Current: <span className="font-semibold text-slate-700">{JOB_STATUS_CONFIG[job.status].label}</span>
          </div>
          <Textarea
            placeholder="Notes for this transition (optional)..."
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            className="text-sm min-h-[60px]"
          />
          <div className="flex gap-2">
            {prevStatus && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isPending}
                onClick={() => handleUpdateStatus(prevStatus)}
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                {JOB_STATUS_CONFIG[prevStatus].label}
              </Button>
            )}
            {nextStatus && (
              <Button
                size="sm"
                className="flex-1 bg-slate-900 hover:bg-slate-700"
                disabled={isPending}
                onClick={() => handleUpdateStatus(nextStatus)}
              >
                {JOB_STATUS_CONFIG[nextStatus].label}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign translator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign Translator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Translator</Label>
            <Select
              value={selectedTranslator}
              onValueChange={(v: string | null) => { if (v) setSelectedTranslator(v) }}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select translator..." />
              </SelectTrigger>
              <SelectContent>
                {translators.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name || t.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Price (MNT)</Label>
            <Input
              type="number"
              placeholder="e.g. 150000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
            disabled={isPending || !selectedTranslator}
            onClick={handleAssignTranslator}
          >
            {isPending ? 'Saving...' : 'Assign Translator'}
          </Button>
        </CardContent>
      </Card>

      {/* Assign reviewer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign Reviewer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Reviewer</Label>
            <Select
              value={selectedReviewer}
              onValueChange={(v: string | null) => { if (v) setSelectedReviewer(v) }}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select reviewer..." />
              </SelectTrigger>
              <SelectContent>
                {reviewers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.full_name || r.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="sm"
            disabled={isPending || !selectedReviewer}
            onClick={handleAssignReviewer}
          >
            {isPending ? 'Saving...' : 'Assign Reviewer'}
          </Button>
        </CardContent>
      </Card>

      {/* Edit notes / details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Internal notes for staff..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm min-h-[80px]"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isPending}
            onClick={handleSaveDetails}
          >
            <Save className="w-3 h-3 mr-1" />
            {isPending ? 'Saving...' : 'Save Notes & Details'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
