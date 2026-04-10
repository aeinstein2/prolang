import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy HH:mm')
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return 'Not set'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MNT',
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatLanguage(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    mn: 'Mongolian',
    zh: 'Chinese (Simplified)',
    ru: 'Russian',
    ja: 'Japanese',
    ko: 'Korean',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    ar: 'Arabic',
  }
  return languages[code] || code.toUpperCase()
}

export function formatCertificationType(type: string): string {
  const types: Record<string, string> = {
    none: 'No Certification',
    certified: 'Certified Translation',
    notarized: 'Notarized',
    apostille: 'Apostille',
  }
  return types[type] || type
}

export function formatUrgency(urgency: string): string {
  const urgencies: Record<string, string> = {
    standard: 'Standard (5-7 days)',
    express: 'Express (2-3 days)',
    urgent: 'Urgent (24 hours)',
  }
  return urgencies[urgency] || urgency
}

export function generateCertificationNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 900000) + 100000
  return `PL-${year}-${random}`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
