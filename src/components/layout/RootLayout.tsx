import { Link, useRouter } from '@tanstack/react-router'
import { Radio, BookOpen, Gamepad2, Zap } from 'lucide-react'

const navLinks = [
  { to: '/live',  label: 'Live',  icon: Radio,    dot: true  },
  { to: '/learn', label: 'Learn', icon: BookOpen,  dot: false },
  { to: '/play',  label: 'Play',  icon: Gamepad2,  dot: false },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = router.state.location.pathname

  return (
    <div className="min-h-screen bg-[#F7F7FA] text-[#111827]">
      {/* Top Nav */}
      <header className="h-14 sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#E8E8EF] flex items-center px-6 gap-4">
        <Link to="/" className="flex items-center gap-2.5 mr-4 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#111827] tracking-tight">Sandbox</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, label, dot }) => {
            const isActive = path.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]'
                }`}
              >
                {dot && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                )}
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        <Link
          to="/live"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          Start session
        </Link>
      </header>

      <main>{children}</main>
    </div>
  )
}
