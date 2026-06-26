import { useState, useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Radio, BookOpen, Gamepad2, Zap, Film, Sun, Moon } from 'lucide-react'

const navLinks = [
  { to: '/live',   label: 'Live',   icon: Radio,    dot: true  },
  { to: '/learn',  label: 'Learn',  icon: BookOpen,  dot: false },
  { to: '/play',   label: 'Play',   icon: Gamepad2,  dot: false },
  { to: '/canvas', label: 'Canvas', icon: Film,      dot: false },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = router.state.location.pathname
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Top Nav */}
      <header className="h-14 sticky top-0 z-50 bg-white/90 dark:bg-[#1A1A1F]/90 backdrop-blur-sm border-b border-[var(--border)] flex items-center px-6 gap-4">
        <Link to="/" className="flex items-center gap-2.5 mr-4 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[var(--text)] tracking-tight">Sandbox</span>
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
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]'
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

        <button
          onClick={() => setIsDark((d) => !d)}
          className="p-2 rounded-lg hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

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
