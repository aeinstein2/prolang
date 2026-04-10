import Link from 'next/link'
import { Globe } from 'lucide-react'
import SignupForm from './signup-form'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">ProLang</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-600 mt-1">Start submitting documents for translation</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <SignupForm />
        </div>
        <p className="text-center text-slate-600 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-slate-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
