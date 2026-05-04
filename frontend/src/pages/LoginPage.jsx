import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authAPI } from '../services/api'

function roleHome(role) {
  if (role === 'admin') return '/admin'
  if (role === 'agent') return '/admin'
  return '/chat'
}

const STYLES = `
  @keyframes floatY  { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-14px) rotate(4deg)} }
  @keyframes floatY2 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-20px) rotate(-5deg)} }
  @keyframes floatY3 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-10px) rotate(6deg)} }

  /* slide animations for form content only */
  @keyframes slideOutLeft {
    0%   { transform: translateX(0); opacity: 1; }
    100% { transform: translateX(-120%); opacity: 0; }
  }
  @keyframes slideInRight {
    0%   { transform: translateX(120%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    0%   { transform: translateX(0); opacity: 1; }
    100% { transform: translateX(120%); opacity: 0; }
  }
  @keyframes slideInLeft {
    0%   { transform: translateX(-120%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  .slide-out-left  { animation: slideOutLeft  0.4s cubic-bezier(0.6,0,0.4,1) forwards; }
  .slide-in-right  { animation: slideInRight  0.4s cubic-bezier(0.6,0,0.4,1) forwards; }
  .slide-out-right { animation: slideOutRight 0.4s cubic-bezier(0.6,0,0.4,1) forwards; }
  .slide-in-left   { animation: slideInLeft   0.4s cubic-bezier(0.6,0,0.4,1) forwards; }
`

/* ─── Field ─────────────────────────────────────────────────────────────── */
function Field({ label, type, placeholder, value, onChange, icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="w-full">
      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-gray-400">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
          style={{ opacity: focused ? 1 : 0.4 }}>{icon}</span>}
        <input type={type} placeholder={placeholder} required value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full text-sm py-3 rounded-xl outline-none transition-all duration-200 bg-gray-50 text-gray-900"
          style={{
            paddingLeft: icon ? '2.5rem' : '1rem', paddingRight: '1rem',
            border: `1.5px solid ${focused ? '#6366f1' : 'transparent'}`,
            boxShadow: focused ? '0 0 0 4px rgba(99,102,241,0.08)' : 'none',
          }} />
      </div>
    </div>
  )
}

