import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  X, Share2, Save, Grid, Bell, Users, Mic, MicOff, Video, VideoOff,
  ScreenShare, MoreHorizontal, Send, ChevronDown, ZoomIn, ZoomOut,
  MousePointer2, Move, Type, Frame, Maximize2, Magnet, Crosshair,
  ExternalLink, Lock, Settings, LayoutTemplate, Ruler, Grid3x3,
  Plus, Copy, Trash2, Focus, AlignJustify, BookOpen, Play as PlayIcon,
  ChevronRight, ToggleLeft, ToggleRight, Sparkles, Code2
} from 'lucide-react'

// ─── Data & Types ────────────────────────────────────────────────────────────

interface Preset {
  id: string
  label: string
  cols: string
  live: number
  learn: number
  play: number
}

const PRESETS: Preset[] = [
  { id: 'presenter-focus', label: 'Presenter Focus', cols: '1fr 0.6fr 0.5fr',   live: 65, learn: 20, play: 15 },
  { id: 'canvas-focus',    label: 'Canvas Focus',    cols: '280px 1fr 320px',    live: 25, learn: 20, play: 55 },
  { id: 'learn-focus',     label: 'Learn Focus',     cols: '280px 0.6fr 1fr',    live: 20, learn: 65, play: 15 },
  { id: 'play-focus',      label: 'Play Focus',      cols: '240px 0.5fr 1fr',    live: 15, learn: 15, play: 70 },
  { id: 'balanced',        label: 'Balanced',        cols: '1fr 1fr 1fr',         live: 34, learn: 33, play: 33 },
  { id: 'workshop',        label: 'Workshop',        cols: '240px 1fr 380px',     live: 30, learn: 35, play: 35 },
  { id: 'co-pilot',        label: 'Co-Pilot',        cols: '300px 0.8fr 400px',  live: 25, learn: 30, play: 45 },
  { id: 'dual-canvas',     label: 'Dual Canvas',     cols: '0px 1fr 1fr',         live: 0,  learn: 50, play: 50 },
  { id: 'research-mode',   label: 'Research Mode',   cols: '0px 0.4fr 1fr',      live: 0,  learn: 70, play: 30 },
  { id: 'build-mode',      label: 'Build Mode',      cols: '240px 0.5fr 1fr',    live: 20, learn: 20, play: 60 },
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
  { id: '1', user: 'Alex Chen',    initials: 'AC', color: '#6366F1', time: '2:14 PM', text: 'Love the workflow canvas approach here!' },
  { id: '2', user: 'Maya Patel',   initials: 'MP', color: '#EC4899', time: '2:15 PM', text: 'Can you show how the brief node connects to output?' },
  { id: '3', user: 'Jordan Lee',   initials: 'JL', color: '#10B981', time: '2:16 PM', text: 'The multi-model comparison in the playground is 🔥' },
  { id: '4', user: 'Sam Torres',   initials: 'ST', color: '#F59E0B', time: '2:17 PM', text: 'What aspect ratio settings work best for cinematic?' },
  { id: '5', user: 'Riley Kim',    initials: 'RK', color: '#3B82F6', time: '2:18 PM', text: 'Great point on keeping human judgment in the loop' },
  { id: '6', user: 'Dana Wright',  initials: 'DW', color: '#8B5CF6', time: '2:19 PM', text: 'The reference image node is exactly what I needed' },
]

interface CanvasNode {
  id: string
  label: string
  tag: string
  badge?: string
  color: string
  bgColor: string
  x: number
  y: number
  hasImages?: boolean
  description?: string
}

