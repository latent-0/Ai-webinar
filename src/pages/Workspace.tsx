import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  X, Share2, Users, Mic, MicOff, Video, VideoOff, ScreenShare,
  MoreHorizontal, Send, Maximize2, BookOpen, Brain, Code2,
  Sparkles, Loader2, GripVertical, Minimize2, ZoomIn, ZoomOut,
  MousePointer2, Move, Type, Frame, Magnet, Grid3x3, Ruler,
  Radio, Gamepad2, LayoutGrid, RefreshCw
} from 'lucide-react'
import { askGemini } from '../lib/gemini'

// ─── Panel system ─────────────────────────────────────────────────────────────

interface PanelBox {
  id: string
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized: boolean
}

const SNAP = 8
const MIN_W = 220
const MIN_H = 160

function snap(v: number) { return Math.round(v / SNAP) * SNAP }

const DEFAULT_PANELS: PanelBox[] = [
  { id: 'live',    x: 0,   y: 0,   w: 340, h: 380, z: 1, minimized: false },
  { id: 'chat',    x: 0,   y: 388, w: 340, h: 240, z: 1, minimized: false },
  { id: 'canvas',  x: 348, y: 0,   w: 560, h: 624, z: 1, minimized: false },
  { id: 'learn',   x: 916, y: 0,   w: 320, h: 400, z: 1, minimized: false },
  { id: 'play',    x: 916, y: 408, w: 320, h: 216, z: 1, minimized: false },
]

// ─── Canvas nodes ─────────────────────────────────────────────────────────────

interface NodeDef { id: string; label: string; tag: string; badge?: string; color: string; bg: string; hasImages?: boolean; desc?: string }
const NODE_DEFS: NodeDef[] = [
  { id: 'brief',    label: 'Brief',    tag: 'INPUT',    color: '#7C3AED', bg: '#EDE9FE', desc: 'Creative direction' },
  { id: 'insight',  label: 'Insight',  tag: 'ANALYSIS', badge: 'AI', color: '#2563EB', bg: '#DBEAFE', desc: 'AI insights' },
  { id: 'concept',  label: 'Concept',  tag: 'OUTPUT',   color: '#059669', bg: '#D1FAE5', hasImages: true },
  { id: 'prompt',   label: 'Prompt',   tag: 'CRAFT',    color: '#7C3AED', bg: '#EDE9FE', desc: 'Optimised prompt' },
  { id: 'generate', label: 'Generate', tag: 'AI RUN',   badge: 'v2', color: '#2563EB', bg: '#DBEAFE', hasImages: true },
  { id: 'output',   label: 'Output',   tag: 'FINAL',    color: '#059669', bg: '#D1FAE5', hasImages: true },
]
const NODE_INIT: Record<string, { x: number; y: number }> = {
  brief: { x: 40, y: 60 }, insight: { x: 230, y: 60 }, concept: { x: 420, y: 60 },
  prompt: { x: 40, y: 240 }, generate: { x: 230, y: 240 }, output: { x: 420, y: 240 },
}

// ─── Mock chat ────────────────────────────────────────────────────────────────
const MOCK_CHAT = [
  { id: '1', user: 'Alex Chen',   initials: 'AC', color: '#6366F1', time: '2:14 PM', text: 'Love the workflow canvas!' },
  { id: '2', user: 'Maya Patel',  initials: 'MP', color: '#EC4899', time: '2:15 PM', text: 'Can you show how brief → output works?' },
  { id: '3', user: 'Jordan Lee',  initials: 'JL', color: '#10B981', time: '2:16 PM', text: 'The playground is 🔥' },
  { id: '4', user: 'Sam Torres',  initials: 'ST', color: '#F59E0B', time: '2:17 PM', text: 'What aspect ratio for cinematic?' },
]

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({
  title, icon, onDragStart, onMinimize, minimized, children,
}: {
  title: string
  icon: React.ReactNode
  onDragStart: (e: React.MouseEvent) => void
  onMinimize: () => void
  minimized: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F0F0F5] bg-white rounded-t-2xl flex-shrink-0 select-none cursor-grab active:cursor-grabbing"
      onMouseDown={onDragStart}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
        {icon}
        <span className="text-xs font-semibold text-[#111827] truncate">{title}</span>
      </div>
      <div className="flex items-center gap-1 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
        {children}
        <button onClick={onMinimize} className="w-5 h-5 flex items-center justify-center rounded text-[#9CA3AF] hover:bg-gray-100 hover:text-[#374151] transition-colors">
          {minimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
        </button>
      </div>
    </div>
  )
}

