import { CheckCircle, Circle, Clock } from 'lucide-react'
import { STATUS_ORDER, JOB_STATUS_CONFIG } from '@/lib/utils/status'
import { formatDateTime } from '@/lib/utils/format'
import type { JobStatus, JobStatusHistory } from '@/types'
import { cn } from '@/lib/utils'

interface StatusTimelineProps {
  currentStatus: JobStatus
  history: JobStatusHistory[]
}

export function StatusTimeline({ currentStatus, history }: StatusTimelineProps) {
  const currentStep = JOB_STATUS_CONFIG[currentStatus]?.step || 1

  return (
    <div className="space-y-0">
      {STATUS_ORDER.map((status, idx) => {
        const config = JOB_STATUS_CONFIG[status]
        const historyEntry = history.find(h => h.to_status === status)
        const isCompleted = config.step < currentStep
        const isCurrent = status === currentStatus
        const isPending = config.step > currentStep
        const isLast = idx === STATUS_ORDER.length - 1

        return (
          <div key={status} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                isCompleted ? 'bg-slate-900 text-white' :
                isCurrent ? 'bg-slate-900 text-white ring-4 ring-slate-200' :
                'bg-white border-2 border-slate-200 text-slate-400'
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              {!isLast && (
                <div className={cn(
                  'w-0.5 flex-1 my-1',
                  isCompleted ? 'bg-slate-900' : 'bg-slate-200'
                )} style={{ minHeight: '24px' }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={cn(
                  'text-sm font-semibold',
                  isPending ? 'text-slate-400' : 'text-slate-900'
                )}>
                  {config.label}
                </h3>
                {isCurrent && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <p className={cn(
                'text-xs mt-0.5',
                isPending ? 'text-slate-400' : 'text-slate-500'
              )}>
                {config.description}
              </p>
              {historyEntry && (
                <p className="text-xs text-slate-400 mt-1">
                  {formatDateTime(historyEntry.created_at)}
                  {historyEntry.notes && ` · ${historyEntry.notes}`}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
