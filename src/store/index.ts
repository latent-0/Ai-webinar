import { create } from 'zustand'

interface Room {
  id: string
  name: string
  participants: number
  createdAt: Date
  isActive: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AppState {
  rooms: Room[]
  learnMessages: Message[]
  playMessages: Message[]
  liveAiMessages: Message[]
  displayName: string

  addRoom: (room: Room) => void
  removeRoom: (id: string) => void
  addLearnMessage: (msg: Message) => void
  addPlayMessage: (msg: Message) => void
  addLiveAiMessage: (msg: Message) => void
  setDisplayName: (name: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  rooms: [
    { id: 'webinar-ai-2025', name: 'AI in 2025: What You Need to Know', participants: 12, createdAt: new Date(), isActive: true },
    { id: 'dental-practice-live', name: 'Modern Dental Practice Webinar', participants: 6, createdAt: new Date(Date.now() - 3600000), isActive: true },
    { id: 'audit-workshop', name: 'Audit Workshop: Best Practices', participants: 0, createdAt: new Date(Date.now() - 86400000), isActive: false },
  ],
  learnMessages: [],
  playMessages: [],
  liveAiMessages: [],
  displayName: 'Guest',

  addRoom: (room) => set((s) => ({ rooms: [room, ...s.rooms] })),
  removeRoom: (id) => set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) })),
  addLearnMessage: (msg) => set((s) => ({ learnMessages: [...s.learnMessages, msg] })),
  addPlayMessage: (msg) => set((s) => ({ playMessages: [...s.playMessages, msg] })),
  addLiveAiMessage: (msg) => set((s) => ({ liveAiMessages: [...s.liveAiMessages, msg] })),
  setDisplayName: (name) => set({ displayName: name }),
}))
