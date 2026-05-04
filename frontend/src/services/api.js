import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const chatAPI = {
  send: (data) => api.post('/chat', data),
  getAll: () => api.get('/chat'),
  getById: (id) => api.get(`/chat/${id}`),
}

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),   // token comes from interceptor
}

export const agentAPI = {
  sendMessage: (data) => api.post('/agent/message', data),
  joinChat: (data) => api.post('/agent/join', data),
  setAvailability: (data) => api.post('/agent/availability', data),
}

export const leadsAPI = {
  getAll: () => api.get('/leads'),
  update: (id, data) => api.patch(`/leads/${id}`, data),
}

export const escalateAPI = {
  escalate: (data) => api.post('/escalate', data),
}

export const adminAPI = {
  createAgent: (data) => api.post('/admin/create-agent', data),
  listAgents:  ()     => api.get('/admin/agents'),
  listUsers:   ()     => api.get('/admin/users'),
}

export const analyticsAPI = {
  getChatActivity: (days = 7) => api.get(`/analytics/chat-activity?days=${days}`),
  getSummary: () => api.get('/analytics/summary'),
}

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  moveChat: (projectId, chatId) => api.patch(`/projects/${projectId}/chats/${chatId}`),
}

export default api
