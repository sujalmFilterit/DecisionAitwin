import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { chatAPI, projectsAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import MessageBubble from '../components/MessageBubble'
import TypingIndicator from '../components/TypingIndicator'
import { v4 as uuidv4 } from 'uuid'
import {
  DollarSign,
  Calendar,
  Sparkles,
  Users,
  MessageCircle,
  Folder,
  CalendarDays,
  Lock,
  Trash2,
  LogOut,
  Sun,
  Moon,
  Sparkle
} from 'lucide-react'

// Keys will be scoped per user
const getUserKey = (userId, key) => `${key}_${userId}`

const SUGGESTIONS = [
  { label: 'Pricing', icon: DollarSign, text: 'What are your pricing plans?' },
  { label: 'Book a demo', icon: Calendar, text: 'I would like to book a demo.' },
  { label: 'Key features', icon: Sparkles, text: 'What are the main features?' },
  { label: 'Talk to human', icon: Users, text: 'I want to talk to a human agent.' },
]

const STYLES = `
  @keyframes msgFadeIn {
    from { opacity:0; transform:translateY(10px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes typingBounce {
    0%,60%,100% { transform:translateY(0); }
    30%         { transform:translateY(-5px); }
  }
  @keyframes dropIn {
    from { opacity:0; transform:translateY(-8px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes cursorBlink {
    0%,100% { opacity:1; }
    50%     { opacity:0; }
  }

  /* ── Universal scrollbar — dark ── */
  .cs, .cs * { scrollbar-width: thin; scrollbar-color: #2d3748 transparent; }
  .cs::-webkit-scrollbar { width: 5px; height: 5px; }
  .cs::-webkit-scrollbar-track { background: transparent; border-radius: 99px; }
  .cs::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 99px;
    border: 1px solid transparent;
    background-clip: padding-box;
  }
  .cs::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
    background-clip: padding-box;
  }
  .cs::-webkit-scrollbar-corner { background: transparent; }

  /* ── Universal scrollbar — light ── */
  .cs-light, .cs-light * { scrollbar-width: thin; scrollbar-color: #c7d2fe transparent; }
  .cs-light::-webkit-scrollbar { width: 5px; height: 5px; }
  .cs-light::-webkit-scrollbar-track { background: transparent; border-radius: 99px; }
  .cs-light::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #a5b4fc 0%, #c4b5fd 100%);
    border-radius: 99px;
    border: 1px solid transparent;
    background-clip: padding-box;
  }
  .cs-light::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #818cf8 0%, #a78bfa 100%);
    background-clip: padding-box;
  }
  .cs-light::-webkit-scrollbar-corner { background: transparent; }

  /* ── Textarea: never show scrollbar, grow instead ── */
  .chat-input { overflow: hidden !important; }
`

/* ── helpers ──────────────────────────────────────────────────────────── */
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
}
function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)) }
function relativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return Math.floor(diff / 86400000) + 'd ago'
}

/* ── ConfirmModal ─────────────────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel, dark }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-80 rounded-2xl p-6 shadow-2xl" style={{ background: dark ? '#1e2433' : '#fff', animation: 'dropIn 0.15s ease both' }}>
        <p className="text-sm font-medium mb-5" style={{ color: dark ? '#e2e8f0' : '#1e293b' }}>{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-semibold transition"
            style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', color: dark ? '#94a3b8' : '#64748b' }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Settings dropdown ────────────────────────────────────────────────── */
