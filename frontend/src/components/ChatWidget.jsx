import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { chatAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

const SESSION_KEY = 'chat_session_id'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [agentTyping, setAgentTyping] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const bottomRef = useRef(null)

  const sessionId = useRef(
    localStorage.getItem(SESSION_KEY) || (() => {
      const id = uuidv4()
      localStorage.setItem(SESSION_KEY, id)
      return id
    })()
  )

  const wsUrl = `ws://localhost:8000/ws/customer/${sessionId.current}`

  const { send } = useWebSocket(wsUrl, (data) => {
    if (data.event === 'agent_message') {
      setMessages(prev => [...prev, {
        id: data.message_id || uuidv4(),
        content: data.message,
        sender_type: 'agent',
        sender_name: data.sender,
      }])
      setAgentTyping(false)
    } else if (data.event === 'escalation_triggered') {
      setEscalated(true)
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: data.message,
        sender_type: 'system',
      }])
    } else if (data.event === 'agent_joined') {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: data.message,
        sender_type: 'system',
      }])
    } else if (data.event === 'agent_typing') {
      setAgentTyping(true)
      setTimeout(() => setAgentTyping(false), 3000)
    }
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentTyping])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    const userMsg = { id: uuidv4(), content: text, sender_type: 'user', sender_name: visitorName || 'You' }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await chatAPI.send({
        session_id: sessionId.current,
        message: text,
        visitor_name: visitorName || undefined,
      })

      const { response, escalated: isEscalated } = res.data
      if (isEscalated && !escalated) setEscalated(true)
      if (response) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          content: response,
          sender_type: isEscalated ? 'system' : 'ai',
          sender_name: isEscalated ? 'System' : 'AI Assistant',
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: 'Something went wrong. Please try again.',
        sender_type: 'system',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    send({ event: 'typing' })
  }

  if (!open) {
    return (
      <button
        id="open-chat-btn"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center text-2xl z-50"
        aria-label="Open chat"
      >
        💬
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-semibold text-sm">
            {escalated ? 'Human Agent' : 'AI Assistant'}
          </span>
        </div>
        <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200 text-lg" aria-label="Close chat">✕</button>
      </div>

      {/* Name prompt */}
      {!nameSet && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-gray-600 mb-2">Your name (optional)</p>
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Enter your name..."
              value={visitorName}
              onChange={e => setVisitorName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setNameSet(true)}
            />
            <button
              onClick={() => setNameSet(true)}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Start
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <p className="text-2xl mb-2">👋</p>
            <p>Hi! How can I help you today?</p>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {(loading || agentTyping) && <TypingIndicator label={agentTyping ? 'Agent is typing' : 'AI is thinking'} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder={escalated ? 'Message agent...' : 'Type a message...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