/* ─── Illustration (Always on Left) ─────────────────────────────────────── */
function Illustration() {
  const bubbles = [
    { side: 'left', avatar: '🧑', bg: 'rgba(255,255,255,0.15)', text: 'Hey, I need help with my order.' },
    { side: 'right', avatar: '🤖', bg: 'rgba(255,255,255,0.25)', text: 'Sure! Let me look that up.' },
    { side: 'left', avatar: '🧑', bg: 'rgba(255,255,255,0.15)', text: 'Can I speak to a real person?' },
    { side: 'right', avatar: '🧑‍💼', bg: 'rgba(255,255,255,0.3)', text: 'Hi! Agent here — happy to help 👋' },
  ]

  const orbs = [
    { emoji: '⚡', size: 48, top: 8, left: 75, anim: 'floatY', dur: '4s', delay: '0s' },
    { emoji: '🤖', size: 52, top: 15, left: 12, anim: 'floatY2', dur: '5.5s', delay: '0.8s' },
    { emoji: '📊', size: 44, top: 78, left: 8, anim: 'floatY3', dur: '3.8s', delay: '1.2s' },
    { emoji: '💬', size: 46, top: 82, left: 82, anim: 'floatY', dur: '4.6s', delay: '0.4s' },
  ]

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-10 overflow-hidden"
      style={{ background: 'linear-gradient(145deg,#6366f1,#8b5cf6,#a78bfa)' }}>
      {/* Background decorations */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white opacity-5" />
      <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-white opacity-5" />

      {/* Floating orbs */}
      {orbs.map((o, i) => (
        <div key={i} className="absolute flex items-center justify-center"
          style={{
            top: `${o.top}%`, left: `${o.left}%`, width: o.size, height: o.size,
            animation: `${o.anim} ${o.dur} ease-in-out infinite`, animationDelay: o.delay
          }}>
          <div className="relative z-10 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{
              width: o.size, height: o.size, background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.2)', fontSize: o.size * 0.42,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.15)'
            }}>
            {o.emoji}
          </div>
        </div>
      ))}

      {/* Chat bubbles */}
      <div className="w-full max-w-xs space-y-3 mb-8 relative z-10">
        {bubbles.map((b, i) => (
          <div key={i} className={`flex items-end gap-2 ${b.side === 'right' ? 'flex-row-reverse' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm flex-shrink-0">{b.avatar}</div>
            <div className="text-white text-xs px-4 py-2.5 max-w-[190px] leading-relaxed backdrop-blur-sm"
              style={{ background: b.bg, borderRadius: b.side === 'left' ? '16px 16px 16px 4px' : '16px 16px 4px 16px' }}>
              {b.text}
            </div>
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="relative z-10 text-center">
        <p className="text-white font-bold text-xl tracking-tight">AI meets human support</p>
        <p className="text-white/50 text-sm mt-1">Seamless handoff, every time.</p>
      </div>
    </div>
  )
}

/* ─── Login Form Content ─────────────────────────────────────────────────── */
function LoginFormContent({ onSwitch, animClass }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const u = await login(form.email, form.password)
      navigate(roleHome(u.role), { replace: true })
    } catch (err) { setError(err.response?.data?.detail || 'Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div className={`w-full ${animClass}`}>
      <h1 className="text-[1.9rem] font-black text-gray-900 leading-none tracking-tight mb-1">Welcome back.</h1>
      <p className="text-gray-400 text-sm mb-8">Sign in to your workspace.</p>
      {error && <div className="text-red-500 text-xs bg-red-50 px-4 py-3 rounded-xl mb-5 flex items-center gap-2"><span>⚠</span>{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" type="email" placeholder="you@example.com" icon="✉️"
          value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
        <Field label="Password" type="password" placeholder="••••••••" icon="🔒"
          value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-wide mt-1 transition-all duration-200 disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', boxShadow: '0 6px 24px rgba(99,102,241,0.3)' }}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
      <div className="mt-7 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-300">new here?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <button onClick={onSwitch}
        className="mt-4 w-full py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-500 font-semibold hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200">
        Create an account
      </button>
    </div>
  )
}

/* ─── Register Form Content ──────────────────────────────────────────────── */
function RegisterFormContent({ onSwitch, animClass }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)

    // Validate password match
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await authAPI.register({ email: form.email, password: form.password, name: form.name })
      const u = await login(form.email, form.password)
      navigate(roleHome(u.role), { replace: true })
    } catch (err) { setError(err.response?.data?.detail || 'Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className={`w-full ${animClass}`}>
      <h1 className="text-[1.9rem] font-black text-gray-900 leading-none tracking-tight mb-1">Create account.</h1>
      <p className="text-gray-400 text-sm mb-7">Join as a user. Agents are added by admins.</p>
      {error && <div className="text-red-500 text-xs bg-red-50 px-4 py-3 rounded-xl mb-5 flex items-center gap-2"><span>⚠</span>{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Full name" type="text" placeholder="Sarah Johnson" icon="✦"
          value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Field label="Email address" type="email" placeholder="you@example.com" icon="✉️"
          value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
        <Field label="Password" type="password" placeholder="Min. 6 characters" icon="🔒"
          value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />
        <Field label="Confirm Password" type="password" placeholder="Re-enter password" icon="🔒"
          value={form.confirmPassword} onChange={v => setForm(f => ({ ...f, confirmPassword: v }))} />

        <p className="text-[10px] text-gray-400">
          By creating an account you agree to our Terms & Privacy Policy.
        </p>
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-wide transition-all duration-200 disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg,#f43f5e,#fb923c)', boxShadow: '0 6px 28px rgba(244,63,94,0.45)' }}>
          {loading ? 'Creating account…' : 'Get started →'}
        </button>
      </form>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-300">have an account?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <button onClick={onSwitch}
        className="mt-3 w-full py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-500 font-semibold hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200">
        Sign in instead
      </button>
    </div>
  )
}

/* ─── Root ───────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { user } = useAuth()
  const [mode, setMode] = useState('login')
  const [phase, setPhase] = useState('idle')
  const [next, setNext] = useState(null)

  if (user) return <Navigate to={roleHome(user.role)} replace />

  const switchTo = (target) => {
    if (phase !== 'idle' || target === mode) return
    setNext(target)
    setPhase('out')
    setTimeout(() => {
      setMode(target)
      setPhase('in')
      setTimeout(() => { setPhase('idle'); setNext(null) }, 420)
    }, 420)
  }

  const direction = (next || mode) === 'register' ? 'toLeft' : 'toRight'

  let animClass = ''
  if (phase === 'out') animClass = direction === 'toLeft' ? 'slide-out-left' : 'slide-out-right'
  if (phase === 'in') animClass = direction === 'toLeft' ? 'slide-in-right' : 'slide-in-left'

  return (
    <>
      <style>{STYLES}</style>
      <div className="w-screen h-screen overflow-hidden flex">
        {/* Left side - Illustration (always visible) */}
        <div className="w-1/2 h-full">
          <Illustration />
        </div>

        {/* Right side - Form container (fixed) */}
        <div className="w-1/2 h-full bg-white flex items-center justify-center px-10 sm:px-14 xl:px-16 overflow-hidden">
          <div className="max-w-[380px] w-full">
            {mode === 'login' ? (
              <LoginFormContent onSwitch={() => switchTo('register')} animClass={animClass} />
            ) : (
              <RegisterFormContent onSwitch={() => switchTo('login')} animClass={animClass} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
