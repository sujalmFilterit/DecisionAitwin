import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import MessageBubble from '../components/MessageBubble'
import TypingIndicator from '../components/TypingIndicator'
import { chatAPI, agentAPI, escalateAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../hooks/useAuth'

export default function ChatDetailPage() {
  const { chatId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [customerTyping, setCustomerTyping] = useState(false)
  const [joined, setJoined] = useState(false)
  const bottomRef = useRef(null)

  const wsUrl = user ? `ws://localhost:8000/ws/agent/${user.id}?token=${token}` : null

  const { send } = useWebSocket(wsUrl, (data) => {
    if (data.chat_id !== chatId) return

    if (data.event === 'user_message') {
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: data.message,
        sender_type: 'user',
        sender_name: data.sender,
      }])
    } else if (data.event === 'customer_typing') {
      setCustomerTyping(true)
      setTimeout(() => setCustomerTyping(false), 3000)
    } else if (data.event === 'ai_response') {
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: data.message,
        sender_type: 'ai',
        sender_name: 'AI Assistant',
      }])
    }
  })

  useEffect(() => {
    send({ event: 'join_chat', chat_id: chatId })
    fetchChat()
    return () => send({ event: 'leave_chat', chat_id: chatId })
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, customerTyping])

  const fetchChat = async () => {
    try {
      const res = await chatAPI.getById(chatId)
      setChat(res.data)
      setMessages(res.data.messages || [])
      if (res.data.agent_id === user?.id) setJoined(true)
    } catch {
      navigate('/admin')
    }
  }

  const handleJoin = async () => {
    try {
      await agentAPI.joinChat({ chat_id: chatId })
      setJoined(true)
      fetchChat()
    } catch (e) {
      console.error(e)
    }
  }

  const handleEscalate = async () => {
    try {
      await escalateAPI.escalate({ chat_id: chatId, reason: 'manual_agent' })
      fetchChat()
    } catch (e) {
      console.error(e)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      await agentAPI.sendMessage({ chat_id: chatId, message: text })
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: text,
        sender_type: 'agent',
        sender_name: user?.name || 'Agent',
      }])
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    send({ event: 'typing', chat_id: chatId })
  }

  if (!chat) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-gray-600">←</button>
            <div>
              <h2 className="font-semibold text-gray-800">{chat.visitor_name || 'Anonymous Visitor'}</h2>
              <p className="text-xs text-gray-400">{chat.visitor_email || chat.session_id}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              chat.status === 'escalated' ? 'bg-red-100 text-red-700' :
              chat.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {chat.status}
            </span>
          </div>
          <div className="flex gap-2">
            {!chat.is_escalated && (
              <button
                onClick={handleEscalate}
                className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition"
              >
                Escalate
              </button>
            )}
            {!joined && (
              <button
                onClick={handleJoin}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                Join Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 scrollbar-thin bg-gray-50">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} message={msg} />
          ))}
          {customerTyping && <TypingIndicator label="Customer is typing" />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {joined ? (
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type your reply..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3 text-center text-sm text-yellow-700">
            Click "Join Chat" to start responding to this customer
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
