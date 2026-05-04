import { Users, Sparkle } from 'lucide-react'

export default function TypingIndicator({ label = 'AI Assistant', isAgent = false, dark = true }) {
  return (
    <div className="flex items-end gap-2.5" style={{ animation: 'msgFadeIn 0.2s ease both' }}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md
        ${isAgent ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}>
        {isAgent ? <Users className="w-4 h-4" /> : <Sparkle className="w-4 h-4" />}
      </div>

      <div className="flex flex-col gap-1 items-start">
        <span className="text-[11px] font-semibold px-1"
          style={{ color: isAgent ? '#34d399' : '#818cf8' }}>
          {label}
        </span>
        <div className="px-4 py-3 flex items-center gap-1.5"
          style={{
            borderRadius: '18px 18px 18px 4px',
            background: dark ? '#1e2433' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'}`,
            boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
          }}>
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full inline-block"
              style={{
                background: dark ? '#475569' : '#cbd5e1',
                animation: 'typingBounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
          ))}
        </div>
      </div>
    </div>
  )
}
