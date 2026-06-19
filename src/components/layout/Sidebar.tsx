import { Link, useRouter } from '@tanstack/react-router'
import { Radio, BookOpen, Gamepad2, Home, Settings, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Home', color: '' },
  { to: '/live', icon: Radio, label: 'Live', color: 'text-blue-400' },
  { to: '/learn', icon: BookOpen, label: 'Learn', color: 'text-emerald-400' },
  { to: '/play', icon: Gamepad2, label: 'Play', color: 'text-violet-400' },
]

export default function Sidebar() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  return (
    <aside className="w-16 lg:w-56 h-screen bg-[#111118] border-r border-[#1E1E2E] flex flex-col py-4 shrink-0">
      <div className="px-3 lg:px-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="hidden lg:block font-bold text-sm tracking-wide">Sandbox</span>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label, color }) => {
          const isActive = to === '/' ? currentPath === '/' : currentPath.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                isActive
                  ? 'bg-[#1E1E2E] text-white'
                  : 'text-[#888899] hover:bg-[#16161F] hover:text-white'
              )}
            >
              <Icon size={18} className={cn(isActive && color)} />
              <span className="hidden lg:block">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-2 mt-auto">
        <button className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg text-[#888899] hover:bg-[#16161F] hover:text-white transition-all text-sm font-medium w-full">
          <Settings size={18} />
          <span className="hidden lg:block">Settings</span>
        </button>
      </div>
    </aside>
  )
}
