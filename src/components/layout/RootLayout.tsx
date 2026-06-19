import React from 'react'
import Sidebar from './Sidebar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#07070F] text-[#F0F0FF] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto dot-grid">
        {children}
      </main>
    </div>
  )
}
