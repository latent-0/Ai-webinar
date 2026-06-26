import { Link } from '@tanstack/react-router'
import { Radio, BookOpen, Gamepad2, ArrowRight, Brain, Database, Wrench, Sparkles, Zap, Users } from 'lucide-react'
import ParticleHeadline from '../components/ParticleHeadline'

const modes = [
  {
    id: 'live',  tag: '01', title: 'Live',  subtitle: 'Engage in real time',  icon: Radio,
    accent: 'indigo', href: '/live',
    description: 'Host webinars with AI-powered Q&A, live reactions, and intelligent audience engagement.',
    features: ['AI synthesises questions', 'Real-time participant tracking', 'Live polls & reactions', 'Knowledge capture'],
    dot: 'bg-indigo-500',
  },
  {
    id: 'learn', tag: '02', title: 'Learn', subtitle: 'Build deep knowledge', icon: BookOpen,
    accent: 'emerald', href: '/learn',
    description: 'RAG-powered knowledge hub with domain-specific AI. Expert-level depth on demand.',
    features: ['6 curated knowledge bases', 'AI learning paths', 'Structured Q&A', 'Session memory'],
    dot: 'bg-emerald-500',
  },
  {
    id: 'play',  tag: '03', title: 'Play',  subtitle: 'Experiment & discover', icon: Gamepad2,
    accent: 'violet', href: '/play',
    description: 'A sandbox for hands-on tool exploration with an always-on AI mentor. Learn by doing.',
    features: ['6 integrated tools', 'Step-by-step guidance', 'Real-world scenarios', 'Creative workflows'],
    dot: 'bg-violet-500',
  },
]

const stats = [
  { value: '3',  label: 'Core modes',        sub: 'Live · Learn · Play'        },
  { value: '6',  label: 'Knowledge domains', sub: 'Dental to digital marketing' },
  { value: '6',  label: 'Integrated tools',  sub: 'Pro-grade sandbox'           },
  { value: '∞',  label: 'AI context',        sub: 'Persistent session memory'   },
]

const pillars = [
  { icon: Brain,    label: 'Reasoning', desc: 'Thinks before answering',  color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-950/50'  },
  { icon: Database, label: 'Knowledge', desc: 'RAG across all domains',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
  { icon: Wrench,   label: 'Tools',     desc: 'Real software, real tasks', color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/50'  },
]

export default function Landing() {
  return (
    <div className="bg-[var(--surface)] min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 pt-16 pb-10 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Platform live</span>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--faint)]">
            <Sparkles size={10} />
            AI-powered webinars · learning · tool sandbox
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-12 items-center">
          <div>
            <ParticleHeadline />
            <p className="text-lg text-[var(--muted)] max-w-[420px] leading-relaxed mt-6 mb-8">
              Agentic AI that listens, learns, and responds — delivering a personalised intelligence layer to every participant.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/live" className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900 hover:-translate-y-px">
                Start a session
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/learn" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-3)] font-medium text-sm transition-colors">
                Explore knowledge hub
              </Link>
            </div>
          </div>

          {/* Mini bento preview */}
          <div className="hidden lg:grid grid-cols-2 gap-3">
            {[
              { label: 'Live Session',  sub: '128 participants', color: 'bg-indigo-600',  icon: Radio     },
              { label: 'AI Notes',      sub: '5 key takeaways',  color: 'bg-emerald-600', icon: Brain     },
              { label: 'Playground',    sub: 'API running',       color: 'bg-violet-600',  icon: Zap       },
              { label: 'Participants',  sub: '128 online',        color: 'bg-amber-500',   icon: Users     },
            ].map(({ label, sub, color, icon: Icon }) => (
              <div key={label} className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon size={14} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
                <p className="text-xs text-[var(--faint)] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-[var(--border-2)]" />

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 py-8 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-2)]">
              <p className="text-3xl font-bold text-[var(--text)] tracking-tight">{value}</p>
              <p className="text-sm font-semibold text-[var(--text-2)] mt-1">{label}</p>
              <p className="text-xs text-[var(--faint)] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mode cards ───────────────────────────────────────── */}
      <section className="px-6 lg:px-12 pb-12 max-w-[1200px] mx-auto">
        <p className="text-xs font-semibold text-[var(--faint)] uppercase tracking-wider mb-5">Three modes, one platform</p>
        <div className="grid lg:grid-cols-3 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon
            const grad = mode.accent === 'indigo' ? 'from-indigo-500 to-indigo-600'
              : mode.accent === 'emerald' ? 'from-emerald-500 to-emerald-600'
              : 'from-violet-500 to-violet-600'
            const textColor = mode.accent === 'indigo' ? 'text-indigo-500 group-hover:text-indigo-700'
              : mode.accent === 'emerald' ? 'text-emerald-500 group-hover:text-emerald-700'
              : 'text-violet-500 group-hover:text-violet-700'
            return (
              <Link
                key={mode.id}
                to={mode.href}
                className="group flex flex-col p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-50/60 dark:hover:shadow-indigo-950/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="text-[10px] font-mono text-[var(--faint)] tracking-widest">{mode.tag}</span>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                    <Icon size={17} className="text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[var(--text)] tracking-tight">{mode.title}</h3>
                <p className={`text-xs font-medium mt-0.5 mb-3 ${mode.accent === 'indigo' ? 'text-indigo-500' : mode.accent === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`}>
                  {mode.subtitle}
                </p>
                <p className="text-sm text-[var(--muted)] leading-relaxed mb-5 flex-1">{mode.description}</p>
                <ul className="space-y-1.5 mb-5">
                  {mode.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[var(--faint)]">
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${mode.dot}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${textColor}`}>
                  Open {mode.title}
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── AI layer ─────────────────────────────────────────── */}
      <section className="px-6 lg:px-12 pb-20 max-w-[1200px] mx-auto">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-950/30 dark:via-[var(--surface)] dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">Unified AI layer</h3>
              <p className="text-xs text-[var(--faint)]">One intelligence core powering all three modes simultaneously</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {pillars.map(({ icon: PIcon, label, desc, color, bg }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <PIcon size={16} className={color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
                  <p className="text-xs text-[var(--faint)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
