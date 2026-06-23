import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  X, Share2, Save, Grid, Bell, Users, Mic, MicOff, Video, VideoOff,
  ScreenShare, MoreHorizontal, Send, ZoomIn, ZoomOut,
  MousePointer2, Move, Type, Frame, Maximize2, Magnet,
  ExternalLink, Lock, Ruler, Grid3x3,
  Plus, Copy, Trash2, Focus, BookOpen, Brain,
  ToggleLeft, ToggleRight, Sparkles, Code2, ChevronDown, Loader2
} from 'lucide-react'
import { askGemini } from '../lib/gemini'

// ─── Data & Types ────────────────────────────────────────────────────────────

interface Preset {
  id: string
  label: string
  cols: string
  live: number
  learn: number
  play: number
  icon: [number, number, number] // [lw, cw, rw] proportions out of 36
}

const PRESETS: Preset[] = [
  { id: 'presenter-focus', label: 'Presenter',    cols: '1fr 0.6fr 0.5fr',  live: 65, learn: 20, play: 15, icon: [16, 12, 8]  },
  { id: 'canvas-focus',    label: 'Canvas',       cols: '280px 1fr 320px',   live: 25, learn: 20, play: 55, icon: [8, 20, 8]   },
  { id: 'learn-focus',     label: 'Learn',        cols: '280px 0.6fr 1fr',   live: 20, learn: 65, play: 15, icon: [8, 12, 16]  },
  { id: 'play-focus',      label: 'Playground',   cols: '240px 0.5fr 1fr',   live: 15, learn: 15, play: 70, icon: [7, 10, 19]  },
  { id: 'balanced',        label: 'Balanced',     cols: '1fr 1fr 1fr',        live: 34, learn: 33, play: 33, icon: [12, 12, 12] },
  { id: 'workshop',        label: 'Workshop',     cols: '240px 1fr 380px',    live: 30, learn: 35, play: 35, icon: [8, 16, 12]  },
  { id: 'co-pilot',        label: 'Co-Pilot',     cols: '300px 0.8fr 400px', live: 25, learn: 30, play: 45, icon: [9, 14, 13]  },
  { id: 'dual-canvas',     label: 'Dual Canvas',  cols: '0px 1fr 1fr',        live: 0,  learn: 50, play: 50, icon: [0, 18, 18]  },
  { id: 'research-mode',   label: 'Research',     cols: '0px 0.4fr 1fr',     live: 0,  learn: 70, play: 30, icon: [0, 12, 24]  },
  { id: 'build-mode',      label: 'Build',        cols: '240px 0.5fr 1fr',   live: 20, learn: 20, play: 60, icon: [7, 10, 19]  },
]

interface ChatMessage {
  id: string
  user: string
  initials: string
  color: string
  time: string
  text: string
}

const MOCK_CHAT: ChatMessage[] = [
  { id: '1', user: 'Alex Chen',   initials: 'AC', color: '#6366F1', time: '2:14 PM', text: 'Love the workflow canvas approach here!' },
  { id: '2', user: 'Maya Patel',  initials: 'MP', color: '#EC4899', time: '2:15 PM', text: 'Can you show how the brief node connects to output?' },
  { id: '3', user: 'Jordan Lee',  initials: 'JL', color: '#10B981', time: '2:16 PM', text: 'The multi-model comparison in the playground is 🔥' },
  { id: '4', user: 'Sam Torres',  initials: 'ST', color: '#F59E0B', time: '2:17 PM', text: 'What aspect ratio works best for cinematic?' },
  { id: '5', user: 'Riley Kim',   initials: 'RK', color: '#3B82F6', time: '2:18 PM', text: 'Great point on keeping human judgment in the loop' },
  { id: '6', user: 'Dana Wright', initials: 'DW', color: '#8B5CF6', time: '2:19 PM', text: 'The reference image node is exactly what I needed' },
]

interface CanvasNodeDef {
  id: string
  label: string
  tag: string
  badge?: string
  color: string
  bgColor: string
  hasImages?: boolean
  description?: string
}

const NODE_DEFS: CanvasNodeDef[] = [
  { id: 'brief',    label: 'Brief',    tag: 'INPUT',    color: '#7C3AED', bgColor: '#EDE9FE', description: 'Creative direction & goals' },
  { id: 'insight',  label: 'Insight',  tag: 'ANALYSIS', badge: 'AI',  color: '#2563EB', bgColor: '#DBEAFE', description: 'AI-powered insights' },
  { id: 'concept',  label: 'Concept',  tag: 'OUTPUT',   color: '#059669', bgColor: '#D1FAE5', hasImages: true },
  { id: 'prompt',   label: 'Prompt',   tag: 'CRAFT',    color: '#7C3AED', bgColor: '#EDE9FE', description: 'Optimised prompt text' },
  { id: 'generate', label: 'Generate', tag: 'AI RUN',   badge: 'v2', color: '#2563EB', bgColor: '#DBEAFE', hasImages: true },
  { id: 'output',   label: 'Output',   tag: 'FINAL',    color: '#059669', bgColor: '#D1FAE5', hasImages: true },
]

