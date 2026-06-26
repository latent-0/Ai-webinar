import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Radio, Plus, Users, Clock, ArrowRight, Copy, Check, ChevronDown, Brain } from 'lucide-react'
import { useAppStore } from '../store'
import { generateRoomId, formatDate } from '../lib/utils'

const AI_PROVIDERS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google', badge: 'Default' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', provider: 'Anthropic', badge: 'Most Capable' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic', badge: 'Balanced' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'Anthropic', badge: 'Fast' },
]

export default function Live() {
  const navigate = useNavigate()
  const { rooms, addRoom, displayName, setDisplayName, liveAiModel, setLiveAiModel } = useAppStore()
  const [newRoomName, setNewRoomName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [name, setName] = useState(displayName)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [modelOpen, setModelOpen] = useState(false)

  const selectedModel = AI_PROVIDERS.find((m) => m.id === liveAiModel) ?? AI_PROVIDERS[0]

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newRoomName.trim()) return
    setDisplayName(name || 'Guest')
    const id = generateRoomId()
    addRoom({ id, name: newRoomName, participants: 1, createdAt: new Date(), isActive: true })
    navigate({ to: '/live/$roomId', params: { roomId: id } })
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinId.trim()) return
    setDisplayName(name || 'Guest')
    navigate({ to: '/live/$roomId', params: { roomId: joinId.trim() } })
  }

  async function copyId(id: string) {
    await navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
          <Radio size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Live Sessions</h1>
          <p className="text-sm text-[var(--muted)]">Host or join interactive AI-powered webinars</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Create Room */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <Plus size={16} className="text-indigo-600" /> Create a session
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--faint)] focus:outline-none focus:border-indigo-400"
            />
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Session title..."
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--faint)] focus:outline-none focus:border-indigo-400"
            />

            {/* AI Model selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{selectedModel.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium shrink-0">{selectedModel.provider}</span>
                </div>
                <ChevronDown size={14} className={`text-[var(--faint)] transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
              </button>
              {modelOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                  {AI_PROVIDERS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setLiveAiModel(m.id); setModelOpen(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-[var(--bg)] transition-colors ${m.id === liveAiModel ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400' : 'text-[var(--text-2)]'}`}
                    >
                      <span>{m.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[var(--faint)]">{m.provider}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${m.id === liveAiModel ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-[var(--surface-3)] text-[var(--muted)]'}`}>{m.badge}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!newRoomName.trim()}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Create & Start
            </button>
          </form>
        </div>

        {/* Join Room */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
            <ArrowRight size={16} className="text-indigo-600" /> Join a session
          </h2>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--faint)] focus:outline-none focus:border-indigo-400"
            />
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Room ID or link..."
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--faint)] focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={!joinId.trim()}
              className="w-full py-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-2)] text-sm font-medium transition-colors border border-[var(--border)]"
            >
              Join Session
            </button>
          </form>
        </div>
      </div>

      {/* Rooms list */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--faint)] uppercase tracking-wider mb-3">Sessions</h2>
        <div className="space-y-2">
          {rooms.length === 0 && (
            <p className="text-sm text-[var(--faint)] py-4">No sessions yet. Create one above.</p>
          )}
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all group">
              <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-indigo-500 animate-pulse' : 'bg-[var(--border)]'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{room.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-[var(--faint)]">
                    <Users size={11} /> {room.participants}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[var(--faint)]">
                    <Clock size={11} /> {formatDate(room.createdAt)}
                  </span>
                  <button
                    onClick={() => copyId(room.id)}
                    className="flex items-center gap-1 text-xs text-[var(--faint)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {copiedId === room.id ? <Check size={11} /> : <Copy size={11} />}
                    {room.id}
                  </button>
                </div>
              </div>
              {room.isActive && (
                <Link
                  to="/live/$roomId"
                  params={{ roomId: room.id }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
                >
                  Join
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
