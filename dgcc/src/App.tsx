import { AnimatePresence, motion } from 'framer-motion'
import { Topbar } from './components/layout/Topbar'
import { XPStrip } from './components/layout/XPStrip'
import { Sidebar } from './components/layout/Sidebar'
import { RightPanel } from './components/layout/RightPanel'
import { XPToastContainer } from './components/ui/XPToast'
import { LevelUpOverlay } from './components/ui/LevelUpOverlay'
import { TaskList } from './components/tasks/TaskList'
import { HabitList } from './components/habits/HabitList'
import { RewardVault } from './components/rewards/RewardVault'
import { IntelFeed } from './components/calendar/IntelFeed'
import { StatsPanel } from './components/stats/StatsPanel'
import { Login } from './pages/Login'
import { useAppStore, type TabId } from './store/useAppStore'
import { useAuth } from './hooks/useAuth'
import { isSupabaseConfigured } from './lib/supabase'

const panels: Record<TabId, () => JSX.Element> = {
  operations: TaskList,
  protocols: HabitList,
  rewards: RewardVault,
  intel: IntelFeed,
  stats: StatsPanel,
}

function CommandCenter() {
  const activeTab = useAppStore((s) => s.activeTab)
  const ActivePanel = panels[activeTab]

  return (
    <div className="app-root h-full flex flex-col">
      <Topbar />
      <XPStrip />

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 min-w-0 p-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ActivePanel />
            </motion.div>
          </AnimatePresence>
        </div>

        <RightPanel />
      </div>

      <XPToastContainer />
      <LevelUpOverlay />
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  // If Supabase isn't configured, skip auth and show the app directly (dev mode)
  if (!isSupabaseConfigured) {
    return <CommandCenter />
  }

  // Loading state
  if (loading) {
    return (
      <div className="app-root h-full flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-sm text-[var(--teal)] tracking-wider animate-pulse">
            // INITIALIZING SYSTEMS...
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated — show login
  if (!user) {
    return <Login />
  }

  // Authenticated — show command center
  return <CommandCenter />
}

export default App
