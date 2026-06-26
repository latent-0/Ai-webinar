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
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Topic sidebar */}
      <div className="w-52 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-[var(--text)]">Knowledge Hub</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-[var(--faint)] uppercase tracking-wider mb-2 px-1">Topics</p>
          <div className="space-y-0.5">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTopic(t.id); setLearningPath(null) }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors ${
                  activeTopic === t.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
                }`}
              >
                <Hash size={12} className="shrink-0" />
                <span className="text-xs font-medium truncate">{t.label}</span>
              </button>
            ))}
          </div>
          {activeTopic && (
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <button
                onClick={generatePath}
                disabled={pathLoading}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
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
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <h1 className="text-sm font-semibold text-[var(--text)]">
            {activeTopicData ? activeTopicData.label : 'All Topics'}
          </h1>
          <p className="text-xs text-[var(--faint)]">
            {activeTopicData ? activeTopicData.desc : 'Ask anything across any domain'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {learnMessages.length === 0 && !learningPath && (
            <div className="max-w-xl">
              <p className="text-xs text-[var(--faint)] mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs text-[var(--muted)] hover:text-emerald-700 dark:hover:text-emerald-400 border border-[var(--border)] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {learningPath && (
            <div className="max-w-2xl p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">AI Learning Path</span>
              </div>
              <p className="text-xs text-[var(--text-2)] leading-relaxed whitespace-pre-line">{learningPath}</p>
            </div>
          )}

          {learnMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                  <Brain size={12} className="text-emerald-600" />
                </div>
              )}
              <div className={`max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white ml-8'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                <Brain size={12} className="text-emerald-600" />
              </div>
              <div className="flex gap-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTopicData ? `Ask about ${activeTopicData.label}...` : 'Ask anything...'}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--faint)] focus:outline-none focus:border-emerald-400"
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
