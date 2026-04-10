import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/layout/nav'
import NewJobForm from './new-job-form'

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav profile={profile} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">New Translation Request</h1>
          <p className="text-slate-600 mt-1">Upload your document and specify translation requirements</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <NewJobForm />
        </div>
      </main>
    </div>
  )
}