function SettingsPanel({ user, dark, onClearChat, onDeleteChat, onDeleteProject, onLogout, onClose, activeChat, projects }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'
  const activeProject = activeChat?.projectId ? projects.find(p => p.id === activeChat.projectId) : null

  const Item = ({ icon, label, sub, onClick, danger }) => (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-150"
      style={{ color: danger ? '#f87171' : (dark ? '#cbd5e1' : '#374151') }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : (dark ? 'rgba(255,255,255,0.05)' : '#f8fafc')}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <span className="flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {sub && <p className="text-[10px] opacity-50">{sub}</p>}
      </div>
    </button>
  )

  return (
    <div ref={ref}
      className="absolute right-0 top-12 w-72 rounded-2xl shadow-2xl z-50 overflow-hidden border"
      style={{ background: dark ? '#1e2433' : '#fff', borderColor: dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb', animation: 'dropIn 0.18s ease both' }}>

      {/* profile */}
      <div className="px-4 py-4" style={{ background: dark ? 'linear-gradient(135deg,#1e2d4a,#1a1f35)' : 'linear-gradient(135deg,#f0f4ff,#fff)', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: dark ? '#fff' : '#111' }}>{user?.name}</p>
            <p className="text-[11px] truncate" style={{ color: dark ? '#64748b' : '#6b7280' }}>{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />{user?.role || 'user'}
            </span>
          </div>
        </div>
      </div>

      {/* account info */}
      <div className="px-2 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5" style={{ color: dark ? '#334155' : '#9ca3af' }}>Account</p>
        <Item icon={<CalendarDays className="w-4 h-4" />} label="Member since" sub={joined} />
        <Item icon={<Lock className="w-4 h-4" />} label="Account type" sub="Standard user" />
      </div>

      <div className="mx-4 h-px" style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }} />

      {/* chat actions */}
      <div className="px-2 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5" style={{ color: dark ? '#334155' : '#9ca3af' }}>Chat</p>
        <Item icon={<Trash2 className="w-4 h-4" />} label="Clear current chat" sub="Remove all messages" onClick={onClearChat} />
        <Item icon={<Trash2 className="w-4 h-4" />} label="Delete this chat" sub="Permanently remove from history" onClick={onDeleteChat} danger />
        {/* {activeProject && <Item icon={<Folder className="w-4 h-4" />} label={`Delete project "${activeProject.name}"`} sub="Removes project and all its chats" onClick={onDeleteProject} danger />} */}
      </div>

      <div className="mx-4 h-px" style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }} />

      {/* sign out */}
      <div className="px-2 py-2">
        <Item icon={<LogOut className="w-4 h-4" />} label="Sign out" sub="End your session" onClick={onLogout} danger />
      </div>
    </div>
  )
}