const NODE_INIT_POS: Record<string, { x: number; y: number }> = {
  brief:    { x: 40,  y: 60  },
  insight:  { x: 230, y: 60  },
  concept:  { x: 420, y: 60  },
  prompt:   { x: 40,  y: 240 },
  generate: { x: 230, y: 240 },
  output:   { x: 420, y: 240 },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 border-b border-[#E4E4EC] bg-white flex-shrink-0 ${className}`}>
      {children}
    </div>
  )
}

function IconBtn({
  children, onClick, active = false, className = '', title = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
  title?: string
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center rounded-md transition-colors ${
        active ? 'bg-indigo-50 text-indigo-600' : 'text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Canvas Node ──────────────────────────────────────────────────────────────

function CanvasNodeCard({
  def,
  position,
  selected,
  onSelect,
  onDragStart,
}: {
  def: CanvasNodeDef
  position: { x: number; y: number }
  selected: boolean
  onSelect: (id: string) => void
  onDragStart: (id: string, ox: number, oy: number) => void
}) {
  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onDragStart(def.id, e.clientX - rect.left, e.clientY - rect.top)
    onSelect(def.id)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={() => onSelect(def.id)}
      style={{ left: position.x, top: position.y }}
      className={`absolute w-[150px] bg-white rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-shadow select-none
        ${selected
          ? 'border-indigo-400 shadow-indigo-100 shadow-md ring-2 ring-indigo-200'
          : 'border-[#E4E4EC] hover:border-[#CBD5E1] hover:shadow-md'
        }`}
    >
      <div className="rounded-t-xl px-2.5 py-1.5 flex items-center justify-between" style={{ backgroundColor: def.bgColor }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: def.color }} />
          <span className="text-[10px] font-bold truncate" style={{ color: def.color }}>{def.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-medium opacity-70" style={{ color: def.color }}>{def.tag}</span>
          {def.badge && (
            <span className="text-[9px] font-bold px-1 rounded" style={{ backgroundColor: def.color, color: '#fff' }}>
              {def.badge}
            </span>
          )}
        </div>
      </div>
      <div className="p-2">
        {def.description && <p className="text-[10px] text-[#6B7280] mb-2">{def.description}</p>}
        {def.hasImages && (
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 rounded" style={{ background: `linear-gradient(135deg, ${def.bgColor}, ${def.color}33)` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Canvas SVG Arrows ────────────────────────────────────────────────────────

function CanvasArrows({ positions }: { positions: Record<string, { x: number; y: number }> }) {
  const nw = 150
  const nh = 78

  function mid(id: string): { x: number; y: number } {
    const p = positions[id] ?? { x: 0, y: 0 }
    return { x: p.x + nw / 2, y: p.y + nh / 2 }
  }
  function right(id: string): { x: number; y: number } {
    const p = positions[id] ?? { x: 0, y: 0 }
    return { x: p.x + nw, y: p.y + nh / 2 }
  }
  function left(id: string): { x: number; y: number } {
    const p = positions[id] ?? { x: 0, y: 0 }
    return { x: p.x, y: p.y + nh / 2 }
  }
  function bottom(id: string): { x: number; y: number } {
    const p = positions[id] ?? { x: 0, y: 0 }
    return { x: p.x + nw / 2, y: p.y + nh }
  }
  function top(id: string): { x: number; y: number } {
    const p = positions[id] ?? { x: 0, y: 0 }
    return { x: p.x + nw / 2, y: p.y }
  }

  const arrows: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [
    { from: right('brief'),    to: left('insight')   },
    { from: right('insight'),  to: left('concept')   },
    { from: bottom('brief'),   to: top('prompt')     },
    { from: right('prompt'),   to: left('generate')  },
    { from: right('generate'), to: left('output')    },
    { from: bottom('insight'), to: top('generate')   },
  ]

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#CBD5E1" />
        </marker>
      </defs>
      {arrows.map((a, i) => {
        const { from: f, to: t } = a
        const isHoriz = Math.abs(t.y - f.y) < 20
        const cp1x = isHoriz ? f.x + (t.x - f.x) * 0.5 : f.x
        const cp1y = isHoriz ? f.y : f.y + (t.y - f.y) * 0.5
        const cp2x = isHoriz ? f.x + (t.x - f.x) * 0.5 : t.x
        const cp2y = isHoriz ? t.y : f.y + (t.y - f.y) * 0.5
        return (
          <path
            key={i}
            d={`M ${f.x} ${f.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${t.x} ${t.y}`}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />
        )
      })}
    </svg>
  )
}

// ─── Priority Triangle ────────────────────────────────────────────────────────

function PriorityTriangle({
  livePct, learnPct, playPct, onChange,
}: {
  livePct: number; learnPct: number; playPct: number
  onChange: (live: number, learn: number, play: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const W = 100, H = 80
  const vLive  = [W / 2, 5] as [number, number]
  const vLearn = [5, H - 5] as [number, number]
  const vPlay  = [W - 5, H - 5] as [number, number]

  function baryToSvg(l: number, le: number, p: number): [number, number] {
    const total = l + le + p || 1
    const la = l / total, lea = le / total, pa = p / total
    return [la * vLive[0] + lea * vLearn[0] + pa * vPlay[0], la * vLive[1] + lea * vLearn[1] + pa * vPlay[1]]
  }

  function svgToBary(px: number, py: number): [number, number, number] {
    function triArea(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
      return Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay))
    }
    const total = triArea(vLive[0], vLive[1], vLearn[0], vLearn[1], vPlay[0], vPlay[1])
    if (total === 0) return [33, 34, 33]
    const wLive  = triArea(px, py, vLearn[0], vLearn[1], vPlay[0], vPlay[1]) / total
    const wLearn = triArea(vLive[0], vLive[1], px, py, vPlay[0], vPlay[1]) / total
    const wPlay  = triArea(vLive[0], vLive[1], vLearn[0], vLearn[1], px, py) / total
    const clamp = (v: number) => Math.max(0, Math.min(1, v))
    const cl = clamp(wLive), cle = clamp(wLearn), cp = clamp(wPlay)
    const sum = cl + cle + cp || 1
    const rl = Math.round((cl / sum) * 100), rle = Math.round((cle / sum) * 100)
    return [rl, rle, 100 - rl - rle]
  }

  const [dotX, dotY] = baryToSvg(livePct, learnPct, playPct)

  function getSvgCoords(e: React.MouseEvent | MouseEvent): [number, number] {
    const svg = svgRef.current
    if (!svg) return [0, 0]
    const rect = svg.getBoundingClientRect()
    return [(e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height)]
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    e.preventDefault()
    const [px, py] = getSvgCoords(e)
    const [l, le, p] = svgToBary(px, py)
    onChange(l, le, p)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const [px, py] = getSvgCoords(e)
      const [l, le, p] = svgToBary(px, py)
      onChange(l, le, p)
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const pts = `${vLive[0]},${vLive[1]} ${vLearn[0]},${vLearn[1]} ${vPlay[0]},${vPlay[1]}`

  return (
    <div className="flex flex-col items-center gap-1">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={100} height={80} className="cursor-crosshair" onMouseDown={handleMouseDown}>
        <defs>
          <linearGradient id="triGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <polygon points={pts} fill="url(#triGrad)" stroke="#E4E4EC" strokeWidth="1" />
        <line x1={dotX} y1={dotY} x2={vLive[0]}  y2={vLive[1]}  stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="2,2" />
        <line x1={dotX} y1={dotY} x2={vLearn[0]} y2={vLearn[1]} stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="2,2" />
        <line x1={dotX} y1={dotY} x2={vPlay[0]}  y2={vPlay[1]}  stroke="#8B5CF6" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="2,2" />
        <circle cx={vLive[0]}  cy={vLive[1]}  r="3" fill="#EF4444" />
        <circle cx={vLearn[0]} cy={vLearn[1]} r="3" fill="#3B82F6" />
        <circle cx={vPlay[0]}  cy={vPlay[1]}  r="3" fill="#8B5CF6" />
        <circle cx={dotX} cy={dotY} r="4" fill="#6366F1" stroke="white" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between w-full text-[9px] font-medium px-0.5">
        <span className="text-red-500">L {livePct}%</span>
        <span className="text-blue-500">N {learnPct}%</span>
        <span className="text-violet-500">P {playPct}%</span>
      </div>
    </div>
  )
}

// ─── Preset Thumbnail ─────────────────────────────────────────────────────────

function PresetThumb({ preset, active, onClick }: { preset: Preset; active: boolean; onClick: () => void }) {
  const [lw, cw, rw] = preset.icon
  const total = lw + cw + rw || 1
  const scale = 36

  return (
    <button
      onClick={onClick}
      title={preset.label}
      className={`group flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
        active
          ? 'bg-indigo-50 border-indigo-300 shadow-sm shadow-indigo-100'
          : 'bg-white border-[#E4E4EC] hover:border-[#C7D2FE] hover:bg-indigo-50/30'
      }`}
    >
      <svg width={scale} height={20} viewBox={`0 0 ${scale} 20`}>
        {lw > 0 && (
          <rect x="0" y="0" width={(lw / total) * scale - 1} height="20" rx="2"
            fill={active ? '#818CF8' : '#E5E7EB'} />
        )}
        <rect
          x={(lw / total) * scale + (lw > 0 ? 1 : 0)}
          y="0"
          width={(cw / total) * scale - 2}
          height="20"
          rx="2"
          fill={active ? '#6366F1' : '#D1D5DB'}
        />
        <rect
          x={((lw + cw) / total) * scale + 1}
          y="0"
          width={(rw / total) * scale - 1}
          height="20"
          rx="2"
          fill={active ? '#818CF8' : '#E5E7EB'}
        />
      </svg>
      <span className={`text-[9px] font-medium leading-none ${active ? 'text-indigo-700' : 'text-[#6B7280] group-hover:text-[#374151]'}`}>
        {preset.label}
      </span>
    </button>
  )
}

// ─── Main Workspace Component ─────────────────────────────────────────────────

export default function Workspace() {
  const { roomId } = useParams({ from: '/live/$roomId' })
  const navigate = useNavigate()

  const [preset, setPreset]         = useState('canvas-focus')
  const [livePct, setLivePct]       = useState(25)
  const [learnPct, setLearnPct]     = useState(20)
  const [playPct, setPlayPct]       = useState(55)
  const [chatInput, setChatInput]   = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT)
  const [learnTab, setLearnTab]     = useState<'notes' | 'transcript' | 'sources'>('notes')
  const [playTab, setPlayTab]       = useState<'api' | 'prompts' | 'models' | 'tools'>('api')
  const [zoomLevel, setZoomLevel]   = useState(1)
  const [showRulers, setShowRulers] = useState(true)
  const [showGrid, setShowGrid]     = useState(true)
  const [micOn, setMicOn]           = useState(false)
  const [camOn, setCamOn]           = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [activeTool, setActiveTool] = useState('cursor')

  // AI state — Learn panel
  const [learnQuery, setLearnQuery] = useState('')
  const [learnLoading, setLearnLoading] = useState(false)
  const [learnMessages, setLearnMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string }>>([])
  const learnEndRef = useRef<HTMLDivElement>(null)

  // AI state — Play panel
  const [playPrompt, setPlayPrompt] = useState('Futuristic race car, motion blur, cinematic, 16:9')
  const [playLoading, setPlayLoading] = useState(false)
  const [playOutput, setPlayOutput] = useState('')

  // AI state — Chat AI assistant
  const [chatAiLoading, setChatAiLoading] = useState(false)

  useEffect(() => { learnEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [learnMessages])

  async function askLearnAI(e: React.FormEvent) {
    e.preventDefault()
    if (!learnQuery.trim() || learnLoading) return
    const q = learnQuery.trim()
    setLearnQuery('')
    setLearnMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: q }])
    setLearnLoading(true)
    try {
      const answer = await askGemini(q, `Live webinar session room: ${roomId}. You are an AI assistant helping attendees understand the session content.`)
      setLearnMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: answer }])
    } catch {
      setLearnMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: 'Unable to reach AI. Please check your connection.' }])
    } finally {
      setLearnLoading(false)
    }
  }

  async function runPlayground() {
    if (!playPrompt.trim() || playLoading) return
    setPlayLoading(true)
    setPlayOutput('')
    try {
      const result = await askGemini(
        `Act as an AI image generation API. Given this prompt: "${playPrompt}", describe what a high-quality generated image would look like. Include style, composition, lighting, color palette, and mood in 3-4 sentences. Then suggest 3 prompt variations to improve it.`,
        'AI image generation playground'
      )
      setPlayOutput(result)
    } catch {
      setPlayOutput('API error — check your Gemini key in .env.local')
    } finally {
      setPlayLoading(false)
    }
  }

  async function sendChatWithAI(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [
      ...prev,
      { id: String(Date.now()), user: 'You', initials: 'YO', color: '#6366F1', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: msg },
    ])
    // If message looks like a question, get an AI response
    if (msg.includes('?') || msg.toLowerCase().startsWith('what') || msg.toLowerCase().startsWith('how') || msg.toLowerCase().startsWith('can') || msg.toLowerCase().startsWith('why')) {
      setChatAiLoading(true)
      try {
        const answer = await askGemini(msg, `Live webinar room: ${roomId}. Respond briefly as an AI assistant to this participant question.`)
        setChatMessages((prev) => [
          ...prev,
          { id: String(Date.now() + 1), user: 'AI Assistant', initials: 'AI', color: '#6366F1', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: answer },
        ])
      } finally {
        setChatAiLoading(false)
      }
    }
  }

  // Draggable canvas nodes
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(NODE_INIT_POS)
  const draggingRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const canvasContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !canvasContentRef.current) return
      const { id, ox, oy } = draggingRef.current
      const rect = canvasContentRef.current.getBoundingClientRect()
      let x = (e.clientX - rect.left) / zoomLevel - ox
      let y = (e.clientY - rect.top) / zoomLevel - oy
      if (snapToGrid) { x = Math.round(x / 20) * 20; y = Math.round(y / 20) * 20 }
      x = Math.max(0, x); y = Math.max(0, y)
      setNodePositions((prev) => ({ ...prev, [id]: { x, y } }))
    }
    const onUp = () => { draggingRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [zoomLevel, snapToGrid])

  const currentPreset = PRESETS.find((p) => p.id === preset) ?? PRESETS[1]

  function applyPreset(p: Preset) {
    setPreset(p.id)
    setLivePct(p.live)
    setLearnPct(p.learn)
    setPlayPct(p.play)
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        user: 'You',
        initials: 'YO',
        color: '#6366F1',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: chatInput.trim(),
      },
    ])
    setChatInput('')
  }

  // ─── TopBar ─────────────────────────────────────────────────────────────────

  const TopBar = (
    <div className="h-12 flex items-center px-4 gap-3 bg-white border-b border-[#E4E4EC] flex-shrink-0 z-20">
      <div className="flex items-center gap-2 mr-1">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V10L7 13.5L1 10V4.5L7 1Z" fill="white" fillOpacity="0.9" />
            <path d="M7 1L13 4.5L7 8L1 4.5L7 1Z" fill="white" fillOpacity="0.5" />
          </svg>
        </div>
        <span className="text-sm font-bold text-[#111827]">Sandbox</span>
      </div>

      <div className="w-px h-5 bg-[#E4E4EC]" />

      <div className="flex items-center gap-1">
        {[{ label: 'Live', dot: true }, { label: 'Learn' }, { label: 'Play' }].map(({ label, dot }) => (
          <button
            key={label}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${label === 'Live' ? 'bg-red-50 text-red-600' : 'text-[#6B7280] hover:bg-gray-100'}`}
          >
            {dot && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
            )}
            {label}
          </button>
        ))}
      </div>

      <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors ml-1">
        <span className="text-[10px]">◆</span>
        Priority Mix
      </button>

      <div className="flex-1" />

      {/* Priority bar inline */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center h-1.5 w-24 rounded-full overflow-hidden">
          <div className="h-full bg-red-400 transition-all duration-300" style={{ width: `${livePct}%` }} />
          <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${learnPct}%` }} />
          <div className="h-full bg-violet-400 transition-all duration-300" style={{ width: `${playPct}%` }} />
        </div>
        <span className="text-[10px] text-[#9CA3AF] font-mono">{livePct}/{learnPct}/{playPct}</span>
      </div>

      <div className="w-px h-5 bg-[#E4E4EC]" />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-[#6B7280]">
          <Users size={13} />
          <span className="font-medium">128</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E4EC] text-xs font-medium text-[#374151] hover:bg-gray-50 transition-colors">
          <Share2 size={12} />
          Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E4EC] text-xs font-medium text-[#374151] hover:bg-gray-50 transition-colors">
          <Save size={12} />
          Save
        </button>
        <IconBtn className="w-8 h-8"><Grid size={15} /></IconBtn>
        <IconBtn className="w-8 h-8"><Bell size={15} /></IconBtn>
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
          KN
        </div>
        <button
          onClick={() => navigate({ to: '/live' })}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )

  // ─── LayoutStrip (primary navigation) ────────────────────────────────────────

  const LayoutStrip = (
    <div className="flex items-center gap-0 bg-[#FAFAFA] border-b border-[#E4E4EC] flex-shrink-0 overflow-hidden">
      <div className="flex items-center gap-1 px-3 overflow-x-auto scrollbar-none py-1.5">
        {PRESETS.map((p) => (
          <PresetThumb key={p.id} preset={p} active={preset === p.id} onClick={() => applyPreset(p)} />
        ))}
        <button className="flex-shrink-0 flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-[#E4E4EC] text-[#9CA3AF] hover:border-[#C7D2FE] hover:text-indigo-500 transition-colors">
          <Plus size={14} />
          <span className="text-[9px] font-medium leading-none">New</span>
        </button>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-3 border-l border-[#E4E4EC] h-full">
        <span className="text-[10px] text-[#9CA3AF]">Room: <span className="font-mono">{roomId}</span></span>
        <ChevronDown size={12} className="text-[#9CA3AF]" />
      </div>
    </div>
  )

  // ─── LivePanel ───────────────────────────────────────────────────────────────

  const LivePanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-xl overflow-hidden flex-1 min-h-0">
      <PanelHeader>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white">LIVE</span>
          <span className="text-xs font-medium text-[#111827]">Presenter</span>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn className="w-6 h-6" onClick={() => setMicOn(!micOn)}>
            {micOn ? <Mic size={12} /> : <MicOff size={12} className="text-red-400" />}
          </IconBtn>
          <IconBtn className="w-6 h-6" onClick={() => setCamOn(!camOn)}>
            {camOn ? <Video size={12} /> : <VideoOff size={12} className="text-red-400" />}
          </IconBtn>
          <IconBtn className="w-6 h-6"><ScreenShare size={12} /></IconBtn>
          <IconBtn className="w-6 h-6"><MoreHorizontal size={12} /></IconBtn>
        </div>
      </PanelHeader>
      <div className="flex-1 bg-[#111827] relative overflow-hidden min-h-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #111827 50%, #0d1117 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #6366F1 0, #6366F1 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #6366F1 0, #6366F1 1px, transparent 0, transparent 50%)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/80 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          <span className="text-[9px] font-bold text-white">LIVE</span>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
          <Users size={9} className="text-white opacity-70" />
          <span className="text-[9px] text-white opacity-70">128</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-300/60">P</span>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
            <span className="text-[10px] text-white font-medium">Presenter · Host</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1A1A2E] flex-shrink-0">
        {[
          { icon: micOn ? <Mic size={13} /> : <MicOff size={13} />, active: micOn, onClick: () => setMicOn(!micOn) },
          { icon: camOn ? <Video size={13} /> : <VideoOff size={13} />, active: camOn, onClick: () => setCamOn(!camOn) },
          { icon: <ScreenShare size={13} />, active: false, onClick: () => {} },
          { icon: <MoreHorizontal size={13} />, active: false, onClick: () => {} },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors
              ${btn.active ? 'bg-white/15 text-white' : 'bg-white/5 text-[#6B7280] hover:bg-white/10 hover:text-white'}`}>
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  )

  // ─── ChatPanel ───────────────────────────────────────────────────────────────

  const ChatPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-xl overflow-hidden flex-shrink-0" style={{ height: '210px' }}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#111827]">Live Chat</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-[9px] font-medium text-[#6B7280]">128</span>
        </div>
        <IconBtn className="w-6 h-6"><MoreHorizontal size={12} /></IconBtn>
      </PanelHeader>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: msg.color }}>
              {msg.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold text-[#111827]">{msg.user}</span>
                <span className="text-[9px] text-[#9CA3AF]">{msg.time}</span>
              </div>
              <p className="text-[10px] text-[#374151] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      {chatAiLoading && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[#E4E4EC] bg-indigo-50/50">
          <Brain size={10} className="text-indigo-400 animate-pulse" />
          <span className="text-[10px] text-indigo-500">AI is responding…</span>
        </div>
      )}
      <form onSubmit={sendChatWithAI} className="flex items-center gap-2 px-3 py-2 border-t border-[#E4E4EC] flex-shrink-0">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Say something… (questions get AI replies)"
          className="flex-1 text-[11px] text-[#111827] placeholder-[#9CA3AF] bg-[#F9FAFB] border border-[#E4E4EC] rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-300 min-w-0"
        />
        <button type="submit" className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex-shrink-0">
          <Send size={10} />
        </button>
      </form>
    </div>
  )

  // ─── CanvasPanel ─────────────────────────────────────────────────────────────

  const canvasToolsList = [
    { id: 'cursor', icon: <MousePointer2 size={13} />, title: 'Select' },
    { id: 'move',   icon: <Move size={13} />,          title: 'Pan' },
    { id: 'text',   icon: <Type size={13} />,          title: 'Text' },
    { id: 'frame',  icon: <Frame size={13} />,         title: 'Frame' },
    { id: 'expand', icon: <Maximize2 size={13} />,     title: 'Expand' },
  ]

  const CanvasPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-xl overflow-hidden h-full">
      <PanelHeader>
        <div className="flex items-center gap-1">
          {canvasToolsList.map((t) => (
            <IconBtn key={t.id} active={activeTool === t.id} onClick={() => setActiveTool(t.id)} className="w-7 h-7" title={t.title}>
              {t.icon}
            </IconBtn>
          ))}
          <div className="w-px h-4 bg-[#E4E4EC] mx-1" />
          <span className="text-[11px] text-[#6B7280] font-mono">{Math.round(zoomLevel * 100)}%</span>
          <IconBtn className="w-6 h-6" onClick={() => setZoomLevel((z) => Math.min(3, z + 0.1))}><ZoomIn size={11} /></IconBtn>
          <IconBtn className="w-6 h-6" onClick={() => setZoomLevel((z) => Math.max(0.1, z - 0.1))}><ZoomOut size={11} /></IconBtn>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn className="w-7 h-7" active={showRulers} onClick={() => setShowRulers(!showRulers)} title="Rulers"><Ruler size={12} /></IconBtn>
          <IconBtn className="w-7 h-7" active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Grid"><Grid3x3 size={12} /></IconBtn>
          <IconBtn className="w-7 h-7" active={snapToGrid} onClick={() => setSnapToGrid(!snapToGrid)} title="Snap to grid"><Magnet size={12} /></IconBtn>
          <div className="w-px h-4 bg-[#E4E4EC] mx-0.5" />
          <span className="text-[10px] text-[#9CA3AF] font-medium">Creative Workflow</span>
          <IconBtn className="w-6 h-6"><MoreHorizontal size={12} /></IconBtn>
        </div>
      </PanelHeader>

      <div className="flex-1 relative overflow-hidden min-h-0 bg-[#F4F4F7]">
        {showRulers && (
          <div className="absolute top-0 left-5 right-0 h-5 bg-white border-b border-[#E4E4EC] z-10 overflow-hidden">
            <svg width="100%" height="20">
              {Array.from({ length: 20 }).map((_, i) => (
                <g key={i}>
                  <line x1={i * 60} y1="12" x2={i * 60} y2="20" stroke="#CBD5E1" strokeWidth="1" />
                  <text x={i * 60 + 2} y="9" fontSize="7" fill="#9CA3AF">{i * 100}</text>
                </g>
              ))}
            </svg>
          </div>
        )}
        {showRulers && (
          <div className="absolute top-5 left-0 w-5 bottom-0 bg-white border-r border-[#E4E4EC] z-10 overflow-hidden">
            <svg height="100%" width="20">
              {Array.from({ length: 15 }).map((_, i) => (
                <g key={i}>
                  <line x1="12" y1={i * 50} x2="20" y2={i * 50} stroke="#CBD5E1" strokeWidth="1" />
                  <text x="1" y={i * 50 + 10} fontSize="7" fill="#9CA3AF" transform={`rotate(-90, 8, ${i * 50 + 8})`}>{i * 100}</text>
                </g>
              ))}
            </svg>
          </div>
        )}

        <div
          ref={canvasContentRef}
          className="absolute overflow-auto"
          style={{ top: showRulers ? '20px' : '0', left: showRulers ? '20px' : '0', right: 0, bottom: 0 }}
        >
          <div
            className="relative"
            style={{
              width: '760px',
              height: '480px',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              backgroundImage: showGrid ? 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? '20px 20px' : undefined,
            }}
          >
            <CanvasArrows positions={nodePositions} />
            {NODE_DEFS.map((def) => (
              <CanvasNodeCard
                key={def.id}
                def={def}
                position={nodePositions[def.id] ?? { x: 0, y: 0 }}
                selected={selectedNode === def.id}
                onSelect={setSelectedNode}
                onDragStart={(id, ox, oy) => { draggingRef.current = { id, ox, oy } }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-[#E4E4EC] bg-white flex-shrink-0 overflow-x-auto">
        {[
          { icon: <Plus size={11} />, label: 'Add node' },
          { icon: <Copy size={11} />, label: 'Duplicate' },
          { icon: <ExternalLink size={11} />, label: 'Pop out' },
          { icon: <Focus size={11} />, label: 'Focus' },
          { icon: <Lock size={11} />, label: 'Lock' },
          { icon: <Trash2 size={11} />, label: 'Delete', danger: true },
        ].map(({ icon, label, danger }) => (
          <button
            key={label}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors
              ${danger ? 'text-red-400 hover:text-red-500 hover:bg-red-50' : 'text-[#6B7280] hover:bg-gray-100 hover:text-[#374151]'}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  )

  // ─── LearnPanel ──────────────────────────────────────────────────────────────

  const learnTabs = [
    { id: 'notes' as const, label: 'AI Notes' },
    { id: 'transcript' as const, label: 'Transcript' },
    { id: 'sources' as const, label: 'Sources' },
  ]

  const LearnPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-xl overflow-hidden flex-1 min-h-0">
      <PanelHeader>
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-blue-500" />
          <span className="text-xs font-semibold text-[#111827]">Learn</span>
        </div>
        <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-medium hover:bg-indigo-700 transition-colors">
          <Sparkles size={10} /> Ask AI
        </button>
      </PanelHeader>
      <div className="flex border-b border-[#E4E4EC] px-3 flex-shrink-0">
        {learnTabs.map((t) => (
          <button key={t.id} onClick={() => setLearnTab(t.id)}
            className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors -mb-px
              ${learnTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {learnTab === 'notes' && (
          <div className="space-y-3">
            {learnMessages.length === 0 && (
              <div className="text-center py-6">
                <Brain size={24} className="text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-[11px] text-[#9CA3AF]">Ask the AI anything about this session.</p>
              </div>
            )}
            {learnMessages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain size={10} className="text-indigo-600" />
                  </div>
                )}
                <div className={`max-w-[90%] px-2.5 py-2 rounded-lg text-[11px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#F9FAFB] border border-[#E4E4EC] text-[#374151] whitespace-pre-wrap'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {learnLoading && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Brain size={10} className="text-indigo-600" />
                </div>
                <div className="flex gap-1 px-2.5 py-2 rounded-lg bg-[#F9FAFB] border border-[#E4E4EC]">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={learnEndRef} />
          </div>
        )}
        {learnTab === 'transcript' && <p className="text-[11px] text-[#6B7280] italic">Transcript will appear here in real time during the session.</p>}
        {learnTab === 'sources' && <p className="text-[11px] text-[#6B7280] italic">No sources linked yet.</p>}
      </div>
      <form onSubmit={askLearnAI} className="px-3 py-2 border-t border-[#E4E4EC] flex-shrink-0 flex gap-2">
        <input
          value={learnQuery}
          onChange={(e) => setLearnQuery(e.target.value)}
          placeholder="Ask about this session…"
          className="flex-1 text-[11px] text-[#111827] placeholder-[#9CA3AF] bg-[#F9FAFB] border border-[#E4E4EC] rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-300 min-w-0"
        />
        <button type="submit" disabled={!learnQuery.trim() || learnLoading}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors flex-shrink-0">
          {learnLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
        </button>
      </form>
    </div>
  )

  // ─── PlayPanel ───────────────────────────────────────────────────────────────

  const playTabs = [
    { id: 'api' as const,     label: 'API' },
    { id: 'prompts' as const, label: 'Prompts' },
    { id: 'models' as const,  label: 'Models' },
    { id: 'tools' as const,   label: 'Tools' },
  ]

  const PlayPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-xl overflow-hidden flex-shrink-0" style={{ height: '280px' }}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <Code2 size={13} className="text-violet-500" />
          <span className="text-xs font-semibold text-[#111827]">Playground</span>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn className="w-6 h-6"><Maximize2 size={12} /></IconBtn>
          <IconBtn className="w-6 h-6"><MoreHorizontal size={12} /></IconBtn>
        </div>
      </PanelHeader>
      <div className="flex border-b border-[#E4E4EC] px-3 flex-shrink-0">
        {playTabs.map((t) => (
          <button key={t.id} onClick={() => setPlayTab(t.id)}
            className={`px-2.5 py-1.5 text-[11px] font-medium border-b-2 transition-colors -mb-px
              ${playTab === t.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2.5 min-h-0">
        {playTab === 'api' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">POST</span>
              <span className="text-[10px] font-mono text-[#6B7280]">/v1/generate</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#374151] block mb-1">Prompt</span>
              <textarea
                value={playPrompt}
                onChange={(e) => setPlayPrompt(e.target.value)}
                rows={3}
                className="w-full text-[10px] font-mono bg-[#F9FAFB] border border-[#E4E4EC] rounded-lg p-2 text-[#374151] leading-relaxed resize-none focus:outline-none focus:border-violet-300"
              />
            </div>
            <button
              onClick={runPlayground}
              disabled={playLoading || !playPrompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors ml-auto"
            >
              {playLoading ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
              {playLoading ? 'Running…' : 'Run'}
            </button>
            {playOutput && (
              <div>
                <span className="text-[10px] font-semibold text-[#374151] block mb-1">AI Response</span>
                <div className="text-[10px] text-[#374151] bg-[#F9FAFB] border border-[#E4E4EC] rounded-lg p-2 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {playOutput}
                </div>
              </div>
            )}
            {!playOutput && !playLoading && (
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-lg" style={{ background: `linear-gradient(135deg, #1e1b4b ${i * 20}%, #312e81)` }} />
                ))}
              </div>
            )}
          </div>
        )}
        {playTab !== 'api' && (
          <p className="text-[11px] text-[#6B7280] italic">
            {playTab === 'prompts' ? 'Saved prompts will appear here.' : playTab === 'models' ? 'Available models will be listed here.' : 'Tool definitions will appear here.'}
          </p>
        )}
      </div>
    </div>
  )

  // ─── BottomBar ───────────────────────────────────────────────────────────────

  const BottomBar = (
    <div className="h-[88px] flex items-stretch bg-white border-t border-[#E4E4EC] flex-shrink-0 overflow-hidden">
      <div className="flex flex-col justify-center px-4 gap-1 border-r border-[#E4E4EC] min-w-[160px]">
        <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Priority Mix</span>
        <PriorityTriangle
          livePct={livePct} learnPct={learnPct} playPct={playPct}
          onChange={(l, le, p) => { setLivePct(l); setLearnPct(le); setPlayPct(p) }}
        />
      </div>

      <div className="flex flex-col justify-center px-4 gap-2 border-r border-[#E4E4EC] min-w-[200px]">
        <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Canvas</span>
        <div className="space-y-1">
          {[
            { label: 'Snap to grid', val: snapToGrid, set: setSnapToGrid },
            { label: 'Rulers',       val: showRulers, set: setShowRulers },
            { label: 'Grid dots',    val: showGrid,   set: setShowGrid },
          ].map(({ label, val, set }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-[#374151]">{label}</span>
              <button onClick={() => set(!val)} className={`transition-colors ${val ? 'text-indigo-600' : 'text-[#9CA3AF]'}`}>
                {val ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 gap-1 border-r border-[#E4E4EC] min-w-[140px]">
        <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">View</span>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: 'Live',   color: '#EF4444', active: livePct > 0 },
            { label: 'Chat',   color: '#10B981', active: true },
            { label: 'Canvas', color: '#6366F1', active: true },
            { label: 'Learn',  color: '#3B82F6', active: learnPct > 0 },
            { label: 'Play',   color: '#8B5CF6', active: playPct > 0 },
            { label: 'Tools',  color: '#F59E0B', active: true },
          ].map(({ label, color, active }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div className="w-6 h-6 rounded flex items-center justify-center text-[7px] font-bold"
                style={{ backgroundColor: active ? `${color}22` : '#F3F4F6', border: `1px solid ${active ? color + '44' : '#E4E4EC'}`, color: active ? color : '#9CA3AF' }}>
                {label.slice(0, 1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 px-4 border-l border-[#E4E4EC]">
        <button onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.25))} className="w-6 h-6 flex items-center justify-center rounded border border-[#E4E4EC] text-[#6B7280] hover:bg-gray-50 text-sm">−</button>
        <span className="text-[10px] font-mono text-[#374151] w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
        <button onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))} className="w-6 h-6 flex items-center justify-center rounded border border-[#E4E4EC] text-[#6B7280] hover:bg-gray-50 text-sm">+</button>
      </div>
    </div>
  )

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F4F4F7]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {TopBar}
      {LayoutStrip}

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="h-full p-2 gap-2 grid"
          style={{ gridTemplateColumns: currentPreset.cols, transition: 'grid-template-columns 400ms cubic-bezier(0.4,0,0.2,1)' }}
        >
          {/* Left column: Live + Chat */}
          <div
            className="flex flex-col gap-2 min-h-0 overflow-hidden"
            style={{ display: currentPreset.cols.startsWith('0px') ? 'none' : 'flex' }}
          >
            {LivePanel}
            {ChatPanel}
          </div>

          {/* Center column: Canvas */}
          <div className="min-h-0 overflow-hidden">
            {CanvasPanel}
          </div>

          {/* Right column: Learn + Play */}
          <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
            {LearnPanel}
            {PlayPanel}
          </div>
        </div>
      </div>

      {BottomBar}
    </div>
  )
}
