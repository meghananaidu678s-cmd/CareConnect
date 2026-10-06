import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ScreenName =
  | 'login' | 'register'
  | 'home' | 'appointments' | 'book' | 'doctors' | 'profile'
  | 'payment' | 'messages' | 'notifications' | 'doctor-profile'
  | 'appointment-detail' | 'records' | 'payment-history'

export interface NavScreen {
  name: ScreenName
  params?: Record<string, any>
}

interface NavContextType {
  screen: NavScreen
  stack: NavScreen[]
  push: (s: NavScreen) => void
  pop: () => void
  replace: (s: NavScreen) => void
  reset: (s: NavScreen) => void
  canGoBack: boolean
  tab: ScreenName
  setTab: (t: ScreenName) => void
}

const NavContext = createContext<NavContextType>(null!)

export function useNav() {
  return useContext(NavContext)
}

export const MAIN_TABS: ScreenName[] = ['home', 'appointments', 'book', 'doctors', 'profile']

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<ScreenName>('home')
  const [stack, setStack] = useState<NavScreen[]>([{ name: 'home' }])

  const screen = stack[stack.length - 1]

  const push = useCallback((s: NavScreen) => setStack(prev => [...prev, s]), [])
  const pop = useCallback(() => setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev)), [])
  const replace = useCallback((s: NavScreen) => setStack(prev => [...prev.slice(0, -1), s]), [])
  const reset = useCallback((s: NavScreen) => setStack([s]), [])

  const setTab = useCallback((t: ScreenName) => {
    setTabState(t)
    setStack([{ name: t }])
  }, [])

  return (
    <NavContext.Provider value={{ screen, stack, push, pop, replace, reset, canGoBack: stack.length > 1, tab, setTab }}>
      {children}
    </NavContext.Provider>
  )
}
