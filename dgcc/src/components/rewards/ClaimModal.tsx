import { motion, AnimatePresence } from 'framer-motion'
import { ArcButton } from '../ui/ArcButton'
import type { Reward } from './RewardCard'

interface Props {
  reward: Reward
  onConfirm: () => void
  onCancel: () => void
}

export function ClaimModal({ reward, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="clip-card bg-[var(--panel)] border border-[var(--b1)] p-6 w-80 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="corner-tl" style={{ borderColor: 'var(--amber)' }} />
          <div className="corner-br" />

          <div className="text-[10px] uppercase tracking-widest text-[var(--amber-dim)] mb-2">// CONFIRM CLAIM</div>
          <div className="text-lg font-bold text-[var(--white)] mb-1">{reward.title}</div>
          <div className="font-mono text-sm text-[var(--amber)] mb-4">-{reward.cost} XP</div>

          <div className="flex gap-2">
            <ArcButton variant="amber" className="flex-1" onClick={onConfirm}>// CLAIM</ArcButton>
            <ArcButton variant="red" className="flex-1" onClick={onCancel}>// ABORT</ArcButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
