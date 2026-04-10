import type { JobStatus } from '@/types'

export const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: string; description: string; step: number }
> = {
  received: {
    label: 'Received',
    color: 'bg-slate-100 text-slate-700',
    description: 'Document received and awaiting review',
    step: 1,
  },
  ocr_reviewed: {
    label: 'OCR Reviewed',
    color: 'bg-blue-100 text-blue-700',
    description: 'Text extracted and verified by staff',
    step: 2,
  },
  in_translation: {
    label: 'In Translation',
    color: 'bg-amber-100 text-amber-700',
    description: 'Translator is working on the document',
    step: 3,
  },
  in_review: {
    label: 'In Review',
    color: 'bg-purple-100 text-purple-700',
    description: 'Translation is being reviewed for accuracy',
    step: 4,
  },
  ready: {
    label: 'Ready',
    color: 'bg-teal-100 text-teal-700',
    description: 'Translation complete and ready for delivery',
    step: 5,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-700',
    description: 'Document delivered to customer',
    step: 6,
  },
}

export const STATUS_ORDER: JobStatus[] = [
  'received',
  'ocr_reviewed',
  'in_translation',
  'in_review',
  'ready',
  'delivered',
]

export function getNextStatus(current: JobStatus): JobStatus | null {
  const idx = STATUS_ORDER.indexOf(current)
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null
  return STATUS_ORDER[idx + 1]
}

export function getPreviousStatus(current: JobStatus): JobStatus | null {
  const idx = STATUS_ORDER.indexOf(current)
  if (idx <= 0) return null
  return STATUS_ORDER[idx - 1]
}

export function canTransitionTo(from: JobStatus, to: JobStatus): boolean {
  const fromIdx = STATUS_ORDER.indexOf(from)
  const toIdx = STATUS_ORDER.indexOf(to)
  if (fromIdx === -1 || toIdx === -1) return false
  // Can go forward one step or backward one step
  return toIdx === fromIdx + 1 || toIdx === fromIdx - 1
}

export function isTerminalStatus(status: JobStatus): boolean {
  return status === 'delivered'
}

export function getStatusProgress(status: JobStatus): number {
  const step = JOB_STATUS_CONFIG[status]?.step || 0
  return Math.round((step / STATUS_ORDER.length) * 100)
}

export function getStatusColor(status: JobStatus): string {
  return JOB_STATUS_CONFIG[status]?.color || 'bg-gray-100 text-gray-700'
}
