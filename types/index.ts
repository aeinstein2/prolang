export type UserRole = 'customer' | 'staff_admin' | 'translator' | 'reviewer'

export type JobStatus =
  | 'received'
  | 'ocr_reviewed'
  | 'in_translation'
  | 'in_review'
  | 'ready'
  | 'delivered'

export type UrgencyLevel = 'standard' | 'express' | 'urgent'

export type CertificationType = 'none' | 'certified' | 'notarized' | 'apostille'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  customer_id: string
  title: string
  description: string | null
  source_language: string
  target_language: string
  urgency: UrgencyLevel
  certification_type: CertificationType
  status: JobStatus
  assigned_translator_id: string | null
  assigned_reviewer_id: string | null
  due_date: string | null
  price: number | null
  notes: string | null
  ocr_text: string | null
  ocr_confidence: number | null
  created_at: string
  updated_at: string
  // Relations
  customer?: Profile
  assigned_translator?: Profile
  assigned_reviewer?: Profile
  files?: JobFile[]
  status_history?: JobStatusHistory[]
}

export interface JobFile {
  id: string
  job_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  file_role: 'source' | 'translation' | 'delivery' | 'certificate'
  created_at: string
}

export interface JobStatusHistory {
  id: string
  job_id: string
  from_status: JobStatus | null
  to_status: JobStatus
  changed_by: string
  notes: string | null
  created_at: string
  changed_by_profile?: Profile
}

export interface Translation {
  id: string
  job_id: string
  translator_id: string | null
  source_text: string
  translated_text: string | null
  is_draft: boolean
  created_at: string
  updated_at: string
}

export interface GlossaryTerm {
  id: string
  source_term: string
  translated_term: string
  source_language: string
  target_language: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  job_id: string | null
  title: string
  message: string
  is_read: boolean
  notification_type: 'job_received' | 'job_updated' | 'job_ready' | 'assignment' | 'review_request'
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface OCRResult {
  text: string
  confidence: number
  lowConfidenceAreas: Array<{
    text: string
    confidence: number
    position?: { x: number; y: number; width: number; height: number }
  }>
}

export interface TranslationDraft {
  sourceText: string
  translatedText: string
  confidence: number
  alternatives: string[]
}

export type CreateJobInput = {
  title: string
  description?: string
  source_language: string
  target_language: string
  urgency: UrgencyLevel
  certification_type: CertificationType
}
