import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Zap, Share2, Save, Bell, MoreHorizontal,
  Layers, Ruler, Grid3X3, Magnet, Crosshair, ExternalLink, Lock, Unlock,
  Settings, Play, MousePointer2, Type, Square, Maximize2, Minimize2,
  FileText, Sparkles, Lightbulb, MessageSquare, Package,
  Send, Users, Brain, Plus, X, Minus, ChevronDown, GitBranch, Trash2,
  Mic, MicOff, Video, VideoOff, Check, Copy, BookOpen, Cpu, Wrench as WrenchIcon,
  PhoneOff, Radio,
} from 'lucide-react'
import { useAppStore } from '../store'
import { askGemini } from '../lib/gemini'

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMsg { id: string; user: string; avatar: string; time: string; content: string }
interface LearnMsg { id: string; role: 'user' | 'assistant'; content: string }
interface NodeDef { id: string; x: number; y: number; w: number; h: number; title: string; tag: string; color: 'indigo'|'violet'|'emerald'; icon: React.ElementType; preview: string; badge: string|null }

// ─── Layout configs ───────────────────────────────────────────────────────────

interface LayoutCfg { left: number; right: number; videoH: number; sidebar: boolean }

const LAYOUT_CFGS: Record<string, LayoutCfg> = {
  presenter: { left: 520, right: 0,   videoH: 370, sidebar: true  },
  canvas:    { left: 370, right: 320, videoH: 205, sidebar: true  },
  learn:     { left: 260, right: 420, videoH: 180, sidebar: true  },
  play:      { left: 0,   right: 460, videoH: 0,   sidebar: true  },
  balanced:  { left: 380, right: 380, videoH: 210, sidebar: true  },
  workshop:  { left: 260, right: 320, videoH: 180, sidebar: false },
  copilot:   { left: 370, right: 460, videoH: 205, sidebar: true  },
  dual:      { left: 220, right: 220, videoH: 160, sidebar: false },
  research:  { left: 260, right: 440, videoH: 180, sidebar: true  },
  build:     { left: 200, right: 440, videoH: 160, sidebar: true  },
}

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

const QUICK_LAYOUTS = [
  { id: 'presenter', cols: [[1],[.35,.65]]     },
  { id: 'canvas',    cols: [[.25,.5,.25]]      },
  { id: 'learn',     cols: [[.25,.35,.4]]      },
  { id: 'play',      cols: [[.5,.5]]           },
  { id: 'balanced',  cols: [[.33,.33,.34]]     },
]

// ─── Canvas constants ─────────────────────────────────────────────────────────

const BASE_NODES: NodeDef[] = [
  { id: 'insight',  x: 60,  y: 60,  w: 165, h: 115, title: 'Insight',  tag: '#research',         color: 'violet',  icon: Sparkles,      preview: 'metric',  badge: null  },
  { id: 'concept',  x: 300, y: 60,  w: 165, h: 115, title: 'Concept',  tag: '#ideation',         color: 'emerald', icon: Lightbulb,     preview: 'images',  badge: 'AI'  },
  { id: 'prompt',   x: 60,  y: 265, w: 165, h: 115, title: 'Prompt',   tag: '#prompt-v1',        color: 'indigo',  icon: MessageSquare, preview: 'text2',   badge: 'v2'  },
  { id: 'generate', x: 300, y: 265, w: 165, h: 115, title: 'Generate', tag: '#midjourney',       color: 'violet',  icon: Zap,           preview: 'images2', badge: null  },
  { id: 'output',   x: 540, y: 265, w: 165, h: 115, title: 'Output',   tag: '#campaign-assets',  color: 'emerald', icon: Package,       preview: 'image3',  badge: null  },
]

const BASE_EDGES = [
  { from: 'insight', to: 'concept' },
  { from: 'prompt', to: 'generate' }, { from: 'generate', to: 'output' },
  { from: 'insight', to: 'generate' }, { from: 'concept', to: 'output' },
]

const INIT_CHAT: ChatMsg[] = [
  { id:'1', user:'Sophie', avatar:'S', time:'10:34 AM', content:'This workflow is 🔥'              },
  { id:'2', user:'Alex',   avatar:'A', time:'10:34 AM', content:'Can you show the prompt again?'  },
  { id:'3', user:'Jordan', avatar:'J', time:'10:25 AM', content:'Loving the canvas!'               },
  { id:'4', user:'Taylor', avatar:'T', time:'10:25 AM', content:'What model are you using?'       },
]

const AVATAR_COLORS: Record<string,string> = { S:'bg-rose-500', A:'bg-indigo-500', J:'bg-emerald-500', T:'bg-amber-500' }

const NODE_STYLES: Record<string,{bg:string;border:string;iconBg:string;iconColor:string;tagBg:string;tagText:string;dot:string}> = {
  indigo:  { bg:'bg-indigo-50',  border:'border-indigo-200',  iconBg:'bg-indigo-100',  iconColor:'text-indigo-600',  tagBg:'bg-indigo-100',  tagText:'text-indigo-700',  dot:'bg-indigo-500'  },
  violet:  { bg:'bg-violet-50',  border:'border-violet-200',  iconBg:'bg-violet-100',  iconColor:'text-violet-600',  tagBg:'bg-violet-100',  tagText:'text-violet-700',  dot:'bg-violet-500'  },
  emerald: { bg:'bg-emerald-50', border:'border-emerald-200', iconBg:'bg-emerald-100', iconColor:'text-emerald-600', tagBg:'bg-emerald-100', tagText:'text-emerald-700', dot:'bg-emerald-500' },
}

const NODE_COLORS = ['indigo','violet','emerald'] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEdgePath(fx:number, fy:number, fw:number, fh:number, tx:number, ty:number, tw:number, th:number) {
  if (Math.abs(fy - ty) < 30) {
    const x1=fx+fw, y1=fy+fh/2, x2=tx, y2=ty+th/2, mx=(x1+x2)/2
    return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
  }
  const x1=fx+fw/2, y1=fy+fh, x2=tx+tw/2, y2=ty, my=(y1+y2)/2
  return `M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`
}

