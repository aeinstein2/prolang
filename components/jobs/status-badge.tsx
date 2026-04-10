import { cn } from '@/lib/utils'
import { JOB_STATUS_CONFIG } from '@/lib/utils/status'
import type { JobStatus } from '@/types'

export function StatusBadge({ status }: { status: JobStatus }) {
  const config = JOB_STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.color)}>
      {config.label}
    </span>
  )
}
