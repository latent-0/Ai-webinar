import { Link } from '@tanstack/react-router'
import { Radio, BookOpen, Gamepad2, ArrowRight, Zap, Brain, Database, Wrench, ChevronRight, Sparkles } from 'lucide-react'

const modes = [
  {
    id: 'live',
    tag: '01',
    title: 'Live',
    subtitle: 'Engage in real time',
    icon: Radio,
    color: 'text-blue-400',
    cardBorder: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/10',
    dotColor: 'bg-blue-400',
    topLine: 'from-transparent via-blue-500/50 to-transparent',
    href: '/live',
    description: 'Host webinars with AI-powered Q&A, live reactions, and intelligent audience engagement that adapts to your room in real time.',
    features: ['AI synthesises audience questions', 'Real-time participant tracking', 'Live polls & reactions', 'In-session knowledge capture'],
  },
  {
    id: 'learn',
    tag: '02',
    title: 'Learn',
    subtitle: 'Build deep knowledge',
    icon: BookOpen,
    color: 'text-emerald-400',
    cardBorder: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/10',
    dotColor: 'bg-emerald-400',
    topLine: 'from-transparent via-emerald-500/50 to-transparent',
    href: '/learn',
    description: 'RAG-powered knowledge hub with domain-specific AI. From dentistry to digital marketing — expert-level depth on demand.',
    features: ['6 curated domain knowledge bases', 'AI-generated learning paths', 'Structured Q&A with memory', 'Contextual follow-up questions'],
  },
  {
    id: 'play',
    tag: '03',
    title: 'Play',
    subtitle: 'Experiment & discover',
    icon: Gamepad2,
    color: 'text-violet-400',
    cardBorder: 'border-violet-500/20 hover:border-violet-500/40',
    iconBg: 'bg-violet-500/10',
    dotColor: 'bg-violet-400',
    topLine: 'from-transparent via-violet-500/50 to-transparent',
    href: '/play',
    description: 'A sandbox for hands-on tool exploration with an always-on AI mentor. Learn by doing — not watching slide decks.',
    features: ['6 integrated professional tools', 'Step-by-step AI guidance', 'Pre-built real-world scenarios', 'Creative workflow generation'],
  },
]

const pillars = [
  { icon: Brain, label: 'Reasoning', desc: 'Thinks before answering' },
  { icon: Database, label: 'Knowledge', desc: 'RAG across all domains' },
  { icon: Wrench, label: 'Tools', desc: 'Real software, real tasks' },
]

const stats = [
  { value: '3', label: 'Core modes' },
  { value: '6', label: 'Knowledge domains' },
  { value: '6', label: 'Integrated tools' },
]

export default function Landing() {
  return (
    <div className="min-h-screen relative">
      {/* Ambient background glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-[10%] w-[600px] h-[600px] bg-blue-600/[0.055] rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[5%] w-[450px] h-[450px] bg-violet-600/[0.045] rounded-full blur-[100px]" />
        <div className="absolute bottom-[15%] left-[35%] w-[400px] h-[400px] bg-emerald-600/[0.035] rounded-full blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="px-6 lg:px-10 pt-16 pb-12 max-w-[1100px] mx-auto">
        {/* Status pill */}
        <div className="flex items-center gap-3 mb-10">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-xs text-[#9999AA] font-medium">Platform live</span>
          </div>
          <span className="hidden lg:flex items-center gap-1.5 text-xs text-[#4A4A5A]">
            <Sparkles size={10} />
            AI-powered webinars · learning · tool sandbox
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(2.6rem,6.5vw,5.2rem)] font-extrabold leading-[0.9] tracking-tight mb-7">
          <span className="text-white block">Not another</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #34D399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            webinar tool.
          </span>
        </h1>

        <p className="text-[1.05rem] text-[#6B6B85] max-w-[480px] leading-relaxed mb-10 font-light">
          Agentic AI that listens, learns, and responds — delivering a personalised intelligence layer to every participant in the room.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/live"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-px"
          >
            Start a session
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/learn"
            className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-[#8888AA] hover:text-white font-medium text-sm transition-colors"
          >
            Explore knowledge hub <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* Mode cards */}
      <section className="px-6 lg:px-10 pb-12 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <Link
                key={mode.id}
                to={mode.href}
                className={`group relative flex flex-col p-6 rounded-2xl border bg-white/[0.02] hover:bg-white/[0.035] transition-all duration-300 cursor-pointer ${mode.cardBorder}`}
              >
                {/* Top gradient line */}
                <div className={`absolute top-0 inset-x-8 h-px bg-gradient-to-r ${mode.topLine}`} />

                {/* Tag + icon row */}
                <div className="flex items-start justify-between mb-5">
                  <span className="text-[11px] font-mono text-[#3A3A50] tracking-wider">{mode.tag}</span>
                  <div className={`p-2.5 rounded-xl ${mode.iconBg}`}>
                    <Icon size={17} className={mode.color} />
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{mode.title}</h3>
                  <p className={`text-xs font-medium ${mode.color} opacity-70`}>{mode.subtitle}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-[#6B6B85] leading-relaxed mb-5 flex-1">{mode.description}</p>

                {/* Features */}
                <ul className="space-y-1.5 mb-5">
                  {mode.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#4A4A5A]">
                      <span className={`w-1 h-1 rounded-full shrink-0 ${mode.dotColor}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={`flex items-center gap-1.5 text-xs ${mode.color} opacity-50 group-hover:opacity-100 transition-opacity font-medium`}>
                  Open {mode.title}
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Bottom strip: stats + AI layer */}
      <section className="px-6 lg:px-10 pb-20 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_2.2fr] gap-3">
          {stats.map(({ value, label }) => (
            <div key={label} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</p>
              <p className="text-xs text-[#6B6B85]">{label}</p>
            </div>
          ))}

          {/* Unified AI layer card */}
          <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                <Zap size={11} className="text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-white tracking-wide">Unified AI layer</span>
            </div>
            <p className="text-xs text-[#6B6B85] leading-relaxed mb-4">
              Reasoning, knowledge, and tools — one intelligence core powering all three modes simultaneously.
            </p>
            <div className="flex flex-wrap gap-2">
              {pillars.map(({ icon: PIcon, label, desc }) => (
                <div
                  key={label}
                  title={desc}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] cursor-default"
                >
                  <PIcon size={11} className="text-[#8888AA]" />
                  <span className="text-[11px] text-[#8888AA] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
