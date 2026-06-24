import { useState, useRef, useEffect } from 'react'
import { BookOpen, Send, Brain, Hash, Sparkles } from 'lucide-react'
import { useAppStore } from '../store'
import { askGemini, generateLearningPath } from '../lib/gemini'

const topics = [
  { id: 'ai', label: 'Artificial Intelligence', desc: 'ML & AI concepts' },
  { id: 'audit', label: 'Auditing', desc: 'Financial & compliance' },
  { id: 'dental', label: 'Dentistry', desc: 'Clinical dental practice' },
  { id: 'science', label: 'Science', desc: 'Research methods' },
  { id: 'law', label: 'Legal', desc: 'Contract law & compliance' },
  { id: 'marketing', label: 'Marketing', desc: 'Digital strategy' },
]

const suggestions = [
  'Explain RAG in simple terms',
  'What are best practices for dental implants?',
  'How does a financial audit work?',
  'What is prompt engineering?',
]

export default function Learn() {
  const { learnMessages, addLearnMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [pathLoading, setPathLoading] = useState(false)
  const [learningPath, setLearningPath] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [learnMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    addLearnMessage({ id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() })
    setLoading(true)
    try {
      const context = activeTopic ? `The user is learning about: ${topics.find((t) => t.id === activeTopic)?.label}` : undefined
      const answer = await askGemini(msg, context)
      addLearnMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: answer, timestamp: new Date() })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      addLearnMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: `Error: ${msg}`, timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  async function generatePath() {
    if (!activeTopic || pathLoading) return
    setPathLoading(true)
    const topicLabel = topics.find((t) => t.id === activeTopic)?.label || activeTopic
    try {
      const path = await generateLearningPath(topicLabel)
      setLearningPath(path)
    } finally {
      setPathLoading(false)
    }
  }

  const activeTopicData = topics.find((t) => t.id === activeTopic)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7FA]">
      {/* Topic sidebar */}
      <div className="w-52 bg-white border-r border-[#E8E8EF] flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-[#E8E8EF]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-[#111827]">Knowledge Hub</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-2 px-1">Topics</p>
          <div className="space-y-0.5">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTopic(t.id); setLearningPath(null) }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors ${
                  activeTopic === t.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-[#6B7280] hover:bg-[#F7F7FA] hover:text-[#111827]'
                }`}
              >
                <Hash size={12} className="shrink-0" />
                <span className="text-xs font-medium truncate">{t.label}</span>
              </button>
            ))}
          </div>
          {activeTopic && (
            <div className="mt-4 pt-3 border-t border-[#E8E8EF]">
              <button
                onClick={generatePath}
                disabled={pathLoading}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Sparkles size={12} />
                {pathLoading ? 'Generating...' : 'Generate learning path'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-[#E8E8EF] bg-white shrink-0">
          <h1 className="text-sm font-semibold text-[#111827]">
            {activeTopicData ? activeTopicData.label : 'All Topics'}
          </h1>
          <p className="text-xs text-[#9CA3AF]">
            {activeTopicData ? activeTopicData.desc : 'Ask anything across any domain'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {learnMessages.length === 0 && !learningPath && (
            <div className="max-w-xl">
              <p className="text-xs text-[#9CA3AF] mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-xs text-[#6B7280] hover:text-emerald-700 border border-[#E8E8EF] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {learningPath && (
            <div className="max-w-2xl p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">AI Learning Path</span>
              </div>
              <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-line">{learningPath}</p>
            </div>
          )}

          {learnMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                  <Brain size={12} className="text-emerald-600" />
                </div>
              )}
              <div className={`max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white ml-8'
                  : 'bg-white border border-[#E8E8EF] text-[#374151] shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Brain size={12} className="text-emerald-600" />
              </div>
              <div className="flex gap-1 px-4 py-3 rounded-xl bg-white border border-[#E8E8EF] shadow-sm">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
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
              placeholder={activeTopicData ? `Ask about ${activeTopicData.label}...` : 'Ask anything...'}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
