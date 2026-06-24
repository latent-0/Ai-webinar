import { useState, useRef, useEffect } from 'react'
import { Gamepad2, Send, Brain, Sparkles, Image, Table, Layers, Wrench, Code, Puzzle, ChevronDown } from 'lucide-react'
import { useAppStore } from '../store'
import { askGemini } from '../lib/gemini'
import { askClaude, CLAUDE_MODELS } from '../lib/claude'

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
  blue:    { active: 'bg-blue-50 border-blue-200 text-blue-700',       idle: 'bg-white border-[#E8E8EF] text-[#6B7280] hover:border-blue-200 hover:text-blue-600' },
  emerald: { active: 'bg-emerald-50 border-emerald-200 text-emerald-700', idle: 'bg-white border-[#E8E8EF] text-[#6B7280] hover:border-emerald-200 hover:text-emerald-600' },
  violet:  { active: 'bg-violet-50 border-violet-200 text-violet-700',   idle: 'bg-white border-[#E8E8EF] text-[#6B7280] hover:border-violet-200 hover:text-violet-600' },
  amber:   { active: 'bg-amber-50 border-amber-200 text-amber-700',    idle: 'bg-white border-[#E8E8EF] text-[#6B7280] hover:border-amber-200 hover:text-amber-600' },
  cyan:    { active: 'bg-cyan-50 border-cyan-200 text-cyan-700',      idle: 'bg-white border-[#E8E8EF] text-[#6B7280] hover:border-cyan-200 hover:text-cyan-600' },
  rose:    { active: 'bg-rose-50 border-rose-200 text-rose-700',      idle: 'bg-white border-[#E8E8EF] text-[#6B7280] hover:border-rose-200 hover:text-rose-600' },
}

type AIProvider = 'gemini' | 'claude'

const AI_PROVIDERS = [
  { id: 'gemini' as AIProvider, label: 'Gemini 2.5 Flash', badge: 'Google' },
  ...CLAUDE_MODELS.map((m) => ({ id: 'claude' as AIProvider, label: m.label, badge: 'Anthropic', modelId: m.id })),
]

export default function Play() {
  const { playMessages, addPlayMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [selectedAI, setSelectedAI] = useState(AI_PROVIDERS[0])
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false)
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
      let answer: string
      if (selectedAI.id === 'claude' && 'modelId' in selectedAI) {
        answer = await askClaude(msg, context, selectedAI.modelId)
      } else {
        answer = await askGemini(msg, context)
      }
      addPlayMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: answer, timestamp: new Date() })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      addPlayMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: `Error: ${msg}`, timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  const activeToolData = tools.find((t) => t.id === activeTool)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7FA]">
      {/* Left panel */}
      <div className="w-64 bg-white border-r border-[#E8E8EF] flex flex-col shrink-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-[#E8E8EF] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-violet-600" />
            <span className="text-sm font-semibold text-[#111827]">Sandbox</span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Experiment with AI as mentor</p>
        </div>

        <div className="p-3">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-2 px-1">Tools</p>
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
                  <p className="text-[10px] opacity-60 mt-0.5">{tool.badge}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-3 border-t border-[#E8E8EF]">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-2 px-1">Scenarios</p>
          <div className="space-y-1.5">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setInput(`I want to: ${s.title}. Help me get started step by step.`)}
                className="w-full p-3 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] hover:border-violet-200 text-left transition-all group"
              >
                <p className="text-xs font-medium text-[#111827] leading-tight group-hover:text-violet-700">{s.title}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">{s.tools} · {s.difficulty}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Mentor chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-[#E8E8EF] bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-violet-600" />
            <span className="text-sm font-semibold text-[#111827]">AI Mentor</span>
            {activeToolData && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs border border-violet-100">
                {activeToolData.label}
              </span>
            )}
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {activeToolData ? `Experimenting with ${activeToolData.label}` : 'Select a tool or scenario to begin'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {playMessages.length === 0 && (
            <div className="max-w-lg">
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-violet-600" />
                  <span className="text-xs font-semibold text-violet-700">Your AI Mentor is ready</span>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed">
                  Select a tool from the panel to start experimenting, pick a pre-built scenario, or just ask me anything. I'll guide you step-by-step.
                </p>
              </div>
            </div>
          )}

          {playMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                  <Brain size={12} className="text-violet-600" />
                </div>
              )}
              <div className={`max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white ml-8'
                  : 'bg-white border border-[#E8E8EF] text-[#374151] shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <Brain size={12} className="text-violet-600" />
              </div>
              <div className="flex gap-1 px-4 py-3 rounded-xl bg-white border border-[#E8E8EF] shadow-sm">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="px-6 py-4 border-t border-[#E8E8EF] bg-white shrink-0">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeToolData ? `Ask about ${activeToolData.label}...` : 'Ask your AI mentor...'}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-violet-400"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setAiDropdownOpen(!aiDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-xs text-[#374151] hover:border-violet-300 transition-colors whitespace-nowrap"
              >
                <span className="font-medium">{selectedAI.label}</span>
                <span className="text-[10px] text-[#9CA3AF]">{selectedAI.badge}</span>
                <ChevronDown size={12} className="text-[#9CA3AF]" />
              </button>
              {aiDropdownOpen && (
                <div className="absolute bottom-full right-0 mb-1 w-56 bg-white border border-[#E8E8EF] rounded-lg shadow-lg z-10 overflow-hidden">
                  {AI_PROVIDERS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedAI(p); setAiDropdownOpen(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-[#F7F7FA] transition-colors ${selectedAI.label === p.label ? 'bg-violet-50 text-violet-700' : 'text-[#374151]'}`}
                    >
                      <span className="font-medium">{p.label}</span>
                      <span className="text-[10px] text-[#9CA3AF] ml-2">{p.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
