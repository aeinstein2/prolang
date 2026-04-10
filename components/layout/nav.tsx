'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe, LogOut, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface NavItem {
  href: string
  label: string
}

const roleNavItems: Record<string, NavItem[]> = {
  customer: [
    { href: '/dashboard', label: 'My Jobs' },
    { href: '/jobs/new', label: 'New Translation' },
  ],
  staff_admin: [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin', label: 'All Jobs' },
  ],
  translator: [
    { href: '/dashboard', label: 'Assignments' },
  ],
  reviewer: [
    { href: '/dashboard', label: 'Reviews' },
  ],
}

export default function Nav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = roleNavItems[profile?.role || 'customer'] || roleNavItems.customer

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">ProLang</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-600">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-slate-600 border-l pl-4 ml-2">
              <User className="w-4 h-4" />
              <span className="hidden md:block max-w-32 truncate">
                {profile?.full_name || profile?.email || 'User'}
              </span>
              <span className="hidden md:block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs capitalize">
                {profile?.role?.replace('_', ' ') || 'customer'}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-slate-600">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
