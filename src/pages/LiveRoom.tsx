import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { X, Brain, Send, ChevronRight, Users, ExternalLink } from 'lucide-react'
import { useAppStore } from '../store'
import { askGemini } from '../lib/gemini'
import { askClaude } from '../lib/claude'

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => {
      addEventListeners: (listeners: Record<string, () => void>) => void
      executeCommand: (cmd: string, ...args: unknown[]) => void
      isAudioMuted: () => Promise<boolean>
      isVideoMuted: () => Promise<boolean>
      dispose: () => void
    }
  }
}

export default function LiveRoom() {
  const { roomId } = useParams({ from: '/live/$roomId' })
  const navigate = useNavigate()
  const { displayName, liveAiMessages, addLiveAiMessage, liveAiModel } = useAppStore()

  const [question, setQuestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [participantCount, setParticipantCount] = useState(1)
  const [jitsiLoaded, setJitsiLoaded] = useState(false)
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef = useRef<InstanceType<typeof window.JitsiMeetExternalAPI> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [liveAiMessages])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => setJitsiLoaded(true)
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    if (!jitsiLoaded || !jitsiContainerRef.current) return

    const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName: `sandbox-live-${roomId}`,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      userInfo: { displayName: displayName || 'Guest', email: '' },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        MOBILE_APP_PROMO: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
      },
    })

    api.addEventListeners({
      participantJoined: () => setParticipantCount((c) => c + 1),
      participantLeft: () => setParticipantCount((c) => Math.max(1, c - 1)),
    })

    jitsiApiRef.current = api
    return () => { api.dispose() }
  }, [jitsiLoaded, roomId, displayName])

  async function sendQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || aiLoading) return
    const q = question.trim()
    setQuestion('')
    addLiveAiMessage({ id: Date.now().toString(), role: 'user', content: q, timestamp: new Date() })
    setAiLoading(true)
    try {
      const context = `Live webinar session: ${roomId}`
      const answer = liveAiModel.startsWith('claude-')
        ? await askClaude(q, context, liveAiModel)
        : await askGemini(q, context)
      addLiveAiMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: answer, timestamp: new Date() })
    } catch {
      addLiveAiMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: 'Unable to process at this time.', timestamp: new Date() })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Meeting area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8E8EF] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-medium text-[#111827] truncate max-w-xs">{roomId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-[#6B7280] px-3 py-1.5 rounded-full bg-[#F7F7FA] border border-[#E8E8EF]">
              <Users size={12} /> {participantCount}
            </span>
            <a
              href={`https://meet.jit.si/sandbox-live-${roomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] hover:text-[#111827] transition-colors"
              title="Open in full screen"
            >
              <ExternalLink size={15} />
            </a>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#F7F7FA] transition-colors"
            >
              <Brain size={16} className={sidebarOpen ? 'text-indigo-600' : 'text-[#6B7280]'} />
            </button>
            <button
              onClick={() => navigate({ to: '/live' })}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#6B7280] hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={jitsiContainerRef} className="flex-1 bg-[#F7F7FA]">
          {!jitsiLoaded && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#6B7280]">Connecting to meeting...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-white border-l border-[#E8E8EF] flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E8E8EF]">
            <Brain size={16} className="text-indigo-600" />
            <span className="text-sm font-semibold text-[#111827]">AI Assistant</span>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-[#9CA3AF] hover:text-[#111827] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {liveAiMessages.length === 0 && (
              <div className="text-center py-8">
                <Brain size={32} className="text-[#E8E8EF] mx-auto mb-3" />
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  Ask the AI anything during your session — questions are answered in real time.
                </p>
              </div>
            )}
            {liveAiMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#F7F7FA] border border-[#E8E8EF] text-[#374151]'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF]">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendQuestion} className="p-3 border-t border-[#E8E8EF]">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask the AI..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={!question.trim() || aiLoading}
                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-600 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
