import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { X, Brain, Send, ChevronRight, Users, ExternalLink } from 'lucide-react'
import { useAppStore } from '../store'
import { askGemini } from '../lib/gemini'

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => {
      addEventListeners: (listeners: Record<string, () => void>) => void
      dispose: () => void
    }
  }
}

export default function LiveRoom() {
  const { roomId } = useParams({ from: '/live/$roomId' })
  const navigate = useNavigate()
  const { displayName, liveAiMessages, addLiveAiMessage } = useAppStore()

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
      const answer = await askGemini(q, `Live webinar session: ${roomId}`)
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
        <div className="flex items-center justify-between px-4 py-3 bg-[#111118] border-b border-[#1E1E2E] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-white truncate max-w-xs">{roomId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-[#888899] px-3 py-1.5 rounded-full bg-[#1E1E2E]">
              <Users size={12} /> {participantCount}
            </span>
            <a
              href={`https://meet.jit.si/sandbox-live-${roomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-[#1E1E2E] text-[#888899] hover:text-white transition-colors"
              title="Open in full screen"
            >
              <ExternalLink size={15} />
            </a>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#1E1E2E] transition-colors"
            >
              <Brain size={16} className={sidebarOpen ? 'text-blue-400' : 'text-[#888899]'} />
            </button>
            <button
              onClick={() => navigate({ to: '/live' })}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#888899] hover:text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={jitsiContainerRef} className="flex-1 bg-[#0A0A0F]">
          {!jitsiLoaded && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#888899]">Connecting to meeting...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-[#111118] border-l border-[#1E1E2E] flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E1E2E]">
            <Brain size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">AI Assistant</span>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-[#555566] hover:text-white">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {liveAiMessages.length === 0 && (
              <div className="text-center py-8">
                <Brain size={32} className="text-[#2A2A3A] mx-auto mb-3" />
                <p className="text-xs text-[#555566] leading-relaxed">
                  Ask the AI anything during your session — questions are answered in real time.
                </p>
              </div>
            )}
            {liveAiMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-500/20 text-blue-100'
                    : 'bg-[#16161F] border border-[#2A2A3A] text-[#CCCCDD]'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-[#16161F] border border-[#2A2A3A]">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendQuestion} className="p-3 border-t border-[#1E1E2E]">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask the AI..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#16161F] border border-[#2A2A3A] text-xs text-white placeholder-[#555566] focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="submit"
                disabled={!question.trim() || aiLoading}
                className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-40 text-blue-400 transition-colors"
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