function NodePreview({ type }: { type: string }) {
  if (type==='text') return <div className="space-y-1.5 px-0.5"><div className="h-1.5 bg-gray-200 rounded-full w-full"/><div className="h-1.5 bg-gray-200 rounded-full w-4/5"/><div className="h-1.5 bg-gray-100 rounded-full w-3/5"/></div>
  if (type==='text2') return <p className="text-[10px] text-[#6B7280] leading-relaxed line-clamp-3">High energy, cinematic, futuristic...</p>
  if (type==='metric') return <div><p className="text-[10px] font-medium text-[#374151] mb-1.5">Generate insights</p><div className="flex gap-1.5"><span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[9px] font-semibold">2</span><span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px]">2</span></div></div>
  if (type==='images') return <div className="flex gap-1"><div className="flex-1 h-12 rounded" style={{background:'linear-gradient(135deg,#374151,#111827)'}}/><div className="flex-1 h-12 rounded" style={{background:'linear-gradient(135deg,#4B5563,#1f2937)'}}/></div>
  if (type==='images2') return <div className="flex gap-1"><div className="flex-1 h-12 rounded" style={{background:'radial-gradient(ellipse at 40% 50%,#334155,#0f172a)'}}/><div className="flex-1 h-12 rounded" style={{background:'radial-gradient(ellipse at 60% 50%,#1e3a5f,#0f172a)'}}/></div>
  if (type==='image3') return <div className="h-14 rounded" style={{background:'radial-gradient(ellipse at center,#1e3a5f,#0a0a0a)'}}/>
  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Workspace() {
  const { roomId } = useParams({ from: '/live/$roomId' })
  const navigate = useNavigate()
  const { displayName } = useAppStore()

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeNav, setActiveNav]         = useState<'live'|'learn'|'play'>('live')
  const [activeLayout, setActiveLayout]   = useState('canvas')
  const [activeLearnTab, setLearnTab]     = useState<'notes'|'transcript'|'sources'>('notes')
  const [activePlayTab, setPlayTab]       = useState<'api'|'prompts'|'models'|'tools'>('api')
  const [activeTool, setActiveTool]       = useState<'select'|'text'|'shape'|'play'>('select')
  const [snapOn, setSnapOn]               = useState(true)
  const [showGrid, setShowGrid]           = useState(true)
  const [showRulers, setShowRulers]       = useState(true)
  const [locked, setLocked]               = useState(false)
  const [focusMode, setFocusMode]         = useState(false)
  const [canvasExpanded, setCanvasExpanded] = useState(false)
  const [infiniteCanvas, setInfiniteCanvas] = useState(true)
  const [zoom, setZoom]                   = useState(100)
  const [selectedNode, setSelectedNode]   = useState<string|null>(null)

  // ── Data state ──────────────────────────────────────────────────────────────
  const [chatMsgs, setChatMsgs]           = useState<ChatMsg[]>(INIT_CHAT)
  const [chatInput, setChatInput]         = useState('')
  const [chatLoading, setChatLoading]     = useState(false)
  const [learnMsgs, setLearnMsgs]         = useState<LearnMsg[]>([])
  const [learnInput, setLearnInput]       = useState('')
  const [learnLoading, setLearnLoading]   = useState(false)
  const [apiBody, setApiBody]             = useState('{\n  "prompt": "Futuristic race car, motion blur, cinematic",\n  "style": "cinematic",\n  "ar": "16:9"\n}')
  const [apiLoading, setApiLoading]       = useState(false)
  const [apiResponse, setApiResponse]     = useState<string|null>(null)
  const [mix, setMix]                     = useState({ live: 60, learn: 20, play: 20 })

  // ── Canvas nodes (base + user-added) ────────────────────────────────────────
  const [userNodes, setUserNodes]         = useState<NodeDef[]>([])
  const [nodePos, setNodePos]             = useState<Record<string,{x:number;y:number}>>(() =>
    Object.fromEntries(BASE_NODES.map(n => [n.id, {x:n.x, y:n.y}]))
  )
  const allNodes = [...BASE_NODES, ...userNodes]

  // ── Drag refs ────────────────────────────────────────────────────────────────
  const nodeDragRef   = useRef<{id:string; mx:number; my:number; ox:number; oy:number}|null>(null)
  const sliderDragRef = useRef<{dot:0|1; trackLeft:number; trackWidth:number}|null>(null)
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const chatEndRef    = useRef<HTMLDivElement>(null)
  const learnEndRef   = useRef<HTMLDivElement>(null)
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef   = useRef<InstanceType<typeof window.JitsiMeetExternalAPI> | null>(null)

  // ── Meet state ───────────────────────────────────────────────────────────────
  const [jitsiLoaded, setJitsiLoaded]     = useState(false)
  const [participantCount, setParticipantCount] = useState(1)
  const [micMuted, setMicMuted]           = useState(true)
  const [camMuted, setCamMuted]           = useState(false)

  // ── Notifications ─────────────────────────────────────────────────────────────
  const [showNotif, setShowNotif]         = useState(false)
  const [notifications] = useState([
    { id:'1', text:'Sophie joined the session', time:'just now' },
    { id:'2', text:'AI Notes updated', time:'2m ago' },
    { id:'3', text:'New canvas node connected', time:'5m ago' },
  ])

  // ── Share/Save ────────────────────────────────────────────────────────────────
  const [copied, setCopied]               = useState(false)
  const [savedLayouts, setSavedLayouts]   = useState<string[]>([])

  // ── Transcript / Sources ──────────────────────────────────────────────────────
  const [transcript, setTranscript]       = useState<string|null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [sources] = useState([
    { title: 'AI Workflow Design Patterns', url: '#', domain: 'arxiv.org' },
    { title: 'Prompt Engineering Guide', url: '#', domain: 'promptingguide.ai' },
    { title: 'Creative Brief Templates', url: '#', domain: 'notion.so' },
    { title: 'Midjourney V6 Docs', url: '#', domain: 'midjourney.com' },
  ])

  // ── Playground prompts/models ─────────────────────────────────────────────────
  const PROMPT_LIBRARY = [
    { label: 'Cinematic portrait', prompt: 'Ultra-realistic cinematic portrait, golden hour lighting, shallow depth of field, 85mm lens' },
    { label: 'Abstract tech', prompt: 'Abstract technology visualization, neural network nodes, glowing edges, dark background, 8k' },
    { label: 'Product hero', prompt: 'Luxury product hero shot, studio lighting, white background, reflective surface, advertisement quality' },
    { label: 'Sci-fi landscape', prompt: 'Epic sci-fi landscape, distant planets, alien flora, volumetric fog, concept art style' },
  ]
  const MODELS = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Fast', active: true },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', badge: 'Smart', active: false },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', badge: 'Stable', active: false },
  ]
  const [activeModel, setActiveModel]     = useState('gemini-2.5-flash')
  const TOOLS_LIST = [
    { id: 'web_search', label: 'Web Search', desc: 'Search the web for current info', enabled: true },
    { id: 'code_exec', label: 'Code Execution', desc: 'Run code and return output', enabled: false },
    { id: 'image_gen', label: 'Image Generation', desc: 'Generate images from prompts', enabled: true },
    { id: 'doc_parse', label: 'Document Parser', desc: 'Extract info from docs/PDFs', enabled: false },
  ]
  const [enabledTools, setEnabledTools]   = useState<string[]>(['web_search', 'image_gen'])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const layout = LAYOUT_CFGS[activeLayout] ?? LAYOUT_CFGS.canvas
  const effectiveLeft  = canvasExpanded ? 0 : layout.left
  const effectiveRight = canvasExpanded ? 0 : layout.right
  const effectiveSidebar = !canvasExpanded && layout.sidebar

  // ── Global mouse handlers for drag ──────────────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (nodeDragRef.current && !locked) {
        const d = nodeDragRef.current
        const scale = zoom / 100
        let nx = d.ox + (e.clientX - d.mx) / scale
        let ny = d.oy + (e.clientY - d.my) / scale
        if (snapOn) { nx = Math.round(nx/20)*20; ny = Math.round(ny/20)*20 }
        setNodePos(p => ({ ...p, [d.id]: { x: Math.max(0, nx), y: Math.max(0, ny) } }))
      }
      if (sliderDragRef.current) {
        const { dot, trackLeft, trackWidth } = sliderDragRef.current
        const raw = Math.max(0, Math.min(100, ((e.clientX - trackLeft) / trackWidth) * 100))
        const pct = Math.round(raw)
        setMix(prev => {
          if (dot === 0) {
            const newLive = Math.max(10, Math.min(prev.live + prev.learn - 5, pct))
            const remaining = 100 - newLive
            const learnRatio = (prev.learn + prev.play) > 0 ? prev.learn / (prev.learn + prev.play) : 0.5
            const newLearn = Math.max(5, Math.round(remaining * learnRatio))
            return { live: newLive, learn: newLearn, play: 100 - newLive - newLearn }
          } else {
            const splitPct = Math.max(prev.live + 5, Math.min(95, pct))
            const newLearn = Math.max(5, splitPct - prev.live)
            return { live: prev.live, learn: newLearn, play: Math.max(5, 100 - prev.live - newLearn) }
          }
        })
      }
    }
    function onUp() {
      nodeDragRef.current = null
      sliderDragRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [locked, snapOn, zoom])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [chatMsgs])
  useEffect(() => { learnEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [learnMsgs])

  // Load Jitsi script once
  useEffect(() => {
    if (document.getElementById('jitsi-api-script')) { setJitsiLoaded(true); return }
    const s = document.createElement('script')
    s.id = 'jitsi-api-script'
    s.src = 'https://meet.jit.si/external_api.js'
    s.async = true
    s.onload = () => setJitsiLoaded(true)
    document.body.appendChild(s)
  }, [])

  // Init Jitsi when script ready + container visible
  useEffect(() => {
    if (!jitsiLoaded || !jitsiContainerRef.current || layout.videoH === 0) return
    if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null }
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
        toolbarButtons: [],
      },
      interfaceConfigOverwrite: {
        MOBILE_APP_PROMO: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        TOOLBAR_ALWAYS_VISIBLE: false,
        FILM_STRIP_MAX_HEIGHT: 60,
      },
    })
    api.addEventListeners({
      participantJoined: () => setParticipantCount(c => c + 1),
      participantLeft:   () => setParticipantCount(c => Math.max(1, c - 1)),
    })
    jitsiApiRef.current = api
    return () => { api.dispose(); jitsiApiRef.current = null }
  }, [jitsiLoaded, roomId, displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function startNodeDrag(id: string, e: React.MouseEvent) {
    if (locked || activeTool !== 'select') return
    e.preventDefault(); e.stopPropagation()
    const pos = nodePos[id] ?? { x:0, y:0 }
    nodeDragRef.current = { id, mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y }
    setSelectedNode(id)
  }

  function startSliderDrag(dot: 0|1, e: React.MouseEvent) {
    e.preventDefault()
    const track = sliderTrackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    sliderDragRef.current = { dot, trackLeft: rect.left, trackWidth: rect.width }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (activeTool === 'select') { setSelectedNode(null); return }
    if (locked) return
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = zoom / 100
    const x = Math.max(0, (e.clientX - rect.left) / scale - 82)
    const y = Math.max(0, (e.clientY - rect.top) / scale - 57)
    const colorIdx = userNodes.length % NODE_COLORS.length
    const id = `node-${Date.now()}`
    const newNode: NodeDef = {
      id, x, y, w:165, h:105,
      title: activeTool === 'text' ? 'Text Node' : 'Shape Node',
      tag: activeTool === 'text' ? '#text' : '#shape',
      color: NODE_COLORS[colorIdx], icon: activeTool === 'text' ? Type : Square,
      preview: 'text', badge: null
    }
    setUserNodes(prev => [...prev, newNode])
    setNodePos(prev => ({ ...prev, [id]: { x, y } }))
    setActiveTool('select')
  }

  function deleteNode(id: string) {
    if (BASE_NODES.find(n => n.id === id)) return // can't delete base nodes
    setUserNodes(prev => prev.filter(n => n.id !== id))
    setNodePos(prev => { const p = {...prev}; delete p[id]; return p })
    setSelectedNode(null)
  }

  function changeLayout(id: string) {
    setActiveLayout(id)
    setCanvasExpanded(false)
  }

  const sendChat = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const text = chatInput.trim(); setChatInput('')
    const now = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    setChatMsgs(m => [...m, { id:Date.now().toString(), user:displayName||'You', avatar:(displayName||'Y')[0].toUpperCase(), time:now, content:text }])
    setChatLoading(true)
    try {
      const reply = await askGemini(text, 'You are a helpful assistant in a live webinar. Be concise.')
      setChatMsgs(m => [...m, { id:(Date.now()+1).toString(), user:'AI', avatar:'AI', time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), content:reply }])
    } finally { setChatLoading(false) }
  }, [chatInput, chatLoading, displayName])

  const sendLearn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!learnInput.trim() || learnLoading) return
    const q = learnInput.trim(); setLearnInput('')
    setLearnMsgs(m => [...m, { id:Date.now().toString(), role:'user', content:q }])
    setLearnLoading(true)
    try {
      const ans = await askGemini(q, 'You are an expert AI learning assistant. Give concise, insightful answers.')
      setLearnMsgs(m => [...m, { id:(Date.now()+1).toString(), role:'assistant', content:ans }])
    } finally { setLearnLoading(false) }
  }, [learnInput, learnLoading])

  const sendPlayground = useCallback(async () => {
    if (apiLoading) return
    setApiLoading(true); setApiResponse(null)
    try {
      let prompt = 'Generate creative content'
      try { const p = JSON.parse(apiBody); if (p.prompt) prompt = p.prompt } catch {}
      const resp = await askGemini(prompt, 'You are a creative AI model. Generate vivid, descriptive creative content based on the prompt.')
      setApiResponse(resp)
    } finally { setApiLoading(false) }
  }, [apiBody, apiLoading])

  function fitView() {
    setZoom(100)
    setNodePos(Object.fromEntries(BASE_NODES.map(n => [n.id, {x:n.x, y:n.y}])))
    setUserNodes([])
  }

  async function shareRoom() {
    const url = `${window.location.origin}/live/${roomId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function saveCurrentLayout() {
    if (!savedLayouts.includes(activeLayout)) {
      setSavedLayouts(prev => [...prev, activeLayout])
    }
  }

  function toggleMic() {
    jitsiApiRef.current?.executeCommand('toggleAudio')
    setMicMuted(m => !m)
  }

  function toggleCam() {
    jitsiApiRef.current?.executeCommand('toggleVideo')
    setCamMuted(c => !c)
  }

  function hangUp() {
    jitsiApiRef.current?.executeCommand('hangup')
    navigate({ to: '/live' })
  }

  async function generateTranscript() {
    if (transcriptLoading) return
    setTranscriptLoading(true)
    try {
      const t = await askGemini(
        `Generate a realistic 5-minute webinar transcript excerpt for room "${roomId}". Include speaker names (Host, Sophie, Alex), timestamps, and natural conversation about AI creative workflows.`,
        'You are a transcript generator. Output clean, realistic transcript text with timestamps in [MM:SS] format.'
      )
      setTranscript(t)
    } finally {
      setTranscriptLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-[#111827] overflow-hidden" style={{userSelect:'none'}}>

      {/* ── Top nav ───────────────────────────────────────────────────────────── */}
      <div className="h-12 flex items-center px-4 border-b border-[#E8E8EF] shrink-0 gap-3 bg-white">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center">
            <Zap size={13} className="text-white"/>
          </div>
          <span className="text-sm font-bold">Sandbox</span>
        </div>

        <nav className="flex items-end h-full">
          {(['live','learn','play'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveNav(tab)}
              className={`flex items-center gap-1.5 px-3.5 h-full text-sm font-medium transition-colors relative ${activeNav===tab?'text-[#111827]':'text-[#9CA3AF] hover:text-[#6B7280]'}`}
            >
              {tab==='live' && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"/><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"/></span>}
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
              {activeNav===tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 rounded-t-full"/>}
            </button>
          ))}
        </nav>

        <div className="flex-1"/>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8EF] hover:bg-[#F7F7FA] text-sm font-medium text-[#374151] transition-colors">
          <GitBranch size={13} className="text-indigo-500"/> Priority Mix
          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{mix.live}:{mix.learn}:{mix.play}</span>
        </button>
        <div className="w-px h-5 bg-[#E8E8EF]"/>
        <button onClick={shareRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#F7F7FA] text-sm font-medium text-[#374151] transition-colors">
          {copied ? <Check size={13} className="text-emerald-500"/> : <Share2 size={13}/>}
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button onClick={saveCurrentLayout}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#F7F7FA] text-sm font-medium transition-colors ${savedLayouts.includes(activeLayout)?'text-emerald-600':'text-[#374151]'}`}>
          {savedLayouts.includes(activeLayout) ? <Check size={13}/> : <Save size={13}/>}
          {savedLayouts.includes(activeLayout) ? 'Saved' : 'Save layout'}
        </button>
        <button className="p-2 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] transition-colors"><Grid3X3 size={14}/></button>
        <div className="relative">
          <button onClick={()=>setShowNotif(n=>!n)}
            className="p-2 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] transition-colors relative">
            <Bell size={14}/>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"/>
          </button>
          {showNotif && (
            <div className="absolute right-0 top-10 w-64 bg-white border border-[#E8E8EF] rounded-xl shadow-lg z-50 py-1">
              {notifications.map(n=>(
                <div key={n.id} className="px-4 py-2.5 hover:bg-[#F7F7FA] transition-colors cursor-default">
                  <p className="text-xs text-[#374151]">{n.text}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {(displayName||'U')[0].toUpperCase()}
        </div>
        <button onClick={() => navigate({ to:'/live' })} className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-400 transition-colors ml-1"><X size={14}/></button>
      </div>

      {/* ── Priority Mix slider (hidden in focus mode) ────────────────────────── */}
      {!focusMode && (
        <div className="h-[50px] border-b border-[#E8E8EF] flex items-center px-6 gap-3 shrink-0 bg-[#FAFAFA]">
          <div className="text-center w-12">
            <p className="text-[11px] font-semibold text-indigo-600">Live</p>
            <p className="text-[10px] text-[#9CA3AF]">{mix.live}%</p>
          </div>
          <div ref={sliderTrackRef} className="flex-1 relative h-2 cursor-pointer rounded-full bg-[#E8E8EF]">
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-emerald-400"/>
            </div>
            {/* dot 1: Live/Learn split */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow cursor-grab active:cursor-grabbing z-10"
              style={{left:`${mix.live}%`}}
              onMouseDown={(e) => startSliderDrag(0, e)}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none whitespace-nowrap">
                <p className="text-[10px] font-semibold text-[#374151]">Learn</p>
                <p className="text-[9px] text-[#9CA3AF]">{mix.learn}%</p>
              </div>
            </div>
            {/* dot 2: Learn/Play split */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow cursor-grab active:cursor-grabbing z-10"
              style={{left:`${mix.live + mix.learn}%`}}
              onMouseDown={(e) => startSliderDrag(1, e)}
            />
          </div>
          <div className="text-center w-12">
            <p className="text-[11px] font-semibold text-emerald-600">Play</p>
            <p className="text-[10px] text-[#9CA3AF]">{mix.play}%</p>
          </div>
        </div>
      )}

      {/* ── Layout presets (hidden in focus mode) ─────────────────────────────── */}
      {!focusMode && (
        <div className="h-11 border-b border-[#E8E8EF] flex items-center px-4 gap-1.5 overflow-x-auto shrink-0 bg-white">
          {LAYOUTS.map((l) => (
            <button key={l.id} onClick={() => changeLayout(l.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeLayout===l.id?'bg-indigo-600 text-white shadow-sm':'text-[#6B7280] hover:bg-[#F7F7FA] hover:text-[#374151]'}`}
            >{l.label}</button>
          ))}
          <button className="flex-shrink-0 p-1.5 rounded-lg text-[#9CA3AF] hover:bg-[#F7F7FA] transition-colors ml-1"><MoreHorizontal size={14}/></button>
        </div>
      )}

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        {effectiveSidebar && (
          <div className="w-14 bg-white border-r border-[#E8E8EF] flex flex-col items-center py-3 gap-1 shrink-0">
            {[
              { icon: showRulers ? Ruler : Ruler,       label: 'Rulers',  action: () => setShowRulers(r=>!r),         active: showRulers },
              { icon: showGrid ? Grid3X3 : Grid3X3,     label: 'Grid',    action: () => setShowGrid(g=>!g),           active: showGrid   },
              { icon: Layers,                            label: 'Layout',  action: () => {},                           active: false      },
            ].map(({icon:Icon,label,action,active}) => (
              <button key={label} onClick={action}
                className={`w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${active?'bg-indigo-50 text-indigo-600':'text-[#6B7280] hover:bg-[#F7F7FA] hover:text-[#374151]'}`}
              >
                <Icon size={15}/><span className={`text-[8px] ${active?'text-indigo-500':'text-[#9CA3AF]'}`}>{label}</span>
              </button>
            ))}

            {/* Snap with toggle */}
            <button onClick={() => setSnapOn(s=>!s)} className="w-10 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg hover:bg-[#F7F7FA] transition-colors">
              <Magnet size={15} className={snapOn?'text-indigo-600':'text-[#6B7280]'}/>
              <div className={`w-7 h-3.5 rounded-full flex items-center px-0.5 transition-colors ${snapOn?'bg-indigo-500':'bg-[#D1D5DB]'}`}>
                <div className={`w-2.5 h-2.5 bg-white rounded-full shadow transition-transform duration-200 ${snapOn?'translate-x-3.5':''}`}/>
              </div>
            </button>

            <div className="w-6 h-px bg-[#E8E8EF] my-1"/>

            <button onClick={() => setFocusMode(f=>!f)}
              className={`w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${focusMode?'bg-indigo-50 text-indigo-600':'text-[#6B7280] hover:bg-[#F7F7FA] hover:text-[#374151]'}`}
            >
              <Crosshair size={15}/><span className={`text-[8px] ${focusMode?'text-indigo-500':'text-[#9CA3AF]'}`}>Focus</span>
            </button>
            <button onClick={() => setCanvasExpanded(c=>!c)}
              className={`w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${canvasExpanded?'bg-indigo-50 text-indigo-600':'text-[#6B7280] hover:bg-[#F7F7FA] hover:text-[#374151]'}`}
            >
              <ExternalLink size={15}/><span className={`text-[8px] ${canvasExpanded?'text-indigo-500':'text-[#9CA3AF]'}`}>Pop out</span>
            </button>
            <button onClick={() => setLocked(l=>!l)}
              className={`w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${locked?'bg-amber-50 text-amber-600':'text-[#6B7280] hover:bg-[#F7F7FA] hover:text-[#374151]'}`}
            >
              {locked ? <Lock size={15}/> : <Unlock size={15}/>}
              <span className={`text-[8px] ${locked?'text-amber-500':'text-[#9CA3AF]'}`}>{locked?'Locked':'Lock'}</span>
            </button>

            <div className="w-6 h-px bg-[#E8E8EF] my-1"/>
            <button className="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg hover:bg-[#F7F7FA] text-[#6B7280] hover:text-[#374151] transition-colors">
              <Settings size={15}/><span className="text-[8px] text-[#9CA3AF]">Settings</span>
            </button>
            <div className="flex-1"/>
            <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center"><Zap size={11} className="text-white"/></div>
          </div>
        )}

        {/* Left col: Video + Chat */}
        <div className="flex flex-col border-r border-[#E8E8EF] shrink-0 min-h-0 overflow-hidden transition-all duration-300"
          style={{width: effectiveLeft}}
        >
          {effectiveLeft > 0 && (
            <>
              {/* Video / Meet */}
              {layout.videoH > 0 && (
                <div className="bg-[#0f0f13] relative shrink-0 overflow-hidden transition-all duration-300"
                  style={{height: layout.videoH}}>
                  {/* Jitsi iframe fills the container */}
                  <div ref={jitsiContainerRef} className="absolute inset-0"/>

                  {/* Loading state overlay */}
                  {!jitsiLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f13]">
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
                        <p className="text-[10px] text-white/40">Connecting…</p>
                      </div>
                    </div>
                  )}

                  {/* LIVE badge */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold pointer-events-none">
                    <Radio size={9}/> LIVE
                  </div>

                  {/* Participant count */}
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px]">
                    <Users size={9}/> {participantCount}
                  </div>

                  {/* Controls overlay — bottom */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <button onClick={toggleMic}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${micMuted?'bg-red-500 hover:bg-red-400':'bg-white/20 hover:bg-white/30'}`}
                      title={micMuted?'Unmute':'Mute'}>
                      {micMuted ? <MicOff size={13} className="text-white"/> : <Mic size={13} className="text-white"/>}
                    </button>
                    <button onClick={toggleCam}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${camMuted?'bg-red-500 hover:bg-red-400':'bg-white/20 hover:bg-white/30'}`}
                      title={camMuted?'Start video':'Stop video'}>
                      {camMuted ? <VideoOff size={13} className="text-white"/> : <Video size={13} className="text-white"/>}
                    </button>
                    <button onClick={hangUp}
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                      title="Leave call">
                      <PhoneOff size={13} className="text-white"/>
                    </button>
                  </div>
                </div>
              )}

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
                      <div className="flex gap-1">{[0,150,300].map(d=><span key={d} className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>
                    </div>
                  )}
                  <div ref={chatEndRef}/>
                </div>
                <form onSubmit={sendChat} className="px-3 py-2.5 border-t border-[#E8E8EF] flex items-center gap-2 shrink-0">
                  <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Say something..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-indigo-300"
                  />
                  <button type="submit" disabled={!chatInput.trim()||chatLoading} className="p-1.5 rounded-lg hover:bg-indigo-50 text-[#9CA3AF] hover:text-indigo-600 disabled:opacity-40 transition-colors"><Send size={13}/></button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Center canvas */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
          {/* Canvas toolbar */}
          <div className="h-10 border-b border-[#E8E8EF] flex items-center px-3 gap-0.5 shrink-0">
            <button onClick={() => { setActiveTool('play') }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeTool==='play'?'bg-indigo-100 text-indigo-600':'hover:bg-[#F7F7FA] text-[#6B7280]'}`} title="Run workflow">
              <Play size={13}/>
            </button>
            <button onClick={() => setActiveTool('select')}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeTool==='select'?'bg-indigo-100 text-indigo-600':'hover:bg-[#F7F7FA] text-[#6B7280]'}`} title="Select">
              <MousePointer2 size={13}/>
            </button>
            <button onClick={() => setActiveTool('text')}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeTool==='text'?'bg-indigo-100 text-indigo-600':'hover:bg-[#F7F7FA] text-[#6B7280]'}`} title="Add text node">
              <Type size={13}/>
            </button>
            <button onClick={() => setActiveTool('shape')}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeTool==='shape'?'bg-indigo-100 text-indigo-600':'hover:bg-[#F7F7FA] text-[#6B7280]'}`} title="Add shape node">
              <Square size={13}/>
            </button>
            <button onClick={fitView}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280] transition-colors" title="Fit all nodes">
              <Maximize2 size={13}/>
            </button>
            <button onClick={() => setShowGrid(g=>!g)}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${showGrid?'bg-indigo-100 text-indigo-600':'hover:bg-[#F7F7FA] text-[#6B7280]'}`} title="Toggle grid">
              <Grid3X3 size={13}/>
            </button>
            <div className="w-px h-4 bg-[#E8E8EF] mx-1"/>
            {locked && <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium px-2 py-1 rounded bg-amber-50"><Lock size={10}/> Locked</span>}
            {activeTool !== 'select' && !locked && <span className="text-[10px] text-indigo-600 font-medium px-2 py-1 rounded bg-indigo-50">Click canvas to add node</span>}
            <div className="flex-1"/>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#9CA3AF] transition-colors"><MoreHorizontal size={13}/></button>
          </div>

          {/* Ruler + canvas */}
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
            {showRulers && (
              <div className="w-5 bg-white border-r border-[#E8E8EF] shrink-0 relative overflow-hidden">
                {[100,200,300,400,500].map(n=>(
                  <div key={n} className="absolute left-0 right-0 flex items-center justify-center" style={{top:n*(zoom/100)-6}}>
                    <span className="text-[8px] text-[#CACAD4] font-mono">{n}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
              {showRulers && (
                <div className="h-5 bg-white border-b border-[#E8E8EF] shrink-0 overflow-hidden relative">
                  {[0,100,200,300,400,500,600,700,800,900,1000,1100,1200].map(n=>(
                    <div key={n} className="absolute top-0 bottom-0 flex items-center" style={{left:n*(zoom/100)/2+4}}>
                      <span className="text-[8px] text-[#CACAD4] font-mono">{n}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`flex-1 overflow-auto relative ${showGrid?'canvas-grid':'bg-[#F7F7FA]'}`}
                style={{cursor: activeTool==='select'?'default': locked?'not-allowed':'crosshair'}}
                onClick={handleCanvasClick}
              >
                <div style={{transform:`scale(${zoom/100})`, transformOrigin:'top left', width:800, height:500, position:'relative', flexShrink:0}}>
                  {/* SVG edges */}
                  <svg className="absolute inset-0 pointer-events-none" width={800} height={500}>
                    {BASE_EDGES.map((edge) => {
                      const fPos = nodePos[edge.from], tPos = nodePos[edge.to]
                      const fNode = allNodes.find(n=>n.id===edge.from), tNode = allNodes.find(n=>n.id===edge.to)
                      if (!fPos||!tPos||!fNode||!tNode) return null
                      return <path key={`${edge.from}-${edge.to}`} d={getEdgePath(fPos.x,fPos.y,fNode.w,fNode.h,tPos.x,tPos.y,tNode.w,tNode.h)} fill="none" stroke="#D1D5DB" strokeWidth={1.5}/>
                    })}
                  </svg>

                  {/* Nodes */}
                  {allNodes.map((node) => {
                    const s = NODE_STYLES[node.color]
                    const Icon = node.icon
                    const pos = nodePos[node.id] ?? { x: node.x, y: node.y }
                    const isSelected = selectedNode === node.id
                    const isUserNode = !BASE_NODES.find(n=>n.id===node.id)
                    return (
                      <div key={node.id}
                        className={`absolute rounded-xl border shadow-sm overflow-visible transition-shadow ${s.bg} ${s.border} ${isSelected?'ring-2 ring-indigo-400 shadow-lg':'hover:shadow-md'} ${locked?'cursor-not-allowed':'cursor-grab active:cursor-grabbing'}`}
                        style={{left:pos.x, top:pos.y, width:node.w, height:node.h}}
                        onMouseDown={(e) => startNodeDrag(node.id, e)}
                        onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id) }}
                      >
                        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${s.iconBg}`}><Icon size={11} className={s.iconColor}/></div>
                            <span className="text-xs font-semibold text-[#111827]">{node.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {node.badge && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${node.color==='emerald'?'bg-emerald-500':'bg-indigo-500'} text-white`}>{node.badge}</span>}
                            {isSelected && isUserNode && (
                              <button onClick={(e)=>{e.stopPropagation();deleteNode(node.id)}} className="w-4 h-4 rounded flex items-center justify-center hover:bg-red-100 text-red-400 transition-colors">
                                <Trash2 size={9}/>
                              </button>
                            )}
                          </div>
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

                  <button
                    onClick={(e)=>{e.stopPropagation();setActiveTool('select');const id=`node-${Date.now()}`;const newNode:NodeDef={id,x:340,y:430,w:165,h:105,title:'New Node',tag:'#new',color:'indigo',icon:FileText,preview:'text',badge:null};setUserNodes(p=>[...p,newNode]);setNodePos(p=>({...p,[id]:{x:340,y:430}}))}}
                    className="absolute w-8 h-8 rounded-full bg-white border-2 border-dashed border-[#D1D5DB] flex items-center justify-center text-[#9CA3AF] hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                    style={{left:360,top:440}}
                  >
                    <Plus size={14}/>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="h-9 border-t border-[#E8E8EF] flex items-center justify-end px-4 gap-1.5 shrink-0">
            <button onClick={()=>setZoom(z=>Math.max(25,z-25))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280]"><Minus size={12}/></button>
            <button onClick={()=>setZoom(100)} className="min-w-[44px] px-1.5 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-xs text-[#374151] font-medium">{zoom}%</button>
            <button onClick={()=>setZoom(z=>Math.min(200,z+25))} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280]"><Plus size={12}/></button>
            <div className="w-px h-4 bg-[#E8E8EF] mx-1"/>
            <button onClick={fitView} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F7F7FA] text-[#6B7280]" title="Reset view"><Maximize2 size={12}/></button>
          </div>
        </div>

        {/* Right col: Learn + Playground */}
        <div className="flex flex-col border-l border-[#E8E8EF] shrink-0 min-h-0 overflow-hidden transition-all duration-300"
          style={{width: effectiveRight}}
        >
          {effectiveRight > 0 && (
            <>
              {/* Learn */}
              <div className="flex flex-col border-b border-[#E8E8EF] min-h-0" style={{maxHeight:'55%'}}>
                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#E8E8EF] shrink-0">
                  <span className="text-sm font-bold text-[#111827] flex-1">Learn</span>
                  <button onClick={()=>setLearnInput('Give me the key insight from this session')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium transition-colors">
                    <Sparkles size={10}/> Ask AI
                  </button>
                  <button className="p-1 rounded hover:bg-[#F7F7FA] text-[#9CA3AF]"><MoreHorizontal size={13}/></button>
                </div>
                <div className="flex border-b border-[#E8E8EF] px-4 shrink-0">
                  {(['notes','transcript','sources'] as const).map(tab=>(
                    <button key={tab} onClick={()=>setLearnTab(tab)}
                      className={`px-3 py-2 text-xs font-medium transition-colors relative ${activeLearnTab===tab?'text-indigo-600':'text-[#9CA3AF] hover:text-[#6B7280]'}`}
                    >
                      {tab==='notes'?'AI Notes':tab.charAt(0).toUpperCase()+tab.slice(1)}
                      {activeLearnTab===tab&&<span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"/>}
                    </button>
                  ))}
                </div>
                <div className="overflow-y-auto flex-1 min-h-0 p-4 space-y-4">
                  {activeLearnTab==='transcript' && (
                    <div>
                      {!transcript && !transcriptLoading && (
                        <div className="text-center py-6">
                          <p className="text-xs text-[#9CA3AF] mb-3">Auto-transcript from live session</p>
                          <button onClick={generateTranscript}
                            className="px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium transition-colors">
                            <Sparkles size={10} className="inline mr-1"/>Generate Transcript
                          </button>
                        </div>
                      )}
                      {transcriptLoading && (
                        <div className="flex gap-1 p-3">{[0,150,300].map(d=><span key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>
                      )}
                      {transcript && (
                        <div className="text-xs text-[#374151] leading-relaxed whitespace-pre-line font-mono">{transcript}</div>
                      )}
                    </div>
                  )}
                  {activeLearnTab==='sources' && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-3">Referenced in this session</p>
                      {sources.map((s,i)=>(
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-[#E8E8EF] hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors cursor-pointer group">
                          <BookOpen size={12} className="text-[#9CA3AF] group-hover:text-indigo-500 mt-0.5 shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#374151] leading-tight">{s.title}</p>
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{s.domain}</p>
                          </div>
                          <ExternalLink size={10} className="text-[#D1D5DB] group-hover:text-indigo-400 shrink-0 mt-0.5"/>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeLearnTab==='notes' && learnMsgs.length===0 && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-[#374151] mb-2">Key takeaways</p>
                        <ul className="space-y-1.5">
                          {['Strong briefs lead to better AI output.','Use references to guide style and tone.','Iterate with small changes, not big jumps.','Test across models for different results.','Keep human judgment in the loop.'].map(t=>(
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
                  {learnMsgs.map(m=>(
                    <div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role==='user'?'bg-indigo-600 text-white':'bg-[#F7F7FA] border border-[#E8E8EF] text-[#374151]'}`}>{m.content}</div>
                    </div>
                  ))}
                  {learnLoading && <div className="flex gap-1 p-1">{[0,150,300].map(d=><span key={d} className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>}
                  <div ref={learnEndRef}/>
                </div>
                <form onSubmit={sendLearn} className="px-3 py-2 border-t border-[#E8E8EF] flex gap-2 shrink-0">
                  <input value={learnInput} onChange={e=>setLearnInput(e.target.value)} placeholder="Ask about this session..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-indigo-300"
                  />
                  <button type="submit" disabled={!learnInput.trim()||learnLoading} className="p-1.5 rounded-lg hover:bg-indigo-50 text-[#9CA3AF] hover:text-indigo-600 disabled:opacity-40 transition-colors"><Send size={13}/></button>
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
                  {(['api','prompts','models','tools'] as const).map(tab=>(
                    <button key={tab} onClick={()=>setPlayTab(tab)}
                      className={`px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors relative ${activePlayTab===tab?'text-indigo-600':'text-[#9CA3AF] hover:text-[#6B7280]'}`}
                    >
                      {tab}{activePlayTab===tab&&<span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"/>}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
                  {activePlayTab==='api' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">POST</span>
                        <input readOnly value="/v1/generate" className="flex-1 px-2 py-1 rounded border border-[#E8E8EF] bg-[#F7F7FA] text-xs text-[#374151] font-mono focus:outline-none min-w-0"/>
                        <button onClick={sendPlayground} disabled={apiLoading}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shrink-0">
                          {apiLoading?'...':'Send'}
                        </button>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Body</p>
                        <textarea value={apiBody} onChange={e=>setApiBody(e.target.value)} rows={5}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8E8EF] bg-[#F7F7FA] text-xs text-[#374151] font-mono focus:outline-none focus:border-indigo-300 resize-none"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Response</p>
                        {apiLoading ? (
                          <div className="flex gap-1 p-3">{[0,150,300].map(d=><span key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</div>
                        ) : apiResponse ? (
                          <div className="p-3 rounded-lg bg-[#F7F7FA] border border-[#E8E8EF] text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">{apiResponse}</div>
                        ) : (
                          <div className="flex gap-2">
                            {['radial-gradient(ellipse at 40% 40%,#1e3a5f,#0a0a0a)','radial-gradient(ellipse at 60% 40%,#2d1b69,#0a0a0a)','radial-gradient(ellipse at 50% 60%,#1a2e1a,#0a0a0a)'].map((g,i)=>(
                              <div key={i} className="flex-1 h-14 rounded-lg" style={{background:g}}/>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : activePlayTab==='prompts' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Prompt library</p>
                      {PROMPT_LIBRARY.map((p,i)=>(
                        <button key={i} onClick={()=>setApiBody(`{\n  "prompt": "${p.prompt}",\n  "style": "cinematic",\n  "ar": "16:9"\n}`)}
                          className="w-full text-left p-2.5 rounded-lg border border-[#E8E8EF] hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors group">
                          <p className="text-xs font-medium text-[#374151] group-hover:text-indigo-700">{p.label}</p>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-relaxed line-clamp-2">{p.prompt}</p>
                        </button>
                      ))}
                    </div>
                  ) : activePlayTab==='models' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Select model</p>
                      {MODELS.map(m=>(
                        <button key={m.id} onClick={()=>setActiveModel(m.id)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center gap-3 ${activeModel===m.id?'border-indigo-300 bg-indigo-50':'border-[#E8E8EF] hover:border-indigo-200 hover:bg-[#F7F7FA]'}`}>
                          <Cpu size={14} className={activeModel===m.id?'text-indigo-600':'text-[#9CA3AF]'}/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#374151]">{m.label}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${activeModel===m.id?'bg-indigo-100 text-indigo-700':'bg-[#F7F7FA] text-[#9CA3AF]'}`}>{m.badge}</span>
                          {activeModel===m.id && <Check size={12} className="text-indigo-600 shrink-0"/>}
                        </button>
                      ))}
                    </div>
                  ) : activePlayTab==='tools' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2">Function tools</p>
                      {TOOLS_LIST.map(t=>(
                        <div key={t.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-[#E8E8EF]">
                          <WrenchIcon size={13} className="text-[#9CA3AF] mt-0.5 shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#374151]">{t.label}</p>
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{t.desc}</p>
                          </div>
                          <button onClick={()=>setEnabledTools(prev=>prev.includes(t.id)?prev.filter(x=>x!==t.id):[...prev,t.id])}
                            className={`shrink-0 w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${enabledTools.includes(t.id)?'bg-indigo-500':'bg-[#D1D5DB]'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${enabledTools.includes(t.id)?'translate-x-4':''}`}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom bar (hidden in focus mode) ─────────────────────────────────── */}
      {!focusMode && (
        <div className="h-[88px] border-t border-[#E8E8EF] flex shrink-0 bg-white">
          {/* Priority Mix */}
          <div className="border-r border-[#E8E8EF] px-4 flex items-center gap-3 min-w-[170px]">
            <svg width="60" height="52" viewBox="0 0 60 52" className="shrink-0">
              <polygon points="30,3 57,49 3,49" fill="rgba(99,102,241,0.08)" stroke="#E8E8EF" strokeWidth="1.5"/>
              {/* Dynamic dot position based on mix */}
              <circle
                cx={30 - (mix.learn - mix.play) * 0.18}
                cy={49 - mix.live * 0.42}
                r="3.5" fill="#6366f1"
              />
              <text x="30" y="1.5" textAnchor="middle" fontSize="6.5" fill="#9CA3AF">Live</text>
              <text x="1" y="56" textAnchor="start" fontSize="6.5" fill="#9CA3AF">Learn</text>
              <text x="59" y="56" textAnchor="end" fontSize="6.5" fill="#9CA3AF">Play</text>
            </svg>
            <div className="space-y-1">
              {[{label:'Live',pct:mix.live,color:'bg-indigo-500'},{label:'Learn',pct:mix.learn,color:'bg-blue-400'},{label:'Play',pct:mix.play,color:'bg-emerald-500'}].map(({label,pct,color})=>(
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                  <span className={`w-1.5 h-1.5 rounded-full ${color}`}/>{label} <span className="font-semibold text-[#374151]">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick layouts */}
          <div className="border-r border-[#E8E8EF] px-4 flex items-center gap-3 flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[#374151] shrink-0">Quick layouts</p>
            <div className="flex gap-1.5 overflow-x-auto">
              {QUICK_LAYOUTS.map(l=>(
                <button key={l.id} onClick={()=>changeLayout(l.id)}
                  className={`shrink-0 w-12 h-9 rounded border flex flex-col gap-0.5 p-0.5 transition-all ${activeLayout===l.id?'border-indigo-400 bg-indigo-50':'border-[#E8E8EF] hover:border-[#D1D5DB] hover:bg-[#F7F7FA]'}`}
                  title={LAYOUTS.find(x=>x.id===l.id)?.label}
                >
                  {l.cols.map((row,ri)=>(
                    <div key={ri} className="flex flex-1 gap-0.5">
                      {row.map((w,ci)=><div key={ci} className={`rounded-sm transition-colors ${activeLayout===l.id?'bg-indigo-300':'bg-[#E8E8EF]'}`} style={{flex:w}}/>)}
                    </div>
                  ))}
                </button>
              ))}
              <button onClick={()=>setCanvasExpanded(c=>!c)}
                className={`shrink-0 w-12 h-9 rounded border flex items-center justify-center transition-all ${canvasExpanded?'border-indigo-400 bg-indigo-50':'border-dashed border-[#D1D5DB] hover:border-indigo-300 hover:bg-[#F7F7FA]'}`}
                title="Canvas only"
              >
                {canvasExpanded ? <Minimize2 size={12} className="text-indigo-600"/> : <Maximize2 size={12} className="text-[#9CA3AF]"/>}
              </button>
            </div>
          </div>

          {/* Canvas controls */}
          <div className="border-r border-[#E8E8EF] px-4 flex items-center gap-4 min-w-[210px]">
            <div>
              <p className="text-[10px] font-semibold text-[#374151] mb-1.5">Canvas controls</p>
              <div className="flex gap-1">
                {[
                  {Icon:Grid3X3, tip:'Toggle grid',   action:()=>setShowGrid(g=>!g),   active:showGrid  },
                  {Icon:Ruler,   tip:'Toggle rulers', action:()=>setShowRulers(r=>!r), active:showRulers},
                  {Icon:Magnet,  tip:'Toggle snap',   action:()=>setSnapOn(s=>!s),     active:snapOn    },
                  {Icon:locked?Lock:Unlock, tip:'Toggle lock', action:()=>setLocked(l=>!l), active:locked},
                  {Icon:Crosshair,tip:'Focus mode',  action:()=>setFocusMode(f=>!f),   active:focusMode },
                ].map(({Icon,tip,action,active},i)=>(
                  <button key={i} onClick={action} title={tip}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${active?'bg-indigo-100 text-indigo-600':'hover:bg-[#F7F7FA] text-[#6B7280]'}`}>
                    <Icon size={12}/>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#374151] mb-1.5">Infinite canvas</p>
              <button onClick={()=>setInfiniteCanvas(i=>!i)}
                className={`w-9 h-[18px] rounded-full flex items-center px-0.5 transition-colors ${infiniteCanvas?'bg-indigo-500':'bg-[#D1D5DB]'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 ${infiniteCanvas?'translate-x-[18px]':''}`}/>
              </button>
            </div>
          </div>

          {/* View */}
          <div className="px-4 flex items-center min-w-[120px]">
            <div>
              <p className="text-[10px] font-semibold text-[#374151] mb-1.5">View</p>
              <div className="w-20 h-11 rounded border border-[#E8E8EF] bg-[#F7F7FA] flex gap-0.5 p-1 overflow-hidden">
                {effectiveLeft > 0 && <div className="bg-indigo-100 rounded-sm transition-all" style={{width:Math.max(6, effectiveLeft/30)}}/>}
                <div className="flex-1 bg-violet-100 rounded-sm"/>
                {effectiveRight > 0 && <div className="bg-emerald-100 rounded-sm transition-all" style={{width:Math.max(6, effectiveRight/30)}}/>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
