'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  LogOut,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: Array<'coach' | 'analyst' | 'player'>
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['coach', 'analyst', 'player'] },
  { label: 'Players', href: '/players', icon: Users, roles: ['coach', 'analyst', 'player'] },
  { label: 'Scouting', href: '/scouting', icon: Shield, roles: ['coach', 'analyst'] },
  { label: 'Nightly Report', href: '/nightly-report', icon: FileText, roles: ['coach', 'analyst'] },
]

export default function Sidebar({ user }: { user: UserProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const visibleNav = NAV.filter(item => item.roles.includes(user.role))

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-1 border-r border-surface-3 flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-surface-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lakers-purple flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-lakers-gold" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Lake Show</p>
            <p className="text-xs text-lakers-gold leading-none mt-0.5">Analytics</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-lakers-purple/20 text-white border border-lakers-purple/30'
                  : 'text-gray-400 hover:text-white hover:bg-surface-2'
              )}
            >
              <item.icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-lakers-gold' : '')} />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-lakers-gold" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-surface-3 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-lakers-purple/40 flex items-center justify-center text-xs font-bold text-lakers-gold flex-shrink-0">
            {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-surface-2 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
