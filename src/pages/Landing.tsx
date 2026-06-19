import { Link } from '@tanstack/react-router'
import { Radio, BookOpen, Gamepad2, ArrowRight, Zap, Brain, Database, Wrench } from 'lucide-react'

const modes = [
  {
    id: 'live',
    title: 'Live',
    subtitle: 'Engage',
    icon: Radio,
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    dot: 'bg-blue-400',
    href: '/live',
    description: 'Interactive webinar experience with AI-powered Q&A, real-time reactions, and intelligent audience engagement.',
    features: ['Built-in AI reasoning model', 'Real-time question capture', 'Participant tracking', 'Live reactions & polls'],
  },
  {
    id: 'learn',
    title: 'Learn',
    subtitle: 'Understand',
    icon: BookOpen,
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    dot: 'bg-emerald-400',
    href: '/learn',
    description: 'Deep knowledge hub powered by RAG. Access domain-specific learning for auditing, science, dentistry, and more.',
    features: ['RAG-powered knowledge base', 'Domain-specific AI', 'Structured learning paths', 'Guided Q&A'],
  },
  {
    id: 'play',
    title: 'Play',
    subtitle: 'Explore',
    icon: Gamepad2,
    gradient: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/30',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    dot: 'bg-violet-400',
    href: '/play',
    description: 'Experimental sandbox with third-party tool integrations. Learn by doing with AI as your always-on mentor.',
    features: ['Plug-in API tools', 'AI-generated workflows', 'Real-world scenarios', 'Creative tool integrations'],
  },
]

const platformPillars = [
  { icon: Brain, label: 'Reasoning', desc: 'Agentic AI that thinks' },
  { icon: Database, label: 'Knowledge', desc: 'RAG-powered memory' },
  { icon: Wrench, label: 'Tools', desc: 'Pluggable integrations' },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-8 pt-16 pb-12 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1E2E] border border-[#2A2A3A] text-xs text-[#888899] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          One ecosystem. Three powerful modes. Infinite possibilities.
        </div>

        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-none">
          <span className="text-white">Live</span>
          <span className="text-[#2A2A3A] mx-4">·</span>
          <span className="gradient-text">Learn</span>
          <span className="text-[#2A2A3A] mx-4">·</span>
          <span className="text-white">Play</span>
        </h1>

        <p className="text-lg text-[#888899] max-w-2xl leading-relaxed mb-10">
          The antidote to the antiquated webinar experience. Agentic AI that remembers, learns, and compounds knowledge — delivering a 1:1 experience to every participant in real time.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link to="/live" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-medium text-sm transition-colors">
            Start a session <ArrowRight size={16} />
          </Link>
          <Link to="/learn" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E1E2E] hover:bg-[#2A2A3A] text-white font-medium text-sm transition-colors border border-[#2A2A3A]">
            Explore knowledge
          </Link>
        </div>
      </section>

      {/* Mode Cards */}
      <section className="px-8 pb-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <Link
                key={mode.id}
                to={mode.href}
                className={`group p-6 rounded-xl bg-gradient-to-b ${mode.gradient} border ${mode.border} hover:border-opacity-60 transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${mode.iconBg} flex items-center justify-center`}>
                    <Icon size={20} className={mode.iconColor} />
                  </div>
                  <ArrowRight size={16} className="text-[#444455] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{mode.title}</h3>
                <p className={`text-xs font-medium ${mode.iconColor} mb-3`}>{mode.subtitle}</p>
                <p className="text-sm text-[#888899] leading-relaxed mb-4">{mode.description}</p>

                <ul className="space-y-1.5">
                  {mode.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#666677]">
                      <span className={`w-1 h-1 rounded-full ${mode.dot}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Core Platform */}
      <section className="px-8 pb-16 max-w-5xl mx-auto">
        <div className="p-6 rounded-xl bg-[#111118] border border-[#1E1E2E]">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-[#F59E0B]" />
            <span className="text-sm font-semibold text-white">Core Platform</span>
          </div>
          <p className="text-sm text-[#888899] mb-5 max-w-lg">
            All three modes run on a unified AI layer — reasoning, knowledge, and tools working together to deliver a compounding intelligence experience.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {platformPillars.map(({ icon: PIcon, label, desc }) => (
              <div key={label} className="p-4 rounded-lg bg-[#16161F] border border-[#2A2A3A]">
                <PIcon size={18} className="text-[#888899] mb-2" />
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-[#555566] mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
