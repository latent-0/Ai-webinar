import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Zap, Share2, Save, Bell, MoreHorizontal,
  Layers, Ruler, Grid3X3, Magnet, Crosshair, ExternalLink, Lock, Settings,
  Play, MousePointer2, Type, Square, Maximize2,
  FileText, Sparkles, Lightbulb, MessageSquare, Package,
  Send, Users, Brain, Plus, X, Minus, ChevronDown,
  GitBranch,
} from 'lucide-react'
import { useAppStore } from '../store'
import { askGemini } from '../lib/gemini'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMsg { id: string; user: string; avatar: string; time: string; content: string }
interface LearnMsg { id: string; role: 'user' | 'assistant'; content: string }

// ─── Constants ──────────────────────────────────────────────────────────────

const LAYOUTS = [
  { id: 'presenter', label: 'Presenter Focus' },
  { id: 'canvas',    label: 'Canvas Focus'    },
  { id: 'learn',     label: 'Learn Focus'     },
  { id: 'play',      label: 'Play Focus'      },
  { id: 'balanced',  label: 'Balanced'        },
  { id: 'workshop',  label: 'Workshop'        },
  { id: 'copilot',   label: 'Co-Pilot'        },
  { id: 'dual',      label: 'Dual Canvas'     },
  { id: 'research',  label: 'Research Mode'   },
  { id: 'build',     label: 'Build Mode'      },
]

const NODES = [
  { id: 'brief',    x: 60,  y: 60,  w: 165, h: 115, title: 'Brief',    tag: '#creative-brief',  color: 'indigo',  icon: FileText,      preview: 'text',    badge: null  },
  { id: 'insight',  x: 300, y: 60,  w: 165, h: 115, title: 'Insight',  tag: '#research',         color: 'violet',  icon: Sparkles,      preview: 'metric',  badge: null  },
  { id: 'concept',  x: 540, y: 60,  w: 165, h: 115, title: 'Concept',  tag: '#ideation',         color: 'emerald', icon: Lightbulb,     preview: 'images',  badge: 'AI'  },
  { id: 'prompt',   x: 60,  y: 265, w: 165, h: 115, title: 'Prompt',   tag: '#prompt-v1',        color: 'indigo',  icon: MessageSquare, preview: 'text2',   badge: 'v2'  },
  { id: 'generate', x: 300, y: 265, w: 165, h: 115, title: 'Generate', tag: '#midjourney',       color: 'violet',  icon: Zap,           preview: 'images2', badge: null  },
  { id: 'output',   x: 540, y: 265, w: 165, h: 115, title: 'Output',   tag: '#campaign-assets',  color: 'emerald', icon: Package,       preview: 'image3',  badge: null  },
]

const EDGES = [
  { from: 'brief', to: 'insight' }, { from: 'insight', to: 'concept' },
  { from: 'prompt', to: 'generate' }, { from: 'generate', to: 'output' },
  { from: 'brief', to: 'prompt' }, { from: 'insight', to: 'generate' },
  { from: 'concept', to: 'output' },
]

const INIT_CHAT: ChatMsg[] = [
  { id: '1', user: 'Sophie', avatar: 'S', time: '10:34 AM', content: 'This workflow is 🔥'             },
  { id: '2', user: 'Alex',   avatar: 'A', time: '10:34 AM', content: 'Can you show the prompt again?' },
  { id: '3', user: 'Jordan', avatar: 'J', time: '10:25 AM', content: 'Loving the canvas!'              },
  { id: '4', user: 'Taylor', avatar: 'T', time: '10:25 AM', content: 'What model are you using?'      },
]

const AVATAR_COLORS: Record<string, string> = {
  S: 'bg-rose-500', A: 'bg-indigo-500', J: 'bg-emerald-500', T: 'bg-amber-500',
}

const NODE_STYLES: Record<string, { bg: string; border: string; iconBg: string; iconColor: string; tagBg: string; tagText: string; dot: string }> = {
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  tagBg: 'bg-indigo-100',  tagText: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  iconBg: 'bg-violet-100',  iconColor: 'text-violet-600',  tagBg: 'bg-violet-100',  tagText: 'text-violet-700',  dot: 'bg-violet-500'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', dot: 'bg-emerald-500' },
}

