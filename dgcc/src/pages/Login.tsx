import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'

export function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || 'OPERATOR' },
          },
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-root h-full flex items-center justify-center">
      {/* Background grid effect */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--teal-dim) 1px, transparent 1px), linear-gradient(90deg, var(--teal-dim) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md mx-4">
        {/* Corner brackets */}
        <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-[var(--teal)]" />
        <div className="absolute -top-3 -right-3 w-6 h-6 border-t border-r border-[var(--teal-dim)]" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b border-l border-[var(--b1)]" />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-[var(--teal-dim)]" />

        <div className="bg-[var(--panel)] border border-[var(--b0)] p-8">
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, var(--teal), var(--blue), transparent)' }}
          />

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block clip-badge bg-[var(--teal-deep)] border border-[var(--teal-dim)] px-5 py-1.5 mb-3">
              <span className="font-mono text-xl tracking-[4px] text-[var(--teal)]">DG</span>
            </div>
            <h1 className="text-xl font-bold tracking-[3px] text-[var(--text-hi)] uppercase">
              Command Center
            </h1>
            <div className="font-mono text-[10px] tracking-wider text-[var(--text-dim)] mt-1">
              // AUTHENTICATION REQUIRED
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex mb-6 border border-[var(--b0)]">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-bold tracking-wider uppercase transition-all ${
                mode === 'login'
                  ? 'bg-[var(--teal-deep)] text-[var(--teal)] border-r border-[var(--b0)]'
                  : 'bg-[var(--panel2)] text-[var(--text-dim)] border-r border-[var(--b0)]'
              }`}
            >
              // LOGIN
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-bold tracking-wider uppercase transition-all ${
                mode === 'signup'
                  ? 'bg-[var(--teal-deep)] text-[var(--teal)]'
                  : 'bg-[var(--panel2)] text-[var(--text-dim)]'
              }`}
            >
              // REGISTER
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-mono tracking-wider text-[var(--text-dim)] mb-1 uppercase">
                  Callsign
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="OPERATOR"
                  className="arc-input w-full"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono tracking-wider text-[var(--text-dim)] mb-1 uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@arc.net"
                required
                className="arc-input w-full"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono tracking-wider text-[var(--text-dim)] mb-1 uppercase">
                Access Code
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="arc-input w-full"
              />
            </div>

            {error && (
              <div className="font-mono text-xs text-[var(--red)] bg-[var(--red-deep)] border border-[var(--red-dim)] px-3 py-2">
                ERR: {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="arc-btn arc-btn-teal w-full py-2.5 text-sm mt-2"
            >
              {loading ? '// AUTHENTICATING...' : mode === 'login' ? '// AUTHENTICATE' : '// CREATE OPERATOR'}
            </button>
          </form>

          {/* Bottom ticker */}
          <div className="ticker mt-6">
            <div className="ticker-inner">
              SYS::AUTH_GATE &gt;&gt; SECURE_CHANNEL ACTIVE &gt;&gt; ENCRYPTION AES-256 &gt;&gt; STATUS READY &gt;&gt; CLEARANCE_LEVEL PENDING
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
