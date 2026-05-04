import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { adminAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { UserPlus, Users as UsersIcon, Shield, AlertCircle, CheckCircle } from 'lucide-react'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('agents')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  // Only admin can access this page
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/admin', { replace: true })
  }, [user])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [agRes, usRes] = await Promise.all([adminAPI.listAgents(), adminAPI.listUsers()])
      setAgents(agRes.data)
      setUsers(usRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleCreate = async e => {
    e.preventDefault()
    setError(''); setSuccess(''); setCreating(true)
    try {
      await adminAPI.createAgent(form)
      setSuccess(`Agent "${form.name}" created successfully`)
      setForm({ name: '', email: '', password: '' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create agent')
    } finally { setCreating(false) }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage agents and users
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
          {[
            { key: 'agents', label: 'Agents', count: agents.length, icon: Shield },
            { key: 'users', label: 'Users', count: users.length, icon: UsersIcon },
            { key: 'create', label: 'Create Agent', icon: UserPlus },
          ].map(t => {
            const Icon = t.icon
            return (
              <button 
                key={t.key} 
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}>
                <Icon className="w-4 h-4" />
                {t.label}
                {t.count !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-semibold">
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Create Agent Form */}
        {tab === 'create' && (
          <Card className="p-6 max-w-2xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Agent Account</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Agent accounts can only be created by admins
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input 
                  type="text" 
                  placeholder="John Smith" 
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  placeholder="agent@company.com" 
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  placeholder="Min. 6 characters" 
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {creating ? 'Creating...' : 'Create Agent'}
              </button>
            </form>
          </Card>
        )}

        {/* Agents List */}
        {tab === 'agents' && (
          <UserTable rows={agents} emptyMsg="No agents yet" loading={loading} />
        )}

        {/* Users List */}
        {tab === 'users' && (
          <UserTable rows={users} emptyMsg="No users registered yet" loading={loading} />
        )}
      </div>
    </AdminLayout>
  )
}

function UserTable({ rows, emptyMsg, loading }) {
  const ROLE_CONFIG = {
    admin: { variant: 'default', label: 'Admin', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    agent: { variant: 'info', label: 'Agent', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    user: { variant: 'default', label: 'User', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  }

  return (
    <Card>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {emptyMsg}
                  </td>
                </tr>
              )}
              {rows.map(u => {
                const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.user
                return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                          {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
