'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createJob } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '@/lib/services/translation'
import type { UrgencyLevel, CertificationType } from '@/types'

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText
  if (type.includes('image')) return ImageIcon
  return File
}

export default function NewJobForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    source_language: 'en',
    target_language: 'mn',
    urgency: 'standard' as UrgencyLevel,
    certification_type: 'none' as CertificationType,
  })

  function handleFileChange(selectedFile: File | null) {
    if (!selectedFile) return
    const allowedTypes = Object.keys(ACCEPTED_TYPES)
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Unsupported file type. Please upload PDF, JPG, PNG, or DOCX')
      return
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50MB')
      return
    }
    setFile(selectedFile)
    if (!form.title) {
      setForm(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^.]+$/, '') }))
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFileChange(droppedFile)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Please enter a job title')
      return
    }

    setLoading(true)

    try {
      const job = await createJob(form)

      // Upload file if provided
      if (file && job) {
        const supabase = createClient()
        const ext = file.name.split('.').pop()
        const filePath = `${job.id}/source/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('job-files')
          .upload(filePath, file)

        if (!uploadError) {
          await supabase.from('job_files').insert({
            job_id: job.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            file_role: 'source',
          })
        } else {
          console.warn('File upload failed:', uploadError.message)
        }
      }

      toast.success('Translation request submitted!')
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File upload */}
      <div className="space-y-2">
        <Label>Document to Translate</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              {(() => {
                const Icon = getFileIcon(file.type)
                return <Icon className="w-6 h-6 text-slate-600" />
              })()}
              <span className="text-sm font-medium text-slate-900">{file.name}</span>
              <span className="text-xs text-slate-500">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX — Max 50MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Job title */}
      <div className="space-y-2">
        <Label htmlFor="title">Job Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Certificate of Incorporation"
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          required
          disabled={loading}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Additional Notes</Label>
        <Textarea
          id="description"
          placeholder="Any special instructions, context, or requirements..."
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Language pair */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Source Language *</Label>
          <Select
            value={form.source_language}
            onValueChange={(v: string | null) => { if (v) setForm(prev => ({ ...prev, source_language: v })) }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Target Language *</Label>
          <Select
            value={form.target_language}
            onValueChange={(v: string | null) => { if (v) setForm(prev => ({ ...prev, target_language: v })) }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Urgency & Certification */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Urgency</Label>
          <Select
            value={form.urgency}
            onValueChange={(v: string | null) => { if (v) setForm(prev => ({ ...prev, urgency: v as UrgencyLevel })) }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard (5-7 days)</SelectItem>
              <SelectItem value="express">Express (2-3 days)</SelectItem>
              <SelectItem value="urgent">Urgent (24 hours)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Certification Type</Label>
          <Select
            value={form.certification_type}
            onValueChange={(v: string | null) => { if (v) setForm(prev => ({ ...prev, certification_type: v as CertificationType })) }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Certification</SelectItem>
              <SelectItem value="certified">Certified Translation</SelectItem>
              <SelectItem value="notarized">Notarized</SelectItem>
              <SelectItem value="apostille">Apostille</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary card */}
      {form.urgency !== 'standard' && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {form.urgency === 'express' ? 'Express' : 'Urgent'} processing
            incurs an additional fee. Our team will contact you with pricing.
          </p>
        </Card>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-700" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Translation Request'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
