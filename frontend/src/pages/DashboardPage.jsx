import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { chatAPI, analyticsAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../hooks/useAuth'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ChatActivityChart from '../components/ui/ChatActivityChart'
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3
} from 'lucide-react'

const STATUS_CONFIG = {
  active: { variant: 'success', label: 'Active', dot: true },
  escalated: { variant: 'danger', label: 'Escalated', dot: true },
  assigned: { variant: 'info', label: 'Assigned', dot: true },
  closed: { variant: 'default', label: 'Closed', dot: false },
}

export default function DashboardPage() {
  const [chats, setChats] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [chartType, setChartType] = useState('bar') // 'bar' or 'line'
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const wsUrl = user ? `ws://localhost:8000/ws/agent/${user.id}?token=${token}` : null

  useWebSocket(wsUrl, (data) => {
    if (data.event === 'escalation_triggered') {
      setNotification(`New escalation from ${data.visitor_name}`)
      setTimeout(() => setNotification(null), 5000)
      fetchData()
    } else if (data.event === 'agent_joined') {
      fetchData()
    }
  })

  const fetchData = async () => {
    try {
      const [chatsRes, analyticsRes] = await Promise.all([
        chatAPI.getAll(),
        analyticsAPI.getChatActivity(7)
      ])
      setChats(chatsRes.data)
      setChartData(analyticsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const escalatedChats = chats.filter(c => c.status === 'escalated')
  const activeChats = chats.filter(c => c.status === 'active')
  const assignedChats = chats.filter(c => c.status === 'assigned')
  const totalChats = chats.length

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Notification */}
        {notification && (
          <div className="fixed top-20 right-6 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg z-50 text-sm font-medium animate-pulse flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {notification}
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor and manage all chat conversations
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Escalated Chats"
            value={escalatedChats.length}
            trend="+12% from last week"
            trendUp={false}
            icon={AlertCircle}
            iconColor="text-red-600 dark:text-red-400"
          />
          <StatCard
            title="Active AI Chats"
            value={activeChats.length}
            trend="+8% from last week"
            trendUp={true}
            icon={CheckCircle}
            iconColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Assigned Chats"
            value={assignedChats.length}
            trend="+5% from last week"
            trendUp={true}
            icon={Clock}
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Total Chats"
            value={totalChats}
            trend="+15% from last week"
            trendUp={true}
            icon={MessageSquare}
            iconColor="text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Chat Activity Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Activity</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Overview of chat volume over the past week
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-600">+15% this week</span>
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    chartType === 'bar'
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}>
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    chartType === 'line'
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}>
                  <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ChatActivityChart data={chartData} type={chartType} />
          </div>
        </Card>

        {/* Chat Table */}
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Chats</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              All conversations across the platform
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    {['Visitor', 'Status', 'Messages', 'Last Updated', 'Action'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {chats.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No chats yet
                      </td>
                    </tr>
                  )}
                  {chats.map(chat => {
                    const statusConfig = STATUS_CONFIG[chat.status] || STATUS_CONFIG.closed
                    return (
                      <tr 
                        key={chat.id} 
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                              {(chat.visitor_name || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {chat.visitor_name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {chat.visitor_email || chat.session_id.slice(0, 12) + '...'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.dot && (
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            )}
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {chat.message_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(chat.updated_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/admin/chat/${chat.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                            View
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