// ─── Resize handle ────────────────────────────────────────────────────────────

function ResizeHandle({ onResizeStart }: { onResizeStart: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-1 rounded-br-2xl opacity-30 hover:opacity-100 transition-opacity"
      onMouseDown={onResizeStart}
    >
      <GripVertical size={10} className="text-[#9CA3AF] rotate-45" />
    </div>
  )
}

// ─── Canvas node ─────────────────────────────────────────────────────────────

function CanvasNode({ def, pos, selected, onSelect, onDragStart }: {
  def: NodeDef
  pos: { x: number; y: number }
  selected: boolean
  onSelect: (id: string) => void
  onDragStart: (id: string, ox: number, oy: number) => void
}) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault(); e.stopPropagation()
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        onDragStart(def.id, e.clientX - r.left, e.clientY - r.top)
        onSelect(def.id)
      }}
      style={{ left: pos.x, top: pos.y }}
      className={`absolute w-[148px] bg-white rounded-xl border cursor-grab active:cursor-grabbing shadow-sm select-none transition-shadow
        ${selected ? 'border-indigo-400 ring-2 ring-indigo-200 shadow-indigo-100 shadow-md' : 'border-[#E8E8EF] hover:shadow-md'}`}
    >
      <div className="rounded-t-xl px-2.5 py-1.5 flex items-center justify-between" style={{ backgroundColor: def.bg }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color }} />
          <span className="text-[10px] font-bold" style={{ color: def.color }}>{def.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] opacity-60 font-medium" style={{ color: def.color }}>{def.tag}</span>
          {def.badge && <span className="text-[9px] font-bold px-1 rounded text-white" style={{ backgroundColor: def.color }}>{def.badge}</span>}
        </div>
      </div>
      <div className="p-2">
        {def.desc && <p className="text-[10px] text-[#6B7280] mb-1.5">{def.desc}</p>}
        {def.hasImages && (
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => <div key={i} className="h-7 rounded" style={{ background: `linear-gradient(135deg, ${def.bg}, ${def.color}33)` }} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function CanvasArrows({ positions }: { positions: Record<string, { x: number; y: number }> }) {
  const nw = 148, nh = 76
  const r = (id: string) => ({ x: (positions[id]?.x ?? 0) + nw, y: (positions[id]?.y ?? 0) + nh / 2 })
  const l = (id: string) => ({ x: positions[id]?.x ?? 0, y: (positions[id]?.y ?? 0) + nh / 2 })
  const b = (id: string) => ({ x: (positions[id]?.x ?? 0) + nw / 2, y: (positions[id]?.y ?? 0) + nh })
  const t = (id: string) => ({ x: (positions[id]?.x ?? 0) + nw / 2, y: positions[id]?.y ?? 0 })
  const arrows = [
    [r('brief'), l('insight')], [r('insight'), l('concept')],
    [b('brief'), t('prompt')], [r('prompt'), l('generate')],
    [r('generate'), l('output')], [b('insight'), t('generate')],
  ] as Array<[{ x: number; y: number }, { x: number; y: number }]>

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#D1D5DB" />
        </marker>
      </defs>
      {arrows.map(([f, t], i) => {
        const horiz = Math.abs(t.y - f.y) < 20
        return (
          <path key={i}
            d={`M ${f.x} ${f.y} C ${horiz ? f.x + (t.x - f.x) * .5 : f.x} ${horiz ? f.y : f.y + (t.y - f.y) * .5}, ${horiz ? f.x + (t.x - f.x) * .5 : t.x} ${horiz ? t.y : f.y + (t.y - f.y) * .5}, ${t.x} ${t.y}`}
            fill="none" stroke="#D1D5DB" strokeWidth="1.5" markerEnd="url(#arr)"
          />
        )
      })}
    </svg>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Workspace() {
  const { roomId } = useParams({ from: '/live/$roomId' })
  const navigate = useNavigate()

  // Panel layout state
  const [panels, setPanels] = useState<PanelBox[]>(DEFAULT_PANELS)
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const resizeRef = useRef<{ id: string; startX: number; startY: number; origW: number; origH: number } | null>(null)
  const topZ = useRef(10)

  const bringToFront = useCallback((id: string) => {
    topZ.current += 1
    setPanels((ps) => ps.map((p) => p.id === id ? { ...p, z: topZ.current } : p))
  }, [])

  const updatePanel = useCallback((id: string, patch: Partial<PanelBox>) => {
    setPanels((ps) => ps.map((p) => p.id === id ? { ...p, ...patch } : p))
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { id, startX, startY, origX, origY } = dragRef.current
        updatePanel(id, {
          x: snap(Math.max(0, origX + e.clientX - startX)),
          y: snap(Math.max(0, origY + e.clientY - startY)),
        })
      }
      if (resizeRef.current) {
        const { id, startX, startY, origW, origH } = resizeRef.current
        updatePanel(id, {
          w: snap(Math.max(MIN_W, origW + e.clientX - startX)),
          h: snap(Math.max(MIN_H, origH + e.clientY - startY)),
        })
      }
    }
    const onUp = () => { dragRef.current = null; resizeRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [updatePanel])

  function startDrag(id: string, e: React.MouseEvent) {
    e.preventDefault()
    bringToFront(id)
    const p = panels.find((x) => x.id === id)!
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: p.x, origY: p.y }
  }

  function startResize(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    bringToFront(id)
    const p = panels.find((x) => x.id === id)!
    resizeRef.current = { id, startX: e.clientX, startY: e.clientY, origW: p.w, origH: p.h }
  }

  function resetLayout() { setPanels(DEFAULT_PANELS) }

  const pbox = (id: string) => panels.find((p) => p.id === id)!

  // ── Mic/cam
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(true)

  // ── Chat
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT)
  const [chatAiLoading, setChatAiLoading] = useState(false)

  async function sendChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setChatMessages((p) => [...p, { id: String(Date.now()), user: 'You', initials: 'YO', color: '#6366F1', time, text: msg }])
    const isQ = msg.endsWith('?') || /^(what|how|why|can|is|does|should)/i.test(msg)
    if (isQ) {
      setChatAiLoading(true)
      try {
        const answer = await askGemini(msg, `Live webinar session ${roomId}. Reply briefly as an AI assistant.`)
        const t2 = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setChatMessages((p) => [...p, { id: String(Date.now()), user: 'AI Assistant', initials: 'AI', color: '#6366F1', time: t2, text: answer }])
      } finally { setChatAiLoading(false) }
    }
  }

  // ── Learn
  const [learnTab, setLearnTab] = useState<'chat' | 'transcript'>('chat')
  const [learnQuery, setLearnQuery] = useState('')
  const [learnLoading, setLearnLoading] = useState(false)
  const [learnMsgs, setLearnMsgs] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string }>>([])
  const learnEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { learnEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [learnMsgs])

  async function askLearn(e: React.FormEvent) {
    e.preventDefault()
    if (!learnQuery.trim() || learnLoading) return
    const q = learnQuery.trim(); setLearnQuery('')
    setLearnMsgs((p) => [...p, { id: String(Date.now()), role: 'user', text: q }])
    setLearnLoading(true)
    try {
      const ans = await askGemini(q, `Live webinar room: ${roomId}. Help the attendee understand the session.`)
      setLearnMsgs((p) => [...p, { id: String(Date.now() + 1), role: 'ai', text: ans }])
    } catch {
      setLearnMsgs((p) => [...p, { id: String(Date.now() + 1), role: 'ai', text: 'Unable to reach AI.' }])
    } finally { setLearnLoading(false) }
  }

  // ── Play
  const [playPrompt, setPlayPrompt] = useState('Futuristic race car, motion blur, cinematic, 16:9')
  const [playLoading, setPlayLoading] = useState(false)
  const [playOutput, setPlayOutput] = useState('')

  async function runPlay() {
    if (!playPrompt.trim() || playLoading) return
    setPlayLoading(true); setPlayOutput('')
    try {
      const r = await askGemini(
        `Act as an AI image API. For this prompt: "${playPrompt}" — describe what the generated image looks like (style, composition, lighting, mood) in 3-4 sentences. Then give 3 improved prompt variations.`,
        'AI image generation playground'
      )
      setPlayOutput(r)
    } catch { setPlayOutput('API error — check your Gemini key.') }
    finally { setPlayLoading(false) }
  }

  // ── Canvas
  const [nodePositions, setNodePositions] = useState(NODE_INIT)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showRulers, setShowRulers] = useState(false)
  const [snapNodes, setSnapNodes] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [activeTool, setActiveTool] = useState('cursor')
  const nodeDragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!nodeDragRef.current || !canvasRef.current) return
      const { id, ox, oy } = nodeDragRef.current
      const rect = canvasRef.current.getBoundingClientRect()
      let x = (e.clientX - rect.left) / zoomLevel - ox
      let y = (e.clientY - rect.top) / zoomLevel - oy
      if (snapNodes) { x = Math.round(x / 20) * 20; y = Math.round(y / 20) * 20 }
      setNodePositions((p) => ({ ...p, [id]: { x: Math.max(0, x), y: Math.max(0, y) } }))
    }
    const onUp = () => { nodeDragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [zoomLevel, snapNodes])

  // ── Render panel content
  function renderContent(id: string, box: PanelBox) {
    if (box.minimized) return null

    if (id === 'live') return (
      <div className="flex-1 bg-[#0F172A] relative overflow-hidden min-h-0 rounded-b-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #020617 100%)' }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#6366f1 0,#6366f1 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#6366f1 0,#6366f1 1px,transparent 0,transparent 40px)' }} />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/80 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          <span className="text-[9px] font-bold text-white tracking-wide">LIVE</span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm">
          <Users size={9} className="text-white/70" />
          <span className="text-[9px] text-white/70 font-medium">128</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-300/60">P</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0F172A]/80 backdrop-blur-sm">
          {[
            { icon: micOn ? <Mic size={12} /> : <MicOff size={12} />, active: micOn, fn: () => setMicOn(!micOn) },
            { icon: camOn ? <Video size={12} /> : <VideoOff size={12} />, active: camOn, fn: () => setCamOn(!camOn) },
            { icon: <ScreenShare size={12} />, active: false, fn: () => {} },
            { icon: <MoreHorizontal size={12} />, active: false, fn: () => {} },
          ].map((b, i) => (
            <button key={i} onClick={b.fn} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${b.active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}>
              {b.icon}
            </button>
          ))}
        </div>
      </div>
    )

    if (id === 'chat') return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
          {chatMessages.map((m) => (
            <div key={m.id} className="flex gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: m.color }}>{m.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-semibold text-[#111827]">{m.user}</span>
                  <span className="text-[9px] text-[#9CA3AF]">{m.time}</span>
                </div>
                <p className="text-[10px] text-[#374151] leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {chatAiLoading && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-50">
              <Brain size={10} className="text-indigo-400 animate-pulse" />
              <span className="text-[10px] text-indigo-500">AI responding…</span>
            </div>
          )}
        </div>
        <form onSubmit={sendChat} className="flex gap-2 px-3 py-2.5 border-t border-[#F0F0F5] flex-shrink-0">
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            placeholder="Message… (? for AI reply)"
            className="flex-1 text-[11px] bg-[#F7F7FA] border border-[#E8E8EF] rounded-lg px-2.5 py-1.5 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-indigo-300 min-w-0"
          />
          <button type="submit" className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 flex-shrink-0"><Send size={11} /></button>
        </form>
      </div>
    )

    if (id === 'canvas') return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Canvas toolbar */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#F0F0F5] bg-white flex-shrink-0">
          {[
            { id: 'cursor', icon: <MousePointer2 size={12} />, title: 'Select' },
            { id: 'move',   icon: <Move size={12} />,          title: 'Pan'    },
            { id: 'text',   icon: <Type size={12} />,          title: 'Text'   },
            { id: 'frame',  icon: <Frame size={12} />,         title: 'Frame'  },
          ].map((t) => (
            <button key={t.id} title={t.title} onClick={() => setActiveTool(t.id)}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${activeTool === t.id ? 'bg-indigo-50 text-indigo-600' : 'text-[#9CA3AF] hover:bg-gray-100'}`}>
              {t.icon}
            </button>
          ))}
          <div className="w-px h-4 bg-[#F0F0F5] mx-1" />
          <button title="Grid" onClick={() => setShowGrid(!showGrid)} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${showGrid ? 'bg-indigo-50 text-indigo-600' : 'text-[#9CA3AF] hover:bg-gray-100'}`}><Grid3x3 size={12} /></button>
          <button title="Rulers" onClick={() => setShowRulers(!showRulers)} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${showRulers ? 'bg-indigo-50 text-indigo-600' : 'text-[#9CA3AF] hover:bg-gray-100'}`}><Ruler size={12} /></button>
          <button title="Snap" onClick={() => setSnapNodes(!snapNodes)} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${snapNodes ? 'bg-indigo-50 text-indigo-600' : 'text-[#9CA3AF] hover:bg-gray-100'}`}><Magnet size={12} /></button>
          <div className="flex-1" />
          <span className="text-[10px] font-mono text-[#9CA3AF]">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel((z) => Math.min(3, z + 0.1))} className="w-5 h-5 flex items-center justify-center rounded text-[#9CA3AF] hover:bg-gray-100"><ZoomIn size={11} /></button>
          <button onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.1))} className="w-5 h-5 flex items-center justify-center rounded text-[#9CA3AF] hover:bg-gray-100"><ZoomOut size={11} /></button>
        </div>
        {/* Canvas area */}
        <div className="flex-1 relative overflow-auto min-h-0 canvas-grid">
          <div ref={canvasRef} className="relative" style={{ width: 760, height: 480, transform: `scale(${zoomLevel})`, transformOrigin: 'top left',
            backgroundImage: showGrid ? 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)' : 'none', backgroundSize: '20px 20px' }}>
            <CanvasArrows positions={nodePositions} />
            {NODE_DEFS.map((def) => (
              <CanvasNode key={def.id} def={def} pos={nodePositions[def.id] ?? { x: 0, y: 0 }}
                selected={selectedNode === def.id} onSelect={setSelectedNode}
                onDragStart={(id, ox, oy) => { nodeDragRef.current = { id, ox, oy } }}
              />
            ))}
          </div>
        </div>
      </div>
    )

    if (id === 'learn') return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex border-b border-[#F0F0F5] px-3 flex-shrink-0">
          {[{ id: 'chat' as const, label: 'Ask AI' }, { id: 'transcript' as const, label: 'Transcript' }].map((t) => (
            <button key={t.id} onClick={() => setLearnTab(t.id)}
              className={`px-3 py-2 text-[11px] font-medium border-b-2 -mb-px transition-colors ${learnTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#9CA3AF] hover:text-[#374151]'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
          {learnTab === 'chat' && (
            <>
              {learnMsgs.length === 0 && (
                <div className="text-center py-8">
                  <Brain size={24} className="text-[#E5E7EB] mx-auto mb-2" />
                  <p className="text-[11px] text-[#9CA3AF]">Ask anything about this session.</p>
                </div>
              )}
              {learnMsgs.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'ai' && <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Brain size={10} className="text-indigo-600" /></div>}
                  <div className={`max-w-[90%] px-2.5 py-2 rounded-lg text-[11px] leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#F7F7FA] border border-[#E8E8EF] text-[#374151] whitespace-pre-wrap'}`}>{m.text}</div>
                </div>
              ))}
              {learnLoading && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0"><Brain size={10} className="text-indigo-600" /></div>
                  <div className="flex gap-1 px-2.5 py-2 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF]">
                    {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={learnEndRef} />
            </>
          )}
          {learnTab === 'transcript' && <p className="text-[11px] text-[#9CA3AF] italic">Transcript will appear in real time.</p>}
        </div>
        {learnTab === 'chat' && (
          <form onSubmit={askLearn} className="flex gap-2 px-3 py-2.5 border-t border-[#F0F0F5] flex-shrink-0">
            <input value={learnQuery} onChange={(e) => setLearnQuery(e.target.value)}
              placeholder="Ask about this session…"
              className="flex-1 text-[11px] bg-[#F7F7FA] border border-[#E8E8EF] rounded-lg px-2.5 py-1.5 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-indigo-300 min-w-0"
            />
            <button type="submit" disabled={!learnQuery.trim() || learnLoading}
              className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-40 flex-shrink-0">
              {learnLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            </button>
          </form>
        )}
      </div>
    )

    if (id === 'play') return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-2.5 min-h-0 space-y-2">
          <div>
            <span className="text-[10px] font-semibold text-[#374151] block mb-1">Prompt</span>
            <textarea value={playPrompt} onChange={(e) => setPlayPrompt(e.target.value)} rows={3}
              className="w-full text-[10px] font-mono bg-[#F7F7FA] border border-[#E8E8EF] rounded-lg p-2 text-[#374151] leading-relaxed resize-none focus:outline-none focus:border-violet-300"
            />
          </div>
          <button onClick={runPlay} disabled={playLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[10px] font-medium hover:bg-violet-500 disabled:opacity-40 transition-colors ml-auto">
            {playLoading ? <><Loader2 size={10} className="animate-spin" /> Running…</> : <><Sparkles size={10} /> Run</>}
          </button>
          {playOutput ? (
            <div className="text-[10px] text-[#374151] bg-[#F7F7FA] border border-[#E8E8EF] rounded-lg p-2.5 leading-relaxed whitespace-pre-wrap">{playOutput}</div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg" style={{ background: `linear-gradient(135deg, #ede9fe ${i * 20}%, #c4b5fd)` }} />)}
            </div>
          )}
        </div>
      </div>
    )

    return null
  }

  // Panel meta
  const panelMeta: Record<string, { title: string; icon: React.ReactNode; headerChildren?: React.ReactNode }> = {
    live: {
      title: 'Live Session',
      icon: <Radio size={13} className="text-red-500" />,
      headerChildren: (
        <>
          <span className="text-[9px] font-mono text-[#9CA3AF]">{roomId}</span>
          <span className="flex items-center gap-1 text-[9px] text-[#9CA3AF]"><Users size={10} />128</span>
        </>
      ),
    },
    chat: {
      title: 'Live Chat',
      icon: (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
        </span>
      ),
    },
    canvas: {
      title: 'Canvas',
      icon: <Frame size={13} className="text-indigo-500" />,
    },
    learn: {
      title: 'Learn',
      icon: <BookOpen size={13} className="text-blue-500" />,
      headerChildren: (
        <button onClick={() => setLearnTab('chat')}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-medium hover:bg-indigo-500 transition-colors">
          <Sparkles size={9} /> Ask AI
        </button>
      ),
    },
    play: {
      title: 'Playground',
      icon: <Code2 size={13} className="text-violet-500" />,
    },
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F7F7FA]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top bar */}
      <div className="h-12 flex items-center px-4 gap-3 bg-white border-b border-[#E8E8EF] flex-shrink-0 z-50">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V10L7 13.5L1 10V4.5L7 1Z" fill="white" fillOpacity=".9" />
              <path d="M7 1L13 4.5L7 8L1 4.5L7 1Z" fill="white" fillOpacity=".5" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[#111827]">Sandbox</span>
        </div>

        <div className="w-px h-5 bg-[#E8E8EF]" />

        <div className="flex items-center gap-1">
          {[
            { label: 'Live',  dot: true  },
            { label: 'Learn', dot: false },
            { label: 'Play',  dot: false },
          ].map(({ label, dot }) => (
            <button key={label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${label === 'Live' ? 'bg-red-50 text-red-600' : 'text-[#6B7280] hover:bg-gray-100'}`}>
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

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button onClick={resetLayout} title="Reset layout" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E8EF] text-xs text-[#6B7280] hover:bg-gray-50 transition-colors">
            <LayoutGrid size={12} /> Reset layout
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E8E8EF] text-xs font-medium text-[#374151] hover:bg-gray-50 transition-colors">
            <Share2 size={12} /> Share
          </button>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]"><Users size={13} /><span className="font-medium">128</span></div>
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">KN</div>
          <button onClick={() => navigate({ to: '/live' })} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Canvas — draggable panels */}
      <div className="flex-1 relative overflow-auto canvas-grid">
        {panels.map((box) => {
          const meta = panelMeta[box.id]
          if (!meta) return null
          return (
            <div
              key={box.id}
              onMouseDown={() => bringToFront(box.id)}
              style={{
                position: 'absolute',
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.minimized ? 40 : box.h,
                zIndex: box.z,
              }}
              className="flex flex-col bg-white rounded-2xl border border-[#E8E8EF] panel-shadow hover:panel-shadow-active transition-shadow overflow-hidden"
            >
              <PanelHeader
                title={meta.title}
                icon={meta.icon}
                onDragStart={(e) => startDrag(box.id, e)}
                onMinimize={() => updatePanel(box.id, { minimized: !box.minimized })}
                minimized={box.minimized}
              >
                {meta.headerChildren}
              </PanelHeader>

              {renderContent(box.id, box)}

              {!box.minimized && <ResizeHandle onResizeStart={(e) => startResize(box.id, e)} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
