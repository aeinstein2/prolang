'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        const role = profile?.role || 'customer'
        let destination = redirectTo

        if (redirectTo === '/dashboard') {
          if (role === 'staff_admin') destination = '/admin'
          else destination = '/dashboard'
        }

        router.push(destination)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-700" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-slate-500">Demo Accounts</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="p-2 bg-slate-50 rounded border border-slate-200">
          <div className="font-medium text-slate-700">Customer</div>
          <div>customer@demo.com</div>
          <div>demo1234</div>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-200">
          <div className="font-medium text-slate-700">Staff Admin</div>
          <div>admin@demo.com</div>
          <div>demo1234</div>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-200">
          <div className="font-medium text-slate-700">Translator</div>
          <div>translator@demo.com</div>
          <div>demo1234</div>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-slate-200">
          <div className="font-medium text-slate-700">Reviewer</div>
          <div>reviewer@demo.com</div>
          <div>demo1234</div>
        </div>
      </div>
    </form>
  )
}
