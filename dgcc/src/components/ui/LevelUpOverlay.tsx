import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { useEffect } from 'react'

export function LevelUpOverlay() {
  const show = useAppStore((s) => s.showLevelUp)
  const data = useAppStore((s) => s.levelUpData)
  const dismiss = useAppStore((s) => s.dismissLevelUp)

  useEffect(() => {
    if (show) {
      const t = setTimeout(dismiss, 3500)
      return () => clearTimeout(t)
    }
  }, [show, dismiss])

  return (
    <AnimatePresence>
      {show && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={dismiss}
        >
          {/* Expanding rings */}
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute w-32 h-32 rounded-full border border-[var(--teal)]"
          />
          <motion.div
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut' }}
            className="absolute w-32 h-32 rounded-full border border-[var(--amber)]"
          />

          <div className="text-center relative z-10">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="font-mono text-8xl font-bold text-[var(--teal-hi)] mb-4"
            >
              {String(data.level).padStart(2, '0')}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold tracking-[0.3em] uppercase text-[var(--amber)]"
              style={{ animation: 'blink 1s ease-in-out infinite' }}
            >
              LEVEL UP
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-3 text-sm tracking-widest uppercase text-[var(--text)]"
            >
              // {data.rank}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
