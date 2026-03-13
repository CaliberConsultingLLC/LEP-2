import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

export function XPToastContainer() {
  const toasts = useAppStore((s) => s.xpToasts)

  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10, x: 20 }}
            transition={{ duration: 0.25 }}
            className={`clip-card px-4 py-2 font-mono text-sm tracking-wider border ${
              t.amount > 0
                ? 'bg-[var(--teal-deep)] border-[var(--teal-dim)] text-[var(--teal-hi)]'
                : 'bg-[var(--amber-deep)] border-[var(--amber-dim)] text-[var(--amber)]'
            }`}
          >
            {t.amount > 0 ? '+' : ''}{t.amount} XP
            <span className="ml-2 text-xs opacity-60 uppercase">{t.source}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