const CANVAS_NODES: CanvasNode[] = [
  { id: 'brief',    label: 'Brief',    tag: 'INPUT',    color: '#7C3AED', bgColor: '#EDE9FE', x: 40,  y: 60,  description: 'Creative direction & goals' },
  { id: 'insight',  label: 'Insight',  tag: 'ANALYSIS', badge: 'AI', color: '#2563EB', bgColor: '#DBEAFE', x: 230, y: 60,  description: 'AI-powered insights' },
  { id: 'concept',  label: 'Concept',  tag: 'OUTPUT',   color: '#059669', bgColor: '#D1FAE5', x: 420, y: 60,  hasImages: true },
  { id: 'prompt',   label: 'Prompt',   tag: 'CRAFT',    color: '#7C3AED', bgColor: '#EDE9FE', x: 40,  y: 260, description: 'Optimised prompt text' },
  { id: 'generate', label: 'Generate', tag: 'AI RUN',   badge: 'v2', color: '#2563EB', bgColor: '#DBEAFE', x: 230, y: 260, hasImages: true },
  { id: 'output',   label: 'Output',   tag: 'FINAL',    color: '#059669', bgColor: '#D1FAE5', x: 420, y: 260, hasImages: true },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 border-b border-[#E4E4EC] bg-white flex-shrink-0 ${className}`}>
      {children}
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  active = false,
  className = '',
  title = '',
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
      className={`flex items-center justify-center rounded-md transition-colors ${active ? 'bg-indigo-50 text-indigo-600' : 'text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]'} ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Canvas Node ──────────────────────────────────────────────────────────────

function CanvasNodeCard({
  node,
  selected,
  onSelect,
}: {
  node: CanvasNode
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div
      onClick={() => onSelect(node.id)}
      style={{ left: node.x, top: node.y }}
      className={`absolute w-[150px] bg-white rounded-xl border shadow-sm cursor-pointer transition-all select-none
        ${selected ? 'border-indigo-400 shadow-indigo-100 shadow-md ring-2 ring-indigo-200' : 'border-[#E4E4EC] hover:border-[#CBD5E1] hover:shadow-md'}`}
    >
      {/* Header */}
      <div
        className="rounded-t-xl px-2.5 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: node.bgColor }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
          <span className="text-[10px] font-bold truncate" style={{ color: node.color }}>{node.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-medium opacity-70" style={{ color: node.color }}>{node.tag}</span>
          {node.badge && (
            <span
              className="text-[9px] font-bold px-1 rounded"
              style={{ backgroundColor: node.color, color: '#fff' }}
            >
              {node.badge}
            </span>
          )}
        </div>
      </div>
      {/* Body */}
      <div className="p-2">
        {node.description && (
          <p className="text-[10px] text-[#6B7280] mb-2">{node.description}</p>
        )}
        {node.hasImages && (
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-8 rounded"
                style={{
                  background: `linear-gradient(135deg, ${node.bgColor}, ${node.color}33)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Canvas SVG Arrows ────────────────────────────────────────────────────────

function CanvasArrows() {
  // Each node is 150px wide, positioned at (x, y)
  // Arrow: from right edge of source to left edge of target
  const nw = 150
  const nh = 80 // approximate node height

  const arrows: Array<{ from: [number, number]; to: [number, number] }> = [
    // Brief -> Insight (horizontal)
    { from: [40 + nw, 60 + nh / 2], to: [230, 60 + nh / 2] },
    // Insight -> Concept (horizontal)
    { from: [230 + nw, 60 + nh / 2], to: [420, 60 + nh / 2] },
    // Brief -> Prompt (vertical)
    { from: [40 + nw / 2, 60 + nh], to: [40 + nw / 2, 260] },
    // Prompt -> Generate (horizontal)
    { from: [40 + nw, 260 + nh / 2], to: [230, 260 + nh / 2] },
    // Generate -> Output (horizontal)
    { from: [230 + nw, 260 + nh / 2], to: [420, 260 + nh / 2] },
    // Insight -> Generate (vertical)
    { from: [230 + nw / 2, 60 + nh], to: [230 + nw / 2, 260] },
  ]

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#CBD5E1" />
        </marker>
      </defs>
      {arrows.map((a, i) => {
        const [x1, y1] = a.from
        const [x2, y2] = a.to
        const isHoriz = Math.abs(y2 - y1) < 10
        const cp1x = isHoriz ? x1 + (x2 - x1) * 0.5 : x1
        const cp1y = isHoriz ? y1 : y1 + (y2 - y1) * 0.5
        const cp2x = isHoriz ? x1 + (x2 - x1) * 0.5 : x2
        const cp2y = isHoriz ? y2 : y1 + (y2 - y1) * 0.5
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
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
  livePct,
  learnPct,
  playPct,
  onChange,
}: {
  livePct: number
  learnPct: number
  playPct: number
  onChange: (live: number, learn: number, play: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  // Triangle vertices in SVG coords (100x80)
  const W = 100
  const H = 80
  const vLive  = [W / 2, 5]         // top — Live
  const vLearn = [5, H - 5]         // bottom-left — Learn
  const vPlay  = [W - 5, H - 5]     // bottom-right — Play

  // Convert barycentric (live, learn, play summing to 100) -> SVG point
  function baryToSvg(l: number, le: number, p: number): [number, number] {
    const total = l + le + p || 1
    const la = l / total
    const lea = le / total
    const pa = p / total
    return [
      la * vLive[0] + lea * vLearn[0] + pa * vPlay[0],
      la * vLive[1] + lea * vLearn[1] + pa * vPlay[1],
    ]
  }

  // Convert SVG point -> barycentric percentages
  function svgToBary(px: number, py: number): [number, number, number] {
    // Use area-based barycentric coordinates
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
    return [Math.round((cl / sum) * 100), Math.round((cle / sum) * 100), Math.round(100 - Math.round((cl / sum) * 100) - Math.round((cle / sum) * 100))]
  }

  const [dotX, dotY] = baryToSvg(livePct, learnPct, playPct)

  function getSvgCoords(e: React.MouseEvent | MouseEvent): [number, number] {
    const svg = svgRef.current
    if (!svg) return [0, 0]
    const rect = svg.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY]
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
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const pts = `${vLive[0]},${vLive[1]} ${vLearn[0]},${vLearn[1]} ${vPlay[0]},${vPlay[1]}`

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width={100}
        height={80}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
      >
        <defs>
          <linearGradient id="triGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <polygon points={pts} fill="url(#triGrad)" stroke="#E4E4EC" strokeWidth="1" />
        {/* Lines from dot to vertices */}
        <line x1={dotX} y1={dotY} x2={vLive[0]}  y2={vLive[1]}  stroke="#EF4444" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="2,2" />
        <line x1={dotX} y1={dotY} x2={vLearn[0]} y2={vLearn[1]} stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="2,2" />
        <line x1={dotX} y1={dotY} x2={vPlay[0]}  y2={vPlay[1]}  stroke="#8B5CF6" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="2,2" />
        {/* Vertex dots */}
        <circle cx={vLive[0]}  cy={vLive[1]}  r="3" fill="#EF4444" />
        <circle cx={vLearn[0]} cy={vLearn[1]} r="3" fill="#3B82F6" />
        <circle cx={vPlay[0]}  cy={vPlay[1]}  r="3" fill="#8B5CF6" />
        {/* Control dot */}
        <circle cx={dotX} cy={dotY} r="4" fill="#6366F1" stroke="white" strokeWidth="1.5" />
      </svg>
      {/* Labels */}
      <div className="flex justify-between w-full text-[9px] font-medium px-0.5">
        <span className="text-red-500">L {livePct}%</span>
        <span className="text-blue-500">N {learnPct}%</span>
        <span className="text-violet-500">P {playPct}%</span>
      </div>
    </div>
  )
}

// ─── Layout Thumbnails ────────────────────────────────────────────────────────

function LayoutThumb({
  preset,
  active,
  onClick,
}: {
  preset: Preset
  active: boolean
  onClick: () => void
}) {
  // Parse cols to approximate widths for 3 columns in a 40x24 thumb
  const isLeftHidden = preset.cols.startsWith('0px')
  const lW = isLeftHidden ? 0 : 12
  const rW = preset.id === 'research-mode' || preset.id === 'learn-focus' ? 18 : preset.id === 'play-focus' || preset.id === 'build-mode' ? 20 : 14
  const cW = 40 - lW - rW

  return (
    <button
      onClick={onClick}
      className={`rounded p-0.5 border transition-all ${active ? 'border-indigo-400 bg-indigo-50' : 'border-[#E4E4EC] bg-white hover:border-[#CBD5E1]'}`}
    >
      <svg width="40" height="24" viewBox="0 0 40 24">
        {lW > 0 && <rect x="1" y="1" width={lW - 1} height="22" rx="1" fill={active ? '#C7D2FE' : '#F3F4F6'} />}
        <rect x={lW + 1} y="1" width={cW - 2} height="22" rx="1" fill={active ? '#818CF8' : '#E5E7EB'} />
        <rect x={lW + cW + 1} y="1" width={rW - 2} height="22" rx="1" fill={active ? '#C7D2FE' : '#F3F4F6'} />
      </svg>
    </button>
  )
}

// ─── Main Workspace Component ─────────────────────────────────────────────────

export default function Workspace() {
  const { roomId } = useParams({ from: '/live/$roomId' })
  const navigate = useNavigate()

  const [preset, setPreset] = useState('canvas-focus')
  const [livePct, setLivePct] = useState(25)
  const [learnPct, setLearnPct] = useState(20)
  const [playPct, setPlayPct] = useState(55)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT)
  const [learnTab, setLearnTab] = useState<'notes' | 'transcript' | 'sources'>('notes')
  const [playTab, setPlayTab] = useState<'api' | 'prompts' | 'models' | 'tools'>('api')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showRulers, setShowRulers] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [infiniteCanvas, setInfiniteCanvas] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [activeTool, setActiveTool] = useState('cursor')

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

  function handleTriangleChange(l: number, le: number, p: number) {
    setLivePct(l)
    setLearnPct(le)
    setPlayPct(p)
  }

  // ─── TopBar ─────────────────────────────────────────────────────────────────

  const TopBar = (
    <div className="h-12 flex items-center px-3 gap-3 bg-white border-b border-[#E4E4EC] flex-shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V10L7 13.5L1 10V4.5L7 1Z" fill="white" fillOpacity="0.9" />
            <path d="M7 1L13 4.5L7 8L1 4.5L7 1Z" fill="white" fillOpacity="0.5" />
          </svg>
        </div>
        <span className="text-sm font-bold text-[#111827]">Sandbox</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[#E4E4EC]" />

      {/* Tab buttons */}
      <div className="flex items-center gap-1">
        {[
          { label: 'Live', dot: true },
          { label: 'Learn', dot: false },
          { label: 'Play', dot: false },
        ].map(({ label, dot }) => (
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

      {/* Priority Mix button */}
      <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors ml-1">
        <span className="text-[10px]">◆</span>
        Priority Mix
      </button>

      <div className="flex-1" />

      {/* Right controls */}
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
          Save layout
        </button>
        <IconBtn className="w-8 h-8"><Grid size={15} /></IconBtn>
        <IconBtn className="w-8 h-8"><Bell size={15} /></IconBtn>
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
          KN
        </div>
        <button
          onClick={() => navigate({ to: '/live' })}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-gray-100 hover:text-[#111827] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )

  // ─── PriorityBar ─────────────────────────────────────────────────────────────

  const PriorityBar = (
    <div className="h-9 flex items-center px-4 gap-4 bg-white border-b border-[#E4E4EC] flex-shrink-0">
      <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Priority</span>
      {/* Segmented bar */}
      <div className="flex items-center flex-1 max-w-xs gap-0 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-400 transition-all duration-300"
          style={{ width: `${livePct}%` }}
        />
        <div
          className="h-full bg-blue-400 transition-all duration-300"
          style={{ width: `${learnPct}%` }}
        />
        <div
          className="h-full bg-violet-400 transition-all duration-300"
          style={{ width: `${playPct}%` }}
        />
      </div>
      {/* Labels */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          Live {livePct}%
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-blue-500">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          Learn {learnPct}%
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-violet-500">
          <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
          Play {playPct}%
        </span>
      </div>
      <div className="flex-1" />
      <span className="text-[10px] text-[#9CA3AF]">Room: {roomId}</span>
    </div>
  )

  // ─── LayoutStrip ─────────────────────────────────────────────────────────────

  const LayoutStrip = (
    <div className="h-11 flex items-center px-3 gap-2 bg-white border-b border-[#E4E4EC] flex-shrink-0 overflow-x-auto scrollbar-none">
      <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider flex-shrink-0">Layouts</span>
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => applyPreset(p)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border transition-all
            ${preset === p.id
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'bg-white border-[#E4E4EC] text-[#6B7280] hover:bg-gray-50 hover:border-[#CBD5E1]'
            }`}
        >
          {p.label}
        </button>
      ))}
      <button className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-[#E4E4EC] text-[#6B7280] hover:bg-gray-50 text-xs">
        ···
      </button>
    </div>
  )

  // ─── ToolSidebar ─────────────────────────────────────────────────────────────

  const tools = [
    { icon: <LayoutTemplate size={16} />, label: 'Layout', id: 'layout', active: true },
    { icon: <Ruler size={16} />, label: 'Ruler', id: 'ruler' },
    { icon: <Grid3x3 size={16} />, label: 'Grid', id: 'grid' },
    { icon: <Magnet size={16} />, label: 'Snap', id: 'snap' },
    { icon: <Crosshair size={16} />, label: 'Focus', id: 'focus' },
    { icon: <ExternalLink size={16} />, label: 'Pop', id: 'pop' },
    { icon: <Lock size={16} />, label: 'Lock', id: 'lock' },
  ]

  const ToolSidebar = (
    <div className="w-[52px] bg-[#1A1A2E] flex flex-col items-center py-2 gap-0.5 flex-shrink-0">
      {tools.map(({ icon, label, id, active }) => (
        <button
          key={id}
          className={`w-[38px] h-[38px] flex flex-col items-center justify-center rounded-lg transition-colors gap-0.5
            ${active ? 'bg-indigo-600 text-white' : 'text-[#6B7280] hover:text-white hover:bg-white/10'}`}
        >
          {icon}
          <span className="text-[7px] leading-none opacity-70">{label}</span>
        </button>
      ))}
      <div className="w-6 h-px bg-[#2A2A40] my-1" />
      <div className="flex-1" />
      <button className="w-[38px] h-[38px] flex flex-col items-center justify-center rounded-lg text-[#6B7280] hover:text-white hover:bg-white/10 transition-colors gap-0.5">
        <Settings size={16} />
        <span className="text-[7px] leading-none opacity-70">Setup</span>
      </button>
    </div>
  )

  // ─── LivePanel ───────────────────────────────────────────────────────────────

  const LivePanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-lg overflow-hidden flex-1 min-h-0">
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

      {/* Video area */}
      <div className="flex-1 bg-[#111827] relative overflow-hidden min-h-0">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a1a3e 0%, #111827 50%, #0d1117 100%)',
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #6366F1 0, #6366F1 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #6366F1 0, #6366F1 1px, transparent 0, transparent 50%)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* LIVE badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/80 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          <span className="text-[9px] font-bold text-white">LIVE</span>
        </div>
        {/* Participant count */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
          <Users size={9} className="text-white opacity-70" />
          <span className="text-[9px] text-white opacity-70">128</span>
        </div>
        {/* Presenter silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-300/60">P</span>
          </div>
        </div>
        {/* Name tag */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
            <span className="text-[10px] text-white font-medium">Presenter · Host</span>
          </div>
        </div>
      </div>

      {/* Video controls */}
      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1A1A2E] flex-shrink-0">
        {[
          { icon: micOn ? <Mic size={13} /> : <MicOff size={13} />, active: micOn, onClick: () => setMicOn(!micOn) },
          { icon: camOn ? <Video size={13} /> : <VideoOff size={13} />, active: camOn, onClick: () => setCamOn(!camOn) },
          { icon: <ScreenShare size={13} />, active: false, onClick: () => {} },
          { icon: <MoreHorizontal size={13} />, active: false, onClick: () => {} },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors
              ${btn.active ? 'bg-white/15 text-white' : 'bg-white/5 text-[#6B7280] hover:bg-white/10 hover:text-white'}`}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  )

  // ─── ChatPanel ───────────────────────────────────────────────────────────────

  const ChatPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-lg overflow-hidden" style={{ height: '200px', flexShrink: 0 }}>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mt-0.5"
              style={{ backgroundColor: msg.color }}
            >
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

      {/* Input */}
      <form onSubmit={sendChat} className="flex items-center gap-2 px-3 py-2 border-t border-[#E4E4EC] flex-shrink-0">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Say something..."
          className="flex-1 text-[11px] text-[#111827] placeholder-[#9CA3AF] bg-[#F9FAFB] border border-[#E4E4EC] rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-300 min-w-0"
        />
        <button
          type="submit"
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          <Send size={10} />
        </button>
      </form>
    </div>
  )

  // ─── CanvasPanel ─────────────────────────────────────────────────────────────

  const canvasTools = [
    { id: 'cursor', icon: <MousePointer2 size={13} /> },
    { id: 'move',   icon: <Move size={13} /> },
    { id: 'text',   icon: <Type size={13} /> },
    { id: 'frame',  icon: <Frame size={13} /> },
    { id: 'expand', icon: <Maximize2 size={13} /> },
  ]

  const CanvasPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-lg overflow-hidden h-full">
      {/* Canvas toolbar */}
      <PanelHeader>
        <div className="flex items-center gap-1">
          {canvasTools.map((t) => (
            <IconBtn
              key={t.id}
              active={activeTool === t.id}
              onClick={() => setActiveTool(t.id)}
              className="w-7 h-7"
            >
              {t.icon}
            </IconBtn>
          ))}
          <div className="w-px h-4 bg-[#E4E4EC] mx-1" />
          <span className="text-[11px] text-[#6B7280] font-mono">{Math.round(zoomLevel * 100)}%</span>
          <IconBtn className="w-6 h-6" onClick={() => setZoomLevel((z) => Math.min(3, z + 0.1))}>
            <ZoomIn size={11} />
          </IconBtn>
          <IconBtn className="w-6 h-6" onClick={() => setZoomLevel((z) => Math.max(0.1, z - 0.1))}>
            <ZoomOut size={11} />
          </IconBtn>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#6B7280]">Creative Workflow</span>
          <IconBtn className="w-6 h-6"><MoreHorizontal size={12} /></IconBtn>
        </div>
      </PanelHeader>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden min-h-0 bg-[#F4F4F7]">
        {/* Top ruler */}
        {showRulers && (
          <div className="absolute top-0 left-5 right-0 h-5 bg-white border-b border-[#E4E4EC] z-10 overflow-hidden flex-shrink-0">
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
        {/* Left ruler */}
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

        {/* Canvas content */}
        <div
          className="absolute overflow-auto"
          style={{
            top: showRulers ? '20px' : '0',
            left: showRulers ? '20px' : '0',
            right: 0,
            bottom: 0,
          }}
        >
          <div
            className="relative"
            style={{
              width: '700px',
              height: '420px',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              backgroundImage: showGrid
                ? 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)'
                : 'none',
              backgroundSize: showGrid ? '20px 20px' : undefined,
            }}
          >
            <CanvasArrows />
            {CANVAS_NODES.map((node) => (
              <CanvasNodeCard
                key={node.id}
                node={node}
                selected={selectedNode === node.id}
                onSelect={setSelectedNode}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Canvas bottom toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-t border-[#E4E4EC] bg-white flex-shrink-0 overflow-x-auto">
        {[
          { icon: <Plus size={11} />, label: 'Add panel', color: '' },
          { icon: <Copy size={11} />, label: 'Duplicate', color: '' },
          { icon: <ExternalLink size={11} />, label: 'Pop out', color: '' },
          { icon: <Focus size={11} />, label: 'Focus', color: '' },
          { icon: <Lock size={11} />, label: 'Lock', color: '' },
          { icon: <Trash2 size={11} />, label: 'Delete', color: 'text-red-400 hover:text-red-500' },
        ].map(({ icon, label, color }) => (
          <button
            key={label}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors
              ${color || 'text-[#6B7280] hover:bg-gray-100 hover:text-[#374151]'}`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  // ─── LearnPanel ──────────────────────────────────────────────────────────────

  const learnTabs: Array<{ id: 'notes' | 'transcript' | 'sources'; label: string }> = [
    { id: 'notes', label: 'AI Notes' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'sources', label: 'Sources' },
  ]

  const LearnPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-lg overflow-hidden flex-1 min-h-0">
      <PanelHeader>
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-blue-500" />
          <span className="text-xs font-semibold text-[#111827]">Learn</span>
        </div>
        <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-medium hover:bg-indigo-700 transition-colors">
          <Sparkles size={10} />
          Ask AI
        </button>
      </PanelHeader>

      {/* Tabs */}
      <div className="flex border-b border-[#E4E4EC] px-3 flex-shrink-0">
        {learnTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setLearnTab(t.id)}
            className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors -mb-px
              ${learnTab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {learnTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-semibold text-[#111827] uppercase tracking-wider mb-2">Key Takeaways</h4>
              <ul className="space-y-1.5">
                {[
                  'Strong briefs lead to better AI output.',
                  'Use references to guide style and tone.',
                  'Iterate with small changes, not big jumps.',
                  'Test across models for different results.',
                  'Keep human judgment in the loop.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[11px] text-[#374151] leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-semibold text-[#111827] uppercase tracking-wider">Summary</h4>
                <button className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                  <Copy size={11} />
                </button>
              </div>
              <p className="text-[11px] text-[#374151] leading-relaxed p-2.5 bg-[#F9FAFB] rounded-lg border border-[#E4E4EC]">
                Today we explored a full creative workflow using AI — from writing tight briefs to generating polished outputs across multiple models.
              </p>
            </div>
          </div>
        )}
        {learnTab === 'transcript' && (
          <p className="text-[11px] text-[#6B7280] italic">Transcript will appear here in real time during the session.</p>
        )}
        {learnTab === 'sources' && (
          <p className="text-[11px] text-[#6B7280] italic">No sources linked yet.</p>
        )}
      </div>

      {/* Question input */}
      <div className="px-3 py-2 border-t border-[#E4E4EC] flex-shrink-0">
        <input
          placeholder="Ask a question about this session..."
          className="w-full text-[11px] text-[#111827] placeholder-[#9CA3AF] bg-[#F9FAFB] border border-[#E4E4EC] rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-300"
        />
      </div>
    </div>
  )

  // ─── PlayPanel ───────────────────────────────────────────────────────────────

  const playTabs: Array<{ id: 'api' | 'prompts' | 'models' | 'tools'; label: string }> = [
    { id: 'api',     label: 'API' },
    { id: 'prompts', label: 'Prompts' },
    { id: 'models',  label: 'Models' },
    { id: 'tools',   label: 'Tools' },
  ]

  const PlayPanel = (
    <div className="flex flex-col bg-white border border-[#E4E4EC] rounded-lg overflow-hidden flex-shrink-0" style={{ height: '280px' }}>
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

      {/* Tabs */}
      <div className="flex border-b border-[#E4E4EC] px-3 flex-shrink-0">
        {playTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setPlayTab(t.id)}
            className={`px-2.5 py-1.5 text-[11px] font-medium border-b-2 transition-colors -mb-px
              ${playTab === t.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 min-h-0">
        {playTab === 'api' && (
          <div className="space-y-2">
            {/* Method + URL */}
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">POST</span>
              <span className="text-[10px] font-mono text-[#6B7280]">/v1/generate</span>
            </div>
            {/* Body */}
            <div>
              <span className="text-[10px] font-semibold text-[#374151] block mb-1">Body</span>
              <pre className="text-[10px] font-mono bg-[#F9FAFB] border border-[#E4E4EC] rounded-lg p-2 text-[#374151] overflow-x-auto leading-relaxed">
{`{
  "prompt": "Futuristic race car, motion blur, cinematic",
  "style": "cinematic",
  "ar": "16:9"
}`}
              </pre>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-medium hover:bg-blue-700 transition-colors ml-auto">
              <Send size={10} />
              Send
            </button>
            {/* Response */}
            <div>
              <span className="text-[10px] font-semibold text-[#374151] block mb-1">Response</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, #1e1b4b ${i * 20}%, #312e81)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        {playTab !== 'api' && (
          <p className="text-[11px] text-[#6B7280] italic">
            {playTab === 'prompts' ? 'Saved prompts will appear here.' :
             playTab === 'models'  ? 'Available models will be listed here.' :
             'Tool definitions will appear here.'}
          </p>
        )}
      </div>
    </div>
  )

  // ─── BottomBar ───────────────────────────────────────────────────────────────

  // Quick layout thumbs — show first 6 presets
  const thumbPresets = PRESETS.slice(0, 6)

  const BottomBar = (
    <div className="h-[88px] flex items-stretch gap-0 bg-white border-t border-[#E4E4EC] flex-shrink-0 overflow-hidden">

      {/* 1. Priority Mix */}
      <div className="flex flex-col justify-center px-4 gap-1 border-r border-[#E4E4EC] min-w-[160px]">
        <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Priority Mix</span>
        <PriorityTriangle
          livePct={livePct}
          learnPct={learnPct}
          playPct={playPct}
          onChange={handleTriangleChange}
        />
      </div>

      {/* 2. Quick layouts */}
      <div className="flex flex-col justify-center px-4 gap-2 border-r border-[#E4E4EC] min-w-[240px]">
        <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Quick layouts</span>
        <div className="grid grid-cols-6 gap-1">
          {thumbPresets.map((p) => (
            <LayoutThumb
              key={p.id}
              preset={p}
              active={preset === p.id}
              onClick={() => applyPreset(p)}
            />
          ))}
        </div>
      </div>

      {/* 3. Canvas controls */}
      <div className="flex flex-col justify-center px-4 gap-2 border-r border-[#E4E4EC] min-w-[180px]">
        <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Canvas controls</span>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#374151]">Infinite canvas</span>
            <button
              onClick={() => setInfiniteCanvas(!infiniteCanvas)}
              className={`transition-colors ${infiniteCanvas ? 'text-indigo-600' : 'text-[#9CA3AF]'}`}
            >
              {infiniteCanvas ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#374151]">Snap to grid</span>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`transition-colors ${snapToGrid ? 'text-indigo-600' : 'text-[#9CA3AF]'}`}
            >
              {snapToGrid ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#374151]">Rulers</span>
            <button
              onClick={() => setShowRulers(!showRulers)}
              className={`transition-colors ${showRulers ? 'text-indigo-600' : 'text-[#9CA3AF]'}`}
            >
              {showRulers ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. View */}
      <div className="flex flex-col justify-center px-4 gap-2 min-w-[140px]">
        <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider">View</span>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: 'Live',    color: '#EF4444', active: livePct > 0 },
            { label: 'Chat',    color: '#10B981', active: true },
            { label: 'Canvas',  color: '#6366F1', active: true },
            { label: 'Learn',   color: '#3B82F6', active: learnPct > 0 },
            { label: 'Play',    color: '#8B5CF6', active: playPct > 0 },
            { label: 'Tools',   color: '#F59E0B', active: true },
          ].map(({ label, color, active }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-[7px] font-bold"
                style={{
                  backgroundColor: active ? `${color}22` : '#F3F4F6',
                  border: `1px solid ${active ? color + '44' : '#E4E4EC'}`,
                  color: active ? color : '#9CA3AF',
                }}
              >
                {label.slice(0, 1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Zoom level display */}
      <div className="flex items-center gap-2 px-4 border-l border-[#E4E4EC]">
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.25))}
          className="w-6 h-6 flex items-center justify-center rounded border border-[#E4E4EC] text-[#6B7280] hover:bg-gray-50 text-sm"
        >
          −
        </button>
        <span className="text-[10px] font-mono text-[#374151] w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
        <button
          onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
          className="w-6 h-6 flex items-center justify-center rounded border border-[#E4E4EC] text-[#6B7280] hover:bg-gray-50 text-sm"
        >
          +
        </button>
      </div>
    </div>
  )

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F4F4F7]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {TopBar}
      {PriorityBar}
      {LayoutStrip}

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {ToolSidebar}

        {/* Panel grid */}
        <div
          className="flex-1 p-2 gap-2 grid min-h-0"
          style={{
            gridTemplateColumns: currentPreset.cols,
            transition: 'grid-template-columns 400ms ease',
          }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-2 min-h-0 overflow-hidden" style={{ display: currentPreset.cols.startsWith('0px') ? 'none' : 'flex' }}>
            {LivePanel}
            {ChatPanel}
          </div>

          {/* Center column: Canvas */}
          <div className="min-h-0 overflow-hidden">
            {CanvasPanel}
          </div>

          {/* Right column */}
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