function getEdgePath(from: typeof NODES[0], to: typeof NODES[0]) {
  if (Math.abs(from.y - to.y) < 30) {
    const x1 = from.x + from.w, y1 = from.y + from.h / 2
    const x2 = to.x, y2 = to.y + to.h / 2
    const mx = (x1 + x2) / 2
    return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
  }
  const x1 = from.x + from.w / 2, y1 = from.y + from.h
  const x2 = to.x + to.w / 2, y2 = to.y
  const my = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`
}

function NodePreview({ type }: { type: string }) {
  if (type === 'text') return (
    <div className="space-y-1.5 px-0.5">
      <div className="h-1.5 bg-gray-200 rounded-full w-full" />
      <div className="h-1.5 bg-gray-200 rounded-full w-4/5" />
      <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
    </div>
  )
  if (type === 'text2') return (
    <p className="text-[10px] text-[#6B7280] leading-relaxed line-clamp-3">High energy, cinematic, futuristic...</p>
  )
  if (type === 'metric') return (
    <div>
      <p className="text-[10px] font-medium text-[#374151] mb-1.5">Generate insights</p>
      <div className="flex gap-1.5">
        <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[9px] font-semibold">2</span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px]">2</span>
      </div>
    </div>
  )
  if (type === 'images') return (
    <div className="flex gap-1">
      <div className="flex-1 h-12 rounded" style={{ background: 'linear-gradient(135deg,#374151,#111827)' }} />
      <div className="flex-1 h-12 rounded" style={{ background: 'linear-gradient(135deg,#4B5563,#1f2937)' }} />
    </div>
  )
  if (type === 'images2') return (
    <div className="flex gap-1">
      <div className="flex-1 h-12 rounded" style={{ background: 'radial-gradient(ellipse at 40% 50%,#334155,#0f172a)' }} />
      <div className="flex-1 h-12 rounded" style={{ background: 'radial-gradient(ellipse at 60% 50%,#1e3a5f,#0f172a)' }} />
    </div>
  )
  if (type === 'image3') return (
    <div className="h-14 rounded" style={{ background: 'radial-gradient(ellipse at center,#1e3a5f,#0a0a0a)' }} />
  )
  return null
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Workspace() {
  const { roomId } = useParams({ from: '/live/$roomId' })
  const navigate = useNavigate()
  const { displayName } = useAppStore()

  const [activeNav, setActiveNav]         = useState<'live' | 'learn' | 'play'>('live')
  const [activeLayout, setActiveLayout]   = useState('canvas')
  const [activeLearnTab, setLearnTab]     = useState<'notes' | 'transcript' | 'sources'>('notes')
  const [activePlayTab, setPlayTab]       = useState<'api' | 'prompts' | 'models' | 'tools'>('api')
  const [snapOn, setSnapOn]               = useState(true)
  const [infiniteCanvas, setInfiniteCanvas] = useState(true)
  const [zoom, setZoom]                   = useState(100)
  const [chatMsgs, setChatMsgs]           = useState<ChatMsg[]>(INIT_CHAT)
  const [chatInput, setChatInput]         = useState('')
  const [chatLoading, setChatLoading]     = useState(false)
  const [learnMsgs, setLearnMsgs]         = useState<LearnMsg[]>([])
  const [learnInput, setLearnInput]       = useState('')
  const [learnLoading, setLearnLoading]   = useState(false)
  const [apiBody, setApiBody]             = useState('{\n  "prompt": "Futuristic race car, motion blur, cinematic",\n  "style": "cinematic",\n  "ar": "16:9"\n}')
  const [apiLoading, setApiLoading]       = useState(false)
  const [apiResponse, setApiResponse]     = useState<string | null>(null)

  const chatEndRef  = useRef<HTMLDivElement>(null)
  const learnEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) },  [chatMsgs])
  useEffect(() => { learnEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [learnMsgs])

  async function sendChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const text = chatInput.trim(); setChatInput('')
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setChatMsgs((m) => [...m, { id: Date.now().toString(), user: displayName || 'You', avatar: (displayName || 'Y')[0].toUpperCase(), time: now, content: text }])
    setChatLoading(true)
    try {
      const reply = await askGemini(text, 'You are a helpful assistant in a live webinar. Be concise.')
      setChatMsgs((m) => [...m, { id: (Date.now()+1).toString(), user: 'AI', avatar: 'AI', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), content: reply }])
    } finally { setChatLoading(false) }
  }

  async function askLearn(e: React.FormEvent) {
    e.preventDefault()
    if (!learnInput.trim() || learnLoading) return
    const q = learnInput.trim(); setLearnInput('')
    setLearnMsgs((m) => [...m, { id: Date.now().toString(), role: 'user', content: q }])
    setLearnLoading(true)
    try {
      const ans = await askGemini(q, 'You are an expert AI learning assistant. Give concise, insightful answers.')
      setLearnMsgs((m) => [...m, { id: (Date.now()+1).toString(), role: 'assistant', content: ans }])
    } finally { setLearnLoading(false) }
  }

  async function sendPlayground() {
    if (apiLoading) return
    setApiLoading(true); setApiResponse(null)
    try {
      let prompt = 'Generate creative content'
      try { const p = JSON.parse(apiBody); if (p.prompt) prompt = p.prompt } catch {}
      const resp = await askGemini(prompt, 'You are a creative AI model. Generate vivid, descriptive creative content based on the prompt.')
      setApiResponse(resp)
    } finally { setApiLoading(false) }
  }

  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]))

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-[#111827] overflow-hidden select-none">

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <div className="h-12 flex items-center px-4 border-b border-[#E8E8EF] shrink-0 gap-3 bg-white">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold">Sandbox</span>
        </div>

        <nav className="flex items-end h-full">
          {(['live','learn','play'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveNav(tab)}
              className={`flex items-center gap-1.5 px-3.5 h-full text-sm font-medium transition-colors relative ${activeNav===tab ? 'text-[#111827]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}
            >
              {tab==='live' && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"/><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"/></span>}
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
              {activeNav===tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-t-full"/>}
            </button>
          ))}
        </nav>

        <div className="flex-1"/>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8EF] hover:bg-[#F7F7FA] text-sm font-medium text-[#374151] transition-colors">
          <GitBranch size={13} className="text-indigo-500"/> Priority Mix <ChevronDown size={11} className="text-[#9CA3AF]"/>
        </button>
        <div className="w-px h-5 bg-[#E8E8EF]"/>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#F7F7FA] text-sm font-medium text-[#374151] transition-colors">
          <Share2 size={13}/> Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#F7F7FA] text-sm font-medium text-[#374151] transition-colors">
          <Save size={13}/> Save layout
        </button>
        <button className="p-2 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] transition-colors"><Grid3X3 size={14}/></button>
        <button className="p-2 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] transition-colors"><Bell size={14}/></button>
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {(displayName||'U')[0].toUpperCase()}
        </div>
        <button onClick={() => navigate({ to: '/live' })} className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-400 transition-colors ml-1">
          <X size={14}/>
        </button>
      </div>

      {/* ── Priority Mix bar ─────────────────────────────────────────────── */}
      <div className="h-[50px] border-b border-[#E8E8EF] flex items-center px-6 gap-3 shrink-0 bg-[#FAFAFA]">
        <div className="text-center w-12">
          <p className="text-[11px] font-semibold text-indigo-600 leading-tight">Live</p>
          <p className="text-[10px] text-[#9CA3AF]">60%</p>
        </div>
        <div className="flex-1 relative h-1.5">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-blue-400 to-emerald-400"/>
          <div className="absolute -top-[5px] left-[60%] -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow cursor-pointer"/>
          <div className="absolute -top-6 left-[60%] -translate-x-1/2 text-center">
            <p className="text-[11px] font-semibold text-[#374151] leading-tight">Learn</p>
            <p className="text-[10px] text-[#9CA3AF]">20%</p>
          </div>
          <div className="absolute -top-[5px] left-[80%] -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow cursor-pointer"/>
        </div>
        <div className="text-center w-12">
          <p className="text-[11px] font-semibold text-emerald-600 leading-tight">Play</p>
          <p className="text-[10px] text-[#9CA3AF]">20%</p>
        </div>
      </div>

      {/* ── Layout presets ───────────────────────────────────────────────── */}
      <div className="h-11 border-b border-[#E8E8EF] flex items-center px-4 gap-1.5 overflow-x-auto shrink-0 bg-white">
        {LAYOUTS.map((l) => (
          <button key={l.id} onClick={() => setActiveLayout(l.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${activeLayout===l.id ? 'bg-indigo-600 text-white' : 'text-[#6B7280] hover:bg-[#F7F7FA] hover:text-[#374151]'}`}
          >{l.label}</button>
        ))}
        <button className="flex-shrink-0 p-1.5 rounded-lg text-[#9CA3AF] hover:bg-[#F7F7FA] transition-colors ml-1"><MoreHorizontal size={14}/></button>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <div className="w-14 bg-white border-r border-[#E8E8EF] flex flex-col items-center py-3 gap-1 shrink-0">
          {[{icon:Layers,label:'Layout'},{icon:Ruler,label:'Rulers'},{icon:Grid3X3,label:'Grid'}].map(({icon:Icon,label}) => (
            <button key={label} className="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] hover:text-[#374151] transition-colors">
              <Icon size={15}/><span className="text-[8px] text-[#9CA3AF]">{label}</span>
            </button>
          ))}
          <button onClick={() => setSnapOn(!snapOn)} className="w-10 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg hover:bg-[#F7F7FA] transition-colors">
            <Magnet size={15} className={snapOn ? 'text-indigo-600' : 'text-[#6B7280]'}/>
            <div className={`w-7 h-3.5 rounded-full flex items-center px-0.5 transition-colors ${snapOn ? 'bg-indigo-500' : 'bg-[#D1D5DB]'}`}>
              <div className={`w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${snapOn ? 'translate-x-3.5' : ''}`}/>
            </div>
          </button>
          <div className="w-6 h-px bg-[#E8E8EF] my-1"/>
          {[{icon:Crosshair,label:'Focus'},{icon:ExternalLink,label:'Pop out'},{icon:Lock,label:'Lock'}].map(({icon:Icon,label}) => (
            <button key={label} className="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] hover:text-[#374151] transition-colors">
              <Icon size={15}/><span className="text-[8px] text-[#9CA3AF]">{label}</span>
            </button>
          ))}
          <div className="w-6 h-px bg-[#E8E8EF] my-1"/>
          <button className="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] hover:text-[#374151] transition-colors">
            <Settings size={15}/><span className="text-[8px] text-[#9CA3AF]">Settings</span>
          </button>
          <div className="flex-1"/>
          <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center"><Zap size={11} className="text-white"/></div>
        </div>

        {/* Left col: Video + Chat */}
        <div className="w-[370px] flex flex-col border-r border-[#E8E8EF] shrink-0 min-h-0">
          {/* Video */}
          <div className="h-[205px] bg-[#0f0f13] relative shrink-0 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#1f1f2e] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{(displayName||'Y')[0].toUpperCase()}</span>
              </div>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> LIVE
            </div>
            <div className="absolute bottom-3 left-3 text-[10px] text-white/50 font-mono truncate max-w-[80%]">{roomId}</div>
          </div>

          {/* Chat */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2.5 border-b border-[#E8E8EF] flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-[#111827]">Live Chat</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"/>
              <div className="flex-1"/>
              <span className="flex items-center gap-1 text-xs text-[#9CA3AF]"><Users size={11}/> 128</span>
              <button className="p-1 rounded hover:bg-[#F7F7FA] text-[#9CA3AF]"><MoreHorizontal size={13}/></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {chatMsgs.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  {msg.avatar==='AI' ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><Brain size={11} className="text-indigo-600"/></div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white ${AVATAR_COLORS[msg.avatar]||'bg-gray-400'}`}>{msg.avatar}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-[#374151]">{msg.user}</span>
                      <span className="text-[10px] text-[#9CA3AF]">{msg.time}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed mt-0.5">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center"><Brain size={11} className="text-indigo-600"/></div>
                  <div className="flex gap-1">{[0,150,300].map((d) => <span key={d} className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            <form onSubmit={sendChat} className="px-3 py-2.5 border-t border-[#E8E8EF] flex items-center gap-2 shrink-0">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Say something..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-indigo-300"
              />
              <button type="submit" disabled={!chatInput.trim()||chatLoading} className="p-1.5 rounded-lg hover:bg-indigo-50 text-[#9CA3AF] hover:text-indigo-600 disabled:opacity-40 transition-colors">
                <Send size={13}/>
              </button>
            </form>
          </div>
        </div>

        {/* Center canvas */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
          {/* Canvas toolbar */}
          <div className="h-10 border-b border-[#E8E8EF] flex items-center px-3 gap-0.5 shrink-0">
            {[{icon:Play,tip:'Run'},{icon:MousePointer2,tip:'Select'},{icon:Type,tip:'Text'},{icon:Square,tip:'Shape'},{icon:Maximize2,tip:'Expand'},{icon:Grid3X3,tip:'Grid'}].map(({icon:Icon,tip}) => (
              <button key={tip} title={tip} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280] hover:text-[#374151] transition-colors">
                <Icon size={13}/>
              </button>
            ))}
            <div className="w-px h-4 bg-[#E8E8EF] mx-1"/>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#9CA3AF] transition-colors"><MoreHorizontal size={13}/></button>
          </div>

          {/* Ruler + canvas */}
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
            {/* Vertical ruler */}
            <div className="w-5 bg-white border-r border-[#E8E8EF] shrink-0 relative overflow-hidden">
              {[100,200,300,400].map((n) => (
                <div key={n} className="absolute left-0 right-0 flex items-center justify-center" style={{top:n/2-6}}>
                  <span className="text-[8px] text-[#CACAD4] font-mono">{n}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
              {/* Horizontal ruler */}
              <div className="h-5 bg-white border-b border-[#E8E8EF] shrink-0 overflow-hidden relative">
                {[0,100,200,300,400,500,600,700,800,900,1000,1100,1200].map((n) => (
                  <div key={n} className="absolute top-0 bottom-0 flex items-center" style={{left:n/2+4}}>
                    <span className="text-[8px] text-[#CACAD4] font-mono">{n}</span>
                  </div>
                ))}
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-auto canvas-grid relative">
                <div className="relative" style={{width:800,height:480}}>
                  <svg className="absolute inset-0 pointer-events-none" width={800} height={480}>
                    {EDGES.map((edge) => {
                      const from = nodeMap[edge.from], to = nodeMap[edge.to]
                      if (!from||!to) return null
                      return <path key={`${edge.from}-${edge.to}`} d={getEdgePath(from,to)} fill="none" stroke="#D1D5DB" strokeWidth={1.5}/>
                    })}
                  </svg>

                  {NODES.map((node) => {
                    const s = NODE_STYLES[node.color]
                    const Icon = node.icon
                    return (
                      <div key={node.id} className={`absolute rounded-xl border shadow-sm cursor-grab hover:shadow-md transition-shadow overflow-visible ${s.bg} ${s.border}`}
                        style={{left:node.x,top:node.y,width:node.w,height:node.h}}
                      >
                        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${s.iconBg}`}><Icon size={11} className={s.iconColor}/></div>
                            <span className="text-xs font-semibold text-[#111827]">{node.title}</span>
                          </div>
                          {node.badge && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${node.color==='emerald'?'bg-emerald-500':'bg-indigo-500'} text-white`}>{node.badge}</span>}
                        </div>
                        <div className="px-3 pb-1.5">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${s.tagBg} ${s.tagText}`}>{node.tag}</span>
                        </div>
                        <div className="px-3 pb-2.5"><NodePreview type={node.preview}/></div>
                        <div className={`absolute top-1/2 -left-[5px] -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${s.dot}`}/>
                        <div className={`absolute top-1/2 -right-[5px] -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${s.dot}`}/>
                        <div className={`absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${s.dot}`}/>
                        <div className={`absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${s.dot}`}/>
                      </div>
                    )
                  })}

                  <button className="absolute w-8 h-8 rounded-full bg-white border-2 border-dashed border-[#D1D5DB] flex items-center justify-center text-[#9CA3AF] hover:border-indigo-400 hover:text-indigo-500 transition-colors" style={{left:360,top:440}}>
                    <Plus size={14}/>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="h-9 border-t border-[#E8E8EF] flex items-center justify-end px-4 gap-1.5 shrink-0">
            <button onClick={() => setZoom((z) => Math.max(25,z-25))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280]"><Minus size={12}/></button>
            <span className="text-xs text-[#374151] font-medium w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(200,z+25))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280]"><Plus size={12}/></button>
            <div className="w-px h-4 bg-[#E8E8EF] mx-1"/>
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280]"><Maximize2 size={12}/></button>
          </div>
        </div>

        {/* Right col: Learn + Playground */}
        <div className="w-[320px] border-l border-[#E8E8EF] flex flex-col shrink-0 min-h-0">

          {/* Learn */}
          <div className="flex flex-col border-b border-[#E8E8EF] min-h-0" style={{maxHeight:'55%'}}>
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#E8E8EF] shrink-0">
              <span className="text-sm font-bold text-[#111827] flex-1">Learn</span>
              <button onClick={() => setLearnInput('Give me the key insight from this session')}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium transition-colors">
                <Sparkles size={10}/> Ask AI
              </button>
              <button className="p-1 rounded hover:bg-[#F7F7FA] text-[#9CA3AF]"><MoreHorizontal size={13}/></button>
            </div>

            <div className="flex border-b border-[#E8E8EF] px-4 shrink-0">
              {(['notes','transcript','sources'] as const).map((tab) => (
                <button key={tab} onClick={() => setLearnTab(tab)}
                  className={`px-3 py-2 text-xs font-medium transition-colors relative ${activeLearnTab===tab?'text-indigo-600':'text-[#9CA3AF] hover:text-[#6B7280]'}`}
                >
                  {tab==='notes'?'AI Notes':tab.charAt(0).toUpperCase()+tab.slice(1)}
                  {activeLearnTab===tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"/>}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 p-4 space-y-4">
              {activeLearnTab==='notes' && learnMsgs.length===0 && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-[#374151] mb-2">Key takeaways</p>
                    <ul className="space-y-1.5">
                      {['Strong briefs lead to better AI output.','Use references to guide style and tone.','Iterate with small changes, not big jumps.','Test across models for different results.','Keep human judgment in the loop.'].map((t) => (
                        <li key={t} className="flex items-start gap-2 text-xs text-[#6B7280]">
                          <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"/>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#374151] mb-1.5">Summary</p>
                    <p className="text-xs text-[#6B7280] leading-relaxed">Today we explored a full creative workflow using AI.</p>
                  </div>
                </>
              )}
              {learnMsgs.map((m) => (
                <div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role==='user'?'bg-indigo-600 text-white':'bg-[#F7F7FA] border border-[#E8E8EF] text-[#374151]'}`}>{m.content}</div>
                </div>
              ))}
              {learnLoading && <div className="flex gap-1 p-1">{[0,150,300].map((d) => <span key={d} className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>}
              <div ref={learnEndRef}/>
            </div>

            <form onSubmit={askLearn} className="px-3 py-2 border-t border-[#E8E8EF] flex gap-2 shrink-0">
              <input value={learnInput} onChange={(e) => setLearnInput(e.target.value)} placeholder="Ask about this session..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-indigo-300"
              />
              <button type="submit" disabled={!learnInput.trim()||learnLoading} className="p-1.5 rounded-lg hover:bg-indigo-50 text-[#9CA3AF] hover:text-indigo-600 disabled:opacity-40 transition-colors">
                <Send size={13}/>
              </button>
            </form>
          </div>

          {/* Playground */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#E8E8EF] shrink-0">
              <span className="text-sm font-bold text-[#111827] flex-1">Playground</span>
              <button className="p-1 rounded hover:bg-[#F7F7FA] text-[#9CA3AF]"><Maximize2 size={13}/></button>
              <button className="p-1 rounded hover:bg-[#F7F7FA] text-[#9CA3AF]"><MoreHorizontal size={13}/></button>
            </div>

            <div className="flex border-b border-[#E8E8EF] px-4 shrink-0">
              {(['api','prompts','models','tools'] as const).map((tab) => (
                <button key={tab} onClick={() => setPlayTab(tab)}
                  className={`px-3 py-2 text-xs font-medium uppercase transition-colors relative ${activePlayTab===tab?'text-indigo-600':'text-[#9CA3AF] hover:text-[#6B7280]'}`}
                >
                  {tab}
                  {activePlayTab===tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"/>}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
              {activePlayTab==='api' ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">POST</span>
                    <input readOnly value="/v1/generate" className="flex-1 px-2 py-1 rounded border border-[#E8E8EF] bg-[#F7F7FA] text-xs text-[#374151] font-mono focus:outline-none"/>
                    <button onClick={sendPlayground} disabled={apiLoading}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0">
                      {apiLoading?'...':'Send'}
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Body</p>
                    <textarea value={apiBody} onChange={(e) => setApiBody(e.target.value)} rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E8EF] bg-[#F7F7FA] text-xs text-[#374151] font-mono focus:outline-none focus:border-indigo-300 resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Response</p>
                    {apiResponse ? (
                      <div className="p-3 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-xs text-[#374151] leading-relaxed">{apiResponse}</div>
                    ) : (
                      <div className="flex gap-2">
                        {['radial-gradient(ellipse at 40% 40%,#1e3a5f,#0a0a0a)','radial-gradient(ellipse at 60% 40%,#2d1b69,#0a0a0a)','radial-gradient(ellipse at 50% 60%,#1a2e1a,#0a0a0a)'].map((g,i) => (
                          <div key={i} className="flex-1 h-14 rounded-lg" style={{background:g}}/>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-20 text-xs text-[#9CA3AF]">{activePlayTab.charAt(0).toUpperCase()+activePlayTab.slice(1)} coming soon</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div className="h-[88px] border-t border-[#E8E8EF] flex shrink-0 bg-white">
        {/* Priority Mix */}
        <div className="border-r border-[#E8E8EF] px-4 flex items-center gap-3 min-w-[170px]">
          <svg width="60" height="52" viewBox="0 0 60 52">
            <polygon points="30,3 57,49 3,49" fill="rgba(99,102,241,0.08)" stroke="#E8E8EF" strokeWidth="1.5"/>
            <circle cx="30" cy="24" r="3.5" fill="#6366f1"/>
            <text x="30" y="1.5" textAnchor="middle" fontSize="6.5" fill="#9CA3AF">Live</text>
            <text x="1" y="56" textAnchor="start" fontSize="6.5" fill="#9CA3AF">Learn</text>
            <text x="59" y="56" textAnchor="end" fontSize="6.5" fill="#9CA3AF">Play</text>
          </svg>
          <div className="space-y-1">
            {[{label:'Live',pct:'60%',color:'bg-indigo-500'},{label:'Learn',pct:'20%',color:'bg-blue-400'},{label:'Play',pct:'20%',color:'bg-emerald-500'}].map(({label,pct,color}) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                <span className={`w-1.5 h-1.5 rounded-full ${color}`}/>{label} <span className="font-semibold text-[#374151]">{pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick layouts */}
        <div className="border-r border-[#E8E8EF] px-4 flex items-center gap-3 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#374151] shrink-0">Quick layouts</p>
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              {id:'presenter',cols:[[1],[.35,.65]]},
              {id:'canvas',cols:[[.25,.5,.25]]},
              {id:'learn',cols:[[.25,.35,.4]]},
              {id:'play',cols:[[.3,.3,.4]]},
              {id:'balanced',cols:[[.33,.33,.34]]},
            ].map((l) => (
              <button key={l.id} onClick={() => setActiveLayout(l.id)}
                className={`shrink-0 w-12 h-9 rounded border flex flex-col gap-0.5 p-0.5 transition-all ${activeLayout===l.id?'border-indigo-400 bg-indigo-50':'border-[#E8E8EF] hover:border-[#D1D5DB]'}`}
              >
                {l.cols.map((row,ri) => (
                  <div key={ri} className="flex flex-1 gap-0.5">
                    {row.map((w,ci) => <div key={ci} className={`rounded-sm ${activeLayout===l.id?'bg-indigo-200':'bg-[#E8E8EF]'}`} style={{flex:w}}/>)}
                  </div>
                ))}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas controls */}
        <div className="border-r border-[#E8E8EF] px-4 flex items-center gap-4 min-w-[200px]">
          <div>
            <p className="text-[10px] font-semibold text-[#374151] mb-1.5">Canvas controls</p>
            <div className="flex gap-1">
              {[Grid3X3,Maximize2,Magnet,Lock,Settings].map((Icon,i) => (
                <button key={i} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280] transition-colors"><Icon size={12}/></button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#374151] mb-1.5">Infinite canvas</p>
            <button onClick={() => setInfiniteCanvas(!infiniteCanvas)}
              className={`w-9 h-[18px] rounded-full flex items-center px-0.5 transition-colors ${infiniteCanvas?'bg-indigo-500':'bg-[#D1D5DB]'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${infiniteCanvas?'translate-x-[18px]':''}`}/>
            </button>
          </div>
        </div>

        {/* View */}
        <div className="px-4 flex items-center min-w-[110px]">
          <div>
            <p className="text-[10px] font-semibold text-[#374151] mb-1.5">View</p>
            <div className="w-20 h-11 rounded border border-[#E8E8EF] bg-[#F7F7FA] flex gap-0.5 p-1">
              <div className="w-4 bg-indigo-100 rounded-sm"/>
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex-1 bg-violet-100 rounded-sm"/>
                <div className="flex-1 bg-emerald-100 rounded-sm"/>
              </div>
              <div className="w-4 bg-amber-100 rounded-sm"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
