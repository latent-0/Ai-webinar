import { useState, useRef, useEffect } from 'react'
import { Gamepad2, Send, Brain, Sparkles, Image, Table, Layers, Wrench, Code, Puzzle } from 'lucide-react'
import { useAppStore } from '../store'
import { askGemini } from '../lib/gemini'

const tools = [
  { id: 'photoshop', icon: Image, label: 'Photoshop', badge: 'Creative', color: 'blue' },
  { id: 'excel', icon: Table, label: 'Excel / Sheets', badge: 'Business', color: 'emerald' },
  { id: 'cubase', icon: Layers, label: 'Cubase', badge: 'Audio', color: 'violet' },
  { id: 'googleads', icon: Wrench, label: 'Google Ads', badge: 'Marketing', color: 'amber' },
  { id: 'code', icon: Code, label: 'Code Editor', badge: 'Dev', color: 'cyan' },
  { id: 'api', icon: Puzzle, label: 'API Playground', badge: 'Dev', color: 'rose' },
]

const scenarios = [
  { id: 's1', title: 'Design a social media campaign', tools: 'Photoshop + Ads', difficulty: 'Beginner' },
  { id: 's2', title: 'Analyse sales data & forecast Q4', tools: 'Excel', difficulty: 'Intermediate' },
  { id: 's3', title: 'Build a landing page from scratch', tools: 'Code Editor', difficulty: 'Intermediate' },
  { id: 's4', title: 'Master audio mixing fundamentals', tools: 'Cubase', difficulty: 'Advanced' },
]

const colorClasses: Record<string, { active: string; idle: string }> = {
  blue:    { active: 'bg-blue-500/20 border-blue-500/40 text-blue-400',    idle: 'bg-[#16161F] border-[#2A2A3A] text-[#888899] hover:border-blue-500/30 hover:text-blue-300' },
  emerald: { active: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', idle: 'bg-[#16161F] border-[#2A2A3A] text-[#888899] hover:border-emerald-500/30 hover:text-emerald-300' },
  violet:  { active: 'bg-violet-500/20 border-violet-500/40 text-violet-400',  idle: 'bg-[#16161F] border-[#2A2A3A] text-[#888899] hover:border-violet-500/30 hover:text-violet-300' },
  amber:   { active: 'bg-amber-500/20 border-amber-500/40 text-amber-400',   idle: 'bg-[#16161F] border-[#2A2A3A] text-[#888899] hover:border-amber-500/30 hover:text-amber-300' },
  cyan:    { active: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',    idle: 'bg-[#16161F] border-[#2A2A3A] text-[#888899] hover:border-cyan-500/30 hover:text-cyan-300' },
  rose:    { active: 'bg-rose-500/20 border-rose-500/40 text-rose-400',    idle: 'bg-[#16161F] border-[#2A2A3A] text-[#888899] hover:border-rose-500/30 hover:text-rose-300' },
}

export default function Play() {
  const { playMessages, addPlayMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [playMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    addPlayMessage({ id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() })
    setLoading(true)
    try {
      const tool = tools.find((t) => t.id === activeTool)
      const context = tool
        ? `You are an AI mentor helping the user experiment with ${tool.label}. Be practical and guide them step-by-step.`
        : 'You are an AI mentor helping the user explore creative and professional tools. Be practical and encouraging.'
      const answer = await askGemini(msg, context)
      addPlayMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: answer, timestamp: new Date() })
    } catch {
      addPlayMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: 'Unable to reach the AI mentor.', timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  const activeToolData = tools.find((t) => t.id === activeTool)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="w-64 bg-[#111118] border-r border-[#1E1E2E] flex flex-col shrink-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-[#1E1E2E] sticky top-0 bg-[#111118] z-10">
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-white">Sandbox</span>
          </div>
          <p className="text-xs text-[#555566] mt-0.5">Experiment with AI as mentor</p>
        </div>

        <div className="p-3">
          <p className="text-xs text-[#555566] uppercase tracking-wider mb-2 px-1">Tools</p>
          <div className="grid grid-cols-2 gap-1.5">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = activeTool === tool.id
              const classes = colorClasses[tool.color]
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(isActive ? null : tool.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${isActive ? classes.active : classes.idle}`}
                >
                  <Icon size={15} className="mb-1.5" />
                  <p className="text-xs font-medium leading-tight">{tool.label}</p>
                  <p className="text-[10px] opacity-50 mt-0.5">{tool.badge}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-3 border-t border-[#1E1E2E]">
          <p className="text-xs text-[#555566] uppercase tracking-wider mb-2 px-1">Scenarios</p>
          <div className="space-y-1.5">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setInput(`I want to: ${s.title}. Help me get started step by step.`)}
                className="w-full p-3 rounded-lg bg-[#16161F] border border-[#2A2A3A] hover:border-violet-500/30 text-left transition-all group"
              >
                <p className="text-xs font-medium text-white leading-tight group-hover:text-violet-300">{s.title}</p>
                <p className="text-[10px] text-[#555566] mt-1">{s.tools} · {s.difficulty}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Mentor chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-[#1E1E2E] shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-white">AI Mentor</span>
            {activeToolData && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs">
                {activeToolData.label}
              </span>
            )}
          </div>
          <p className="text-xs text-[#555566] mt-0.5">
            {activeToolData ? `Experimenting with ${activeToolData.label}` : 'Select a tool or scenario to begin'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {playMessages.length === 0 && (
            <div className="max-w-lg">
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-violet-400" />
                  <span className="text-xs font-semibold text-violet-400">Your AI Mentor is ready</span>
                </div>
                <p className="text-xs text-[#CCCCDD] leading-relaxed">
                  Select a tool from the panel to start experimenting, pick a pre-built scenario, or just ask me anything. I'll guide you step-by-step using knowledge from the Learn hub.
                </p>
              </div>
            </div>
          )}

          {playMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                  <Brain size={12} className="text-violet-400" />
                </div>
              )}
              <div className={`max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-500/20 text-violet-100 ml-8'
                  : 'bg-[#111118] border border-[#1E1E2E] text-[#CCCCDD]'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                <Brain size={12} className="text-violet-400" />
              </div>
              <div className="flex gap-1 px-4 py-3 rounded-xl bg-[#111118] border border-[#1E1E2E]">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="px-6 py-4 border-t border-[#1E1E2E] shrink-0">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeToolData ? `Ask about ${activeToolData.label}...` : 'Ask your AI mentor...'}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#111118] border border-[#1E1E2E] text-sm text-white placeholder-[#555566] focus:outline-none focus:border-violet-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 disabled:opacity-40 text-violet-400 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
