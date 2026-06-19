import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Radio, Plus, Users, Clock, ArrowRight, Copy, Check } from 'lucide-react'
import { useAppStore } from '../store'
import { generateRoomId, formatDate } from '../lib/utils'

export default function Live() {
  const navigate = useNavigate()
  const { rooms, addRoom, displayName, setDisplayName } = useAppStore()
  const [newRoomName, setNewRoomName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [name, setName] = useState(displayName)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Radio size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Live Sessions</h1>
          <p className="text-sm text-[#888899]">Host or join interactive AI-powered webinars</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Create Room */}
        <div className="p-6 rounded-xl bg-[#111118] border border-[#1E1E2E]">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Plus size={16} className="text-blue-400" /> Create a session
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              className="w-full px-3 py-2.5 rounded-lg bg-[#16161F] border border-[#2A2A3A] text-sm text-white placeholder-[#555566] focus:outline-none focus:border-blue-500/50"
            />
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Session title..."
              className="w-full px-3 py-2.5 rounded-lg bg-[#16161F] border border-[#2A2A3A] text-sm text-white placeholder-[#555566] focus:outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={!newRoomName.trim()}
              className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Create & Start
            </button>
          </form>
        </div>

        {/* Join Room */}
        <div className="p-6 rounded-xl bg-[#111118] border border-[#1E1E2E]">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRight size={16} className="text-blue-400" /> Join a session
          </h2>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              className="w-full px-3 py-2.5 rounded-lg bg-[#16161F] border border-[#2A2A3A] text-sm text-white placeholder-[#555566] focus:outline-none focus:border-blue-500/50"
            />
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Room ID or link..."
              className="w-full px-3 py-2.5 rounded-lg bg-[#16161F] border border-[#2A2A3A] text-sm text-white placeholder-[#555566] focus:outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={!joinId.trim()}
              className="w-full py-2.5 rounded-lg bg-[#1E1E2E] hover:bg-[#2A2A3A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors border border-[#2A2A3A]"
            >
              Join Session
            </button>
          </form>
        </div>
      </div>

      {/* Rooms list */}
      <div>
        <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-wider mb-3">Sessions</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center gap-4 p-4 rounded-lg bg-[#111118] border border-[#1E1E2E] hover:border-[#2A2A3A] transition-colors group">
              <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-blue-400 animate-pulse' : 'bg-[#333344]'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{room.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-[#555566]">
                    <Users size={11} /> {room.participants}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#555566]">
                    <Clock size={11} /> {formatDate(room.createdAt)}
                  </span>
                  <button
                    onClick={() => copyId(room.id)}
                    className="flex items-center gap-1 text-xs text-[#555566] hover:text-white transition-colors"
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
                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium transition-colors opacity-0 group-hover:opacity-100"
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
