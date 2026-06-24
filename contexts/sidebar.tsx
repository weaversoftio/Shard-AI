'use client'

import { createContext, useContext, useState } from 'react'

interface SidebarCtx {
  open: boolean
  openSidebar: () => void
  closeSidebar: () => void
}

export const SidebarContext = createContext<SidebarCtx>({
  open: false,
  openSidebar: () => {},
  closeSidebar: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{
      open,
      openSidebar:  () => setOpen(true),
      closeSidebar: () => setOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}