/* ── ProjectFolderItem ────────────────────────────────────────────────── */
function ProjectFolderItem({ project, isExpanded, dark, t, projectChats, onToggle, onRename, onDelete, onDrop, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(project.name)
  const menuRef = useRef(null)
  const inputRef = useRef(null)

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  // focus rename input
  useEffect(() => {
    if (renaming) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [renaming])

  const commitRename = () => {
    const v = renameVal.trim()
    if (v && v !== project.name) onRename(v)
    else setRenameVal(project.name)
    setRenaming(false)
  }

  const menuBg = dark ? '#1e2433' : '#ffffff'
  const menuBorder = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'

  return (
    <div className="mb-1 relative group/project">
      {renaming ? (
        /* ── inline rename input ── */
        <div className="flex items-center gap-2 px-3 py-2">
          <Folder className="w-4 h-4 flex-shrink-0" style={{ color: t.textMuted }} />
          <input
            ref={inputRef}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setRenameVal(project.name); setRenaming(false) }
            }}
            onBlur={commitRename}
            className="flex-1 text-sm px-2 py-1.5 rounded-lg outline-none"
            style={{
              background: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              border: `1.5px solid #6366f1`,
              color: t.text,
            }}
          />
        </div>
      ) : (
        /* ── Project folder header ── */
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: t.text }}
          onMouseEnter={e => e.currentTarget.style.background = t.itemHover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.style.background = 'transparent'
            onDrop(e)
          }}>
          <svg className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Folder className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate text-left">{project.name}</span>
          <span className="text-xs opacity-50">{projectChats.length}</span>

          {/* 3-dot button — visible on row hover */}
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150
              opacity-0 group-hover/project:opacity-100"
            style={{
              background: menuOpen ? (dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb') : 'transparent',
              color: t.textMuted,
            }}
            onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb' }}
            onMouseLeave={e => { e.stopPropagation(); if (!menuOpen) e.currentTarget.style.background = 'transparent' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" />
            </svg>
          </button>
        </button>
      )}

      {/* ── dropdown menu ── */}
      {menuOpen && (
        <div ref={menuRef}
          className="absolute right-1 top-8 w-44 rounded-xl shadow-xl z-50 overflow-hidden py-1"
          style={{ background: menuBg, border: `1px solid ${menuBorder}`, animation: 'dropIn 0.15s ease both' }}>
          <button
            onClick={() => { setMenuOpen(false); setRenaming(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-100"
            style={{ color: dark ? '#cbd5e1' : '#374151' }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <div className="mx-2 h-px my-1" style={{ background: menuBorder }} />
          <button
            onClick={() => { setMenuOpen(false); onDelete() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-100 text-red-400"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete project
          </button>
        </div>
      )}

      {/* Project chats (shown when expanded) */}
      {isExpanded && children}
    </div>
  )
}

/* ── ChatHistoryItem ──────────────────────────────────────────────────── */
function ChatHistoryItem({ chat, active, dark, t, onLoad, onRename, onDelete, onMoveToProject, projects, indent = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(chat.title)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const menuRef = useRef(null)
  const moveMenuRef = useRef(null)
  const inputRef = useRef(null)

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
        (!moveMenuRef.current || !moveMenuRef.current.contains(e.target))) {
        setMenuOpen(false)
        setShowMoveMenu(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  // focus rename input
  useEffect(() => {
    if (renaming) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [renaming])

  const commitRename = () => {
    const v = renameVal.trim()
    if (v && v !== chat.title) onRename(v)
    else setRenameVal(chat.title)
    setRenaming(false)
  }

  const menuBg = dark ? '#1e2433' : '#ffffff'
  const menuBorder = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'

  return (
    <div className="relative group/item">
      {renaming ? (
        /* ── inline rename input ── */
        <div className={`flex items-center gap-1.5 px-2 py-1.5 ${indent ? 'ml-6' : ''}`}>
          <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: t.textMuted }} />
          <input
            ref={inputRef}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setRenameVal(chat.title); setRenaming(false) }
            }}
            onBlur={commitRename}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{
              background: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              border: `1.5px solid #6366f1`,
              color: t.text,
            }}
          />
        </div>
      ) : (
        /* ── normal row with drag support ── */
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('chatId', chat.id)
            setIsDragging(true)
          }}
          onDragEnd={() => setIsDragging(false)}
          onClick={onLoad}
          className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${indent ? 'ml-6' : ''} ${isDragging ? 'opacity-50' : ''}`}
          style={{
            background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
            color: active ? '#818cf8' : t.text,
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.itemHover }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
          <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-normal truncate">{chat.title}</p>
          </div>

          {/* 3-dot button — visible on row hover */}
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150
              opacity-0 group-hover/item:opacity-100"
            style={{
              background: menuOpen ? (dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb') : 'transparent',
              color: t.textMuted,
            }}
            onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb' }}
            onMouseLeave={e => { e.stopPropagation(); if (!menuOpen) e.currentTarget.style.background = 'transparent' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" />
            </svg>
          </button>
        </button>
      )}

      {/* ── dropdown menu ── */}
      {menuOpen && (
        <div ref={menuRef}
          className="absolute right-1 top-8 w-44 rounded-xl shadow-xl z-50 overflow-hidden py-1"
          style={{ background: menuBg, border: `1px solid ${menuBorder}`, animation: 'dropIn 0.15s ease both' }}>
          <button
            onClick={() => { setMenuOpen(false); setRenaming(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-100"
            style={{ color: dark ? '#cbd5e1' : '#374151' }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>

          {/* Move to Project */}
          {projects && projects.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-100"
                style={{ color: dark ? '#cbd5e1' : '#374151' }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Folder className="w-3.5 h-3.5 flex-shrink-0" />
                Move to Project
                <svg className={`w-3 h-3 ml-auto transition-transform ${showMoveMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Submenu for projects */}
              {showMoveMenu && (
                <div ref={moveMenuRef}
                  className="absolute left-full top-0 ml-1 w-44 rounded-xl shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto"
                  style={{ background: menuBg, border: `1px solid ${menuBorder}`, animation: 'dropIn 0.15s ease both' }}>
                  {/* Remove from project option */}
                  {chat.projectId && (
                    <>
                      <button
                        onClick={() => {
                          onMoveToProject(null)
                          setMenuOpen(false)
                          setShowMoveMenu(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-100"
                        style={{ color: dark ? '#cbd5e1' : '#374151' }}
                        onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Remove from project
                      </button>
                      <div className="mx-2 h-px my-1" style={{ background: menuBorder }} />
                    </>
                  )}

                  {/* Project list */}
                  {projects.filter(p => p.id !== chat.projectId).map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        onMoveToProject(proj.id)
                        setMenuOpen(false)
                        setShowMoveMenu(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-100"
                      style={{ color: dark ? '#cbd5e1' : '#374151' }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Folder className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{proj.name}</span>
                    </button>
                  ))}

                  {projects.filter(p => p.id !== chat.projectId).length === 0 && !chat.projectId && (
                    <p className="px-3 py-2 text-[10px]" style={{ color: t.textFaint }}>No other projects</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mx-2 h-px my-1" style={{ background: menuBorder }} />
          <button
            onClick={() => { setMenuOpen(false); onDelete() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-100 text-red-400"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete chat
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const { user, logout } = useAuth()

  // Create user-specific keys
  const HISTORY_KEY = getUserKey(user?.id || 'guest', 'chat_history')
  const PROJECTS_KEY = getUserKey(user?.id || 'guest', 'chat_projects')
  const SESSION_KEY = getUserKey(user?.id || 'guest', 'chat_session_id')
  const ACTIVE_CHAT_KEY = getUserKey(user?.id || 'guest', 'active_chat_id')
  const ACTIVE_PROJECT_KEY = getUserKey(user?.id || 'guest', 'active_project_id')

  // ── projects & history (localStorage) ─────────────────────────────
  const [projects, setProjects] = useState(() => loadJSON(PROJECTS_KEY, []))
  const [history, setHistory] = useState(() => loadJSON(HISTORY_KEY, []))
  const [activeChatId, setActiveChatId] = useState(null) // Start fresh, don't restore old chat
  const [expandedProject, setExpandedProject] = useState(null)

  // ── chat state ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [agentTyping, setAgentTyping] = useState(false)

  // ── ui state ───────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const [confirm, setConfirm] = useState(null)  // { message, onConfirm }
  const [newProjectName, setNewProjectName] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  // const [expandedProject, setExpandedProject] = useState(null)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const sessionId = useRef(
    localStorage.getItem(SESSION_KEY) || (() => {
      const id = uuidv4(); localStorage.setItem(SESSION_KEY, id); return id
    })()
  )

  const wsUrl = `ws://localhost:8000/ws/customer/${sessionId.current}`
  const { send } = useWebSocket(wsUrl, (data) => {
    if (data.event === 'agent_message') {
      addMsg({ content: data.message, sender_type: 'agent', sender_name: data.sender })
      setAgentTyping(false)
    } else if (data.event === 'escalation_triggered') {
      setEscalated(true)
      addMsg({ content: data.message, sender_type: 'system' })
    } else if (data.event === 'agent_joined') {
      addMsg({ content: data.message, sender_type: 'system' })
    } else if (data.event === 'agent_typing') {
      setAgentTyping(true)
      setTimeout(() => setAgentTyping(false), 3000)
    }
  })

  const addMsg = (p) => setMessages(prev => [...prev, { id: uuidv4(), timestamp: Date.now(), ...p }])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, agentTyping])

  // persist history with user-specific keys
  useEffect(() => { saveJSON(HISTORY_KEY, history) }, [history, HISTORY_KEY])
  useEffect(() => { saveJSON(PROJECTS_KEY, projects) }, [projects, PROJECTS_KEY])

  // persist active chat ID
  useEffect(() => {
    if (activeChatId) localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId)
    else localStorage.removeItem(ACTIVE_CHAT_KEY)
  }, [activeChatId, ACTIVE_CHAT_KEY])

  // restore messages from active chat on mount
  useEffect(() => {
    // Don't auto-restore old chat on fresh login - let user start fresh
    // History is still saved and accessible in sidebar
    // User can click on old chats to load them

    // Clear active chat ID on mount so user starts with a blank slate
    localStorage.removeItem(ACTIVE_CHAT_KEY)
    setActiveChatId(null)
  }, []) // Run only on mount

  // load projects from database on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectsAPI.getAll()
        const dbProjects = response.data.map(p => ({
          id: p.id,
          name: p.name,
          createdAt: new Date(p.created_at).getTime()
        }))

        // Merge with localStorage projects (in case of offline changes)
        const localProjects = loadJSON(PROJECTS_KEY, [])
        const mergedProjects = [...dbProjects]

        // Add local projects that don't exist in DB
        localProjects.forEach(local => {
          if (!dbProjects.find(db => db.id === local.id)) {
            mergedProjects.push(local)
          }
        })

        setProjects(mergedProjects)
        saveJSON(PROJECTS_KEY, mergedProjects)
      } catch (error) {
        console.error('Failed to load projects from database:', error)
        // Use localStorage as fallback
      }
    }

    if (user) loadProjects()
  }, [user])

  // save messages to active chat in history whenever messages change
  useEffect(() => {
    if (!activeChatId || messages.length === 0) return
    setHistory(prev => prev.map(c => c.id === activeChatId ? { ...c, messages, escalated, updatedAt: Date.now() } : c))
  }, [messages, escalated])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const activeChat = history.find(c => c.id === activeChatId) || null

  // ── new chat ───────────────────────────────────────────────────────
  const startNewChat = useCallback((projectId = null) => {
    const newId = uuidv4()
    const sessId = uuidv4()
    localStorage.setItem(SESSION_KEY, sessId)
    sessionId.current = sessId
    const chat = {
      id: newId, sessionId: sessId,
      title: 'New chat',
      projectId: projectId || null,
      messages: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    }
    setHistory(prev => [chat, ...prev])
    setActiveChatId(newId)
    setMessages([])
    setEscalated(false)
    setInput('')
  }, [user, SESSION_KEY])

  // ── load existing chat ─────────────────────────────────────────────
  const loadChat = (chat) => {
    sessionId.current = chat.sessionId
    localStorage.setItem(SESSION_KEY, chat.sessionId)
    setActiveChatId(chat.id)
    setMessages(chat.messages || [])
    setEscalated(chat.escalated || false)
  }

  // ── new project ────────────────────────────────────────────────────
  const createProject = async () => {
    const name = newProjectName.trim()
    if (!name) return

    try {
      const response = await projectsAPI.create({ name })
      const proj = {
        id: response.data.id,
        name: response.data.name,
        createdAt: new Date(response.data.created_at).getTime()
      }
      setProjects(prev => [proj, ...prev])
      setNewProjectName('')
      setShowNewProject(false)
    } catch (error) {
      console.error('Failed to create project:', error)
      // Fallback to local storage only
      const proj = { id: uuidv4(), name, createdAt: Date.now() }
      setProjects(prev => [proj, ...prev])
      setNewProjectName('')
      setShowNewProject(false)
    }
  }

  // ── send message ───────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = '46px'
      inputRef.current.focus()
    }

    // auto-create chat entry if none active
    if (!activeChatId) {
      const newId = uuidv4()
      const chat = { id: newId, sessionId: sessionId.current, title: msg.slice(0, 40), projectId: null, messages: [], createdAt: Date.now(), updatedAt: Date.now() }
      setHistory(prev => [chat, ...prev])
      setActiveChatId(newId)
    } else {
      setHistory(prev => prev.map(c => c.id === activeChatId && c.title === 'New chat' ? { ...c, title: msg.slice(0, 40) } : c))
    }

    addMsg({ content: msg, sender_type: 'user', sender_name: user?.name || 'You' })
    setLoading(true)  // shows typing indicator

    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        session_id: sessionId.current,
        message: msg,
        visitor_name: user?.name || '',
        visitor_email: user?.email || '',
      })
      const res = await fetch(`/api/chat/stream?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let streamingId = null
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))

          if (data.type === 'meta') {
            // meta arrives first — hide typing indicator, create streaming bubble
            setLoading(false)
            if (data.escalated && !escalated) setEscalated(true)
            if (!data.waiting) {
              streamingId = uuidv4()
              // add empty bubble that we'll fill char by char
              setMessages(prev => [...prev, {
                id: streamingId,
                content: '',
                sender_type: data.escalated ? 'system' : 'ai',
                sender_name: 'AI Assistant',
                timestamp: Date.now(),
                streaming: true,
              }])
            }
          } else if (data.type === 'token' && streamingId) {
            // append each token to the streaming bubble
            setMessages(prev => prev.map(m =>
              m.id === streamingId
                ? { ...m, content: m.content + data.token }
                : m
            ))
          } else if (data.type === 'done') {
            // mark streaming complete
            if (streamingId) {
              setMessages(prev => prev.map(m =>
                m.id === streamingId ? { ...m, streaming: false } : m
              ))
            }
          }
        }
      }
    } catch {
      setLoading(false)
      addMsg({ content: 'Something went wrong. Please try again.', sender_type: 'system' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    else send({ event: 'typing' })
  }

  // ── destructive actions ────────────────────────────────────────────
  const clearChat = () => {
    setMessages([])
    setHistory(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [] } : c))
    setSettingsOpen(false)
  }

  const deleteChat = () => {
    setConfirm({
      message: 'Delete this chat? This cannot be undone.',
      onConfirm: () => {
        setHistory(prev => prev.filter(c => c.id !== activeChatId))
        setActiveChatId(null)
        setMessages([])
        setConfirm(null)
        setSettingsOpen(false)
      }
    })
  }

  const deleteProject = () => {
    const activeChat = history.find(c => c.id === activeChatId)
    if (!activeChat?.projectId) return
    setConfirm({
      message: `Delete project and all its chats?`,
      onConfirm: () => {
        const projectId = activeChat.projectId
        setProjects(prev => prev.filter(p => p.id !== projectId))
        setHistory(prev => prev.filter(c => c.projectId !== projectId))
        setActiveChatId(null)
        setMessages([])
        setConfirm(null)
        setSettingsOpen(false)
      }
    })
  }

  // ── theme ──────────────────────────────────────────────────────────
  const t = dark ? {
    bg: '#0f1117', sidebar: '#13161f', sb: 'rgba(255,255,255,0.06)',
    header: '#13161f', hb: 'rgba(255,255,255,0.06)', msgArea: '#0f1117',
    inputBg: '#1a1f2e', inputBorder: 'rgba(255,255,255,0.1)',
    text: '#f1f5f9', textMuted: '#64748b', textFaint: '#334155',
    chipBg: 'rgba(255,255,255,0.05)', chipBorder: 'rgba(255,255,255,0.08)',
    chipHover: 'rgba(99,102,241,0.15)', divider: 'rgba(255,255,255,0.06)',
    kbdBg: 'rgba(255,255,255,0.06)', itemHover: 'rgba(255,255,255,0.04)',
  } : {
    bg: '#f8fafc', sidebar: '#ffffff', sb: '#f1f5f9',
    header: '#ffffff', hb: '#f1f5f9', msgArea: '#f8fafc',
    inputBg: '#ffffff', inputBorder: '#e2e8f0',
    text: '#0f172a', textMuted: '#64748b', textFaint: '#94a3b8',
    chipBg: '#ffffff', chipBorder: '#e2e8f0', chipHover: '#eef2ff',
    divider: '#f1f5f9', kbdBg: '#f1f5f9', itemHover: '#f8fafc',
  }

  const iconBtn = (onClick, children, title) => (
    <button onClick={onClick} title={title}
      className="p-1.5 rounded-lg transition-all duration-150 flex-shrink-0"
      style={{ color: t.textMuted }}
      onMouseEnter={e => e.currentTarget.style.background = t.itemHover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </button>
  )

  return (
    <>
      <style>{STYLES}</style>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} dark={dark} />}

      <div className="flex h-screen overflow-hidden" style={{ background: t.bg, color: t.text }}>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden"
          style={{ width: sidebarOpen ? 260 : 0, background: t.sidebar, borderRight: `1px solid ${t.sb}` }}>

          {/* brand + new chat btn */}
          <div className="px-3 pt-4 pb-3 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: `1px solid ${t.sb}` }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow flex-shrink-0">
                <span className="text-white text-[10px] font-black">S</span>
              </div>
              <p className="font-bold text-sm tracking-tight" style={{ color: t.text }}>SupportAI</p>
            </div>
            {/* New Chat button */}
            <button onClick={() => startNewChat(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          </div>

          {/* New Project button */}
          <div className="px-3 pt-3 pb-2">
            {!showNewProject ? (
              <button onClick={() => setShowNewProject(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={{ color: t.textMuted }}
                onMouseEnter={e => e.currentTarget.style.background = t.itemHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            ) : (
              <div className="flex gap-2">
                <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createProject(); if (e.key === 'Escape') setShowNewProject(false) }}
                  placeholder="Project name"
                  className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                <button onClick={createProject}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  Add
                </button>
              </div>
            )}
          </div>

          {/* scrollable content */}
          <div className={`flex-1 overflow-y-auto px-2 py-3 space-y-1 ${dark ? 'cs' : 'cs-light'}`}>

            {/* ── Projects section (collapsible folders) ── */}
            {projects.length > 0 && (
              <div className="mb-4">
                {projects.map(proj => {
                  const projectChats = history.filter(c => c.projectId === proj.id)
                  const isExpanded = expandedProject === proj.id

                  return (
                    <ProjectFolderItem
                      key={proj.id}
                      project={proj}
                      isExpanded={isExpanded}
                      dark={dark}
                      t={t}
                      projectChats={projectChats}
                      onToggle={() => setExpandedProject(isExpanded ? null : proj.id)}
                      onRename={async (newName) => {
                        try {
                          await projectsAPI.update(proj.id, { name: newName })
                          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, name: newName } : p))
                        } catch (error) {
                          console.error('Failed to rename project:', error)
                          // Update locally anyway
                          setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, name: newName } : p))
                        }
                      }}
                      onDelete={() => {
                        setConfirm({
                          message: `Delete project "${proj.name}" and all its chats?`,
                          onConfirm: async () => {
                            try {
                              await projectsAPI.delete(proj.id)
                              setProjects(prev => prev.filter(p => p.id !== proj.id))
                              setHistory(prev => prev.filter(c => c.projectId !== proj.id))
                              if (activeChat?.projectId === proj.id) {
                                setActiveChatId(null)
                                setMessages([])
                              }
                              setConfirm(null)
                            } catch (error) {
                              console.error('Failed to delete project:', error)
                              // Delete locally anyway
                              setProjects(prev => prev.filter(p => p.id !== proj.id))
                              setHistory(prev => prev.filter(c => c.projectId !== proj.id))
                              if (activeChat?.projectId === proj.id) {
                                setActiveChatId(null)
                                setMessages([])
                              }
                              setConfirm(null)
                            }
                          }
                        })
                      }}
                      onDrop={(e) => {
                        const chatId = e.dataTransfer.getData('chatId')
                        if (chatId) {
                          setHistory(prev => prev.map(c => c.id === chatId ? { ...c, projectId: proj.id, updatedAt: Date.now() } : c))
                        }
                      }}>
                      {/* Project chats */}
                      {projectChats.map(chat => (
                        <ChatHistoryItem
                          key={chat.id}
                          chat={chat}
                          active={activeChatId === chat.id}
                          dark={dark}
                          t={t}
                          projects={projects}
                          onLoad={() => loadChat(chat)}
                          onRename={(newTitle) => {
                            setHistory(prev => prev.map(c => c.id === chat.id ? { ...c, title: newTitle } : c))
                          }}
                          onMoveToProject={async (projectId) => {
                            try {
                              const targetProjectId = projectId || 'none'
                              await projectsAPI.moveChat(targetProjectId, chat.id)
                              setHistory(prev => prev.map(c => c.id === chat.id ? { ...c, projectId, updatedAt: Date.now() } : c))
                            } catch (error) {
                              console.error('Failed to move chat:', error)
                              // Update locally anyway
                              setHistory(prev => prev.map(c => c.id === chat.id ? { ...c, projectId, updatedAt: Date.now() } : c))
                            }
                          }}
                          onDelete={() => {
                            setConfirm({
                              message: `Delete "${chat.title}"? This cannot be undone.`,
                              onConfirm: () => {
                                setHistory(prev => prev.filter(c => c.id !== chat.id))
                                if (activeChatId === chat.id) { setActiveChatId(null); setMessages([]) }
                                setConfirm(null)
                              }
                            })
                          }}
                          indent={true}
                        />
                      ))}
                    </ProjectFolderItem>
                  )
                })}
              </div>
            )}

            {/* ── Recent chats section (ALL chats without project) ── */}
            <div>
              {history.filter(c => !c.projectId).length > 0 && (
                <>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold" style={{ color: t.textMuted }}>Recent</p>
                  </div>
                  {history.filter(c => !c.projectId).map(chat => (
                    <ChatHistoryItem
                      key={chat.id}
                      chat={chat}
                      active={activeChatId === chat.id}
                      dark={dark}
                      t={t}
                      projects={projects}
                      onLoad={() => loadChat(chat)}
                      onRename={(newTitle) => {
                        setHistory(prev => prev.map(c => c.id === chat.id ? { ...c, title: newTitle } : c))
                      }}
                      onMoveToProject={async (projectId) => {
                        try {
                          const targetProjectId = projectId || 'none'
                          await projectsAPI.moveChat(targetProjectId, chat.id)
                          setHistory(prev => prev.map(c => c.id === chat.id ? { ...c, projectId, updatedAt: Date.now() } : c))
                        } catch (error) {
                          console.error('Failed to move chat:', error)
                          // Update locally anyway
                          setHistory(prev => prev.map(c => c.id === chat.id ? { ...c, projectId, updatedAt: Date.now() } : c))
                        }
                      }}
                      onDelete={() => {
                        setConfirm({
                          message: `Delete "${chat.title}"? This cannot be undone.`,
                          onConfirm: () => {
                            setHistory(prev => prev.filter(c => c.id !== chat.id))
                            if (activeChatId === chat.id) { setActiveChatId(null); setMessages([]) }
                            setConfirm(null)
                          }
                        })
                      }}
                      indent={false}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* dark mode toggle */}
          <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${t.sb}` }}>
            <button onClick={() => setDark(d => !d)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150"
              style={{ color: t.textMuted }}
              onMouseEnter={e => e.currentTarget.style.background = t.itemHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="flex items-center gap-2">
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {dark ? 'Light mode' : 'Dark mode'}
              </span>
              <div className="w-8 h-4 rounded-full relative transition-all duration-300 flex-shrink-0"
                style={{ background: dark ? '#6366f1' : '#d1d5db' }}>
                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: dark ? '17px' : '2px' }} />
              </div>
            </button>
          </div>
        </aside>

        {/* ── Main area ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* header */}
          <header className="flex items-center justify-between px-4 py-3 z-20 flex-shrink-0"
            style={{ background: t.header, borderBottom: `1px solid ${t.hb}` }}>
            <div className="flex items-center gap-2">
              {iconBtn(() => setSidebarOpen(o => !o),
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
                'Toggle sidebar'
              )}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0 ${escalated ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}>
                  {escalated ? <Users className="w-4 h-4" /> : <Sparkle className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm" style={{ color: t.text }}>{escalated ? 'Human Agent' : 'AI Assistant'}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${escalated ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${escalated ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                      {escalated ? 'Connected' : 'Online'}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: t.textMuted }}>
                    {activeChat?.projectId ? (
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        {projects.find(p => p.id === activeChat.projectId)?.name}
                      </span>
                    ) : (escalated ? 'Real person connected' : 'GPT · Always available')}
                  </p>
                </div>
              </div>
            </div>

            {/* settings */}
            <div className="relative">
              <button onClick={() => setSettingsOpen(o => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-150"
                style={{ background: settingsOpen ? t.itemHover : 'transparent' }}
                onMouseEnter={e => { if (!settingsOpen) e.currentTarget.style.background = t.itemHover }}
                onMouseLeave={e => { if (!settingsOpen) e.currentTarget.style.background = 'transparent' }}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shadow">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none" style={{ color: t.text }}>{user?.name}</p>

                </div>
                <svg className={`w-3 h-3 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}
                  style={{ color: t.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {settingsOpen && (
                <SettingsPanel user={user} dark={dark}
                  onClearChat={clearChat} onDeleteChat={deleteChat} onDeleteProject={deleteProject}
                  onLogout={logout} onClose={() => setSettingsOpen(false)} activeChat={activeChat} projects={projects} />
              )}
            </div>
          </header>

          {/* messages */}
          <div className={`flex-1 overflow-y-auto ${dark ? 'cs' : 'cs-light'}`} style={{ background: t.msgArea }}>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl mb-4 shadow-xl">
                    <Sparkle className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: t.text }}>How can I help you?</h2>
                  <p className="text-sm mb-7 max-w-xs leading-relaxed" style={{ color: t.textMuted }}>
                    Ask me anything — I'm here 24/7 and can connect you to a real person anytime.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map(s => {
                      const Icon = s.icon
                      return (
                        <button key={s.label} onClick={() => sendMessage(s.text)}
                          className="px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
                          style={{ background: t.chipBg, border: `1px solid ${t.chipBorder}`, color: t.textMuted }}
                          onMouseEnter={e => { e.currentTarget.style.background = t.chipHover; e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.borderColor = '#6366f1' }}
                          onMouseLeave={e => { e.currentTarget.style.background = t.chipBg; e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.chipBorder }}>
                          <Icon className="w-3.5 h-3.5" />
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-5">
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} dark={dark} />)}
                {(loading || agentTyping) && <TypingIndicator label={agentTyping ? 'Agent' : 'AI Assistant'} isAgent={agentTyping} dark={dark} />}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>

          {/* input */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4" style={{ background: t.header, borderTop: `1px solid ${t.hb}` }}>
            <div className="max-w-2xl mx-auto flex items-end gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-1 shadow">
                {initials}
              </div>
              <div className="flex-1 relative">
                <textarea ref={inputRef} rows={1}
                  className="w-full resize-none rounded-2xl px-4 py-3 pr-12 text-sm outline-none transition-all duration-200 leading-relaxed chat-input"
                  style={{ background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text, minHeight: '46px', maxHeight: '120px', overflow: 'hidden' }}
                  placeholder={escalated ? 'Message your agent…' : 'Type your message…'}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    // reset then grow — overflow:hidden prevents scrollbar flash
                    e.target.style.height = '46px'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = t.inputBorder}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-25"
                  style={{ background: input.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : (dark ? '#1e2433' : '#e5e7eb') }}>
                  <svg className="w-4 h-4" fill="none" stroke={input.trim() ? 'white' : t.textFaint} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: t.textFaint }}>
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: t.kbdBg, color: t.textMuted }}>Enter</kbd> send &nbsp;·&nbsp;
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: t.kbdBg, color: t.textMuted }}>Shift+Enter</kbd> new line
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
