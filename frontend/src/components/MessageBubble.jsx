import { Users, Sparkle } from 'lucide-react'

function formatTime(ts) {
  if (!ts) return 'just now'
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, dark = true }) {
  const { content, sender_type, sender_name, timestamp, streaming } = message

  // ── system pill ───────────────────────────────────────────────────────
  if (sender_type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full"
          style={{
            background: dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
            color: dark ? '#64748b' : '#94a3b8',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
          }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: dark ? '#334155' : '#cbd5e1' }} />
          {content}
        </span>
      </div>
    )
  }

  const isUser  = sender_type === 'user'
  const isAgent = sender_type === 'agent'

  return (
    <div className={`flex items-start gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'msgFadeIn 0.22s ease both' }}>

      {/* avatar */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm
          ${isAgent
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
            : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}>
          {isAgent ? <Users className="w-4 h-4" /> : <Sparkle className="w-4 h-4" />}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* sender name */}
        {!isUser && (
          <span className="text-[11px] font-medium px-1"
            style={{ color: isAgent ? '#34d399' : '#818cf8' }}>
            {isAgent ? sender_name || 'Agent' : 'AI Assistant'}
          </span>
        )}

        {/* message text - no box, just text with subtle background */}
        <div className={`px-4 py-2 text-[15px] leading-relaxed whitespace-pre-wrap ${
          isUser 
            ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm'
            : 'rounded-2xl rounded-tl-sm'
        }`}
          style={{
            ...(isUser ? {} : {
              background: isAgent 
                ? (dark ? 'rgba(52,211,153,0.08)' : '#ecfdf5')
                : (dark ? 'rgba(99,102,241,0.08)' : '#eef2ff'),
              color: dark ? '#e2e8f0' : '#1e293b',
            }),
          }}>
          {content}
          {streaming && (
            <span className="inline-block ml-1 align-middle font-normal"
              style={{ 
                color: dark ? '#818cf8' : '#6366f1',
                animation: 'cursorBlink 0.8s step-end infinite',
                fontSize: '1em',
                fontWeight: '300'
              }}>
              |
            </span>
          )}
        </div>

        {/* timestamp on hover */}
        <span className="text-[10px] px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: dark ? '#334155' : '#cbd5e1' }}>
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  )
}
