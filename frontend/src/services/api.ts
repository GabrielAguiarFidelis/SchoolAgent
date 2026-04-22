const API_URL = (import.meta.env.VITE_API_URL || 'https://schoolagent-backend.onrender.com').replace(/\/$/, '') + '/api'

export interface User {
  id: string
  email: string
  full_name: string | null
  preferences: Record<string, unknown>
  created_at: string
}

export interface LoginResponse {
  user: User
}

const getToken = () => localStorage.getItem('token')
const getUser = () => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }
  return null
}

export const authApi = {
  register: async (email: string, password: string, fullName?: string) => {
    console.log('Registering:', email)
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }
    
    const data = await response.json()
    const token = btoa(`${data.user.id}:${Date.now()}`)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    
    const text = await response.text()
    
    if (!response.ok) {
      let detail = 'Login failed'
      try {
        const error = JSON.parse(text)
        detail = error.detail || detail
      } catch {}
      throw new Error(detail)
    }
    
    const data = JSON.parse(text)
    const token = btoa(`${data.user.id}:${Date.now()}`)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },
}

export const tasksApi = {
  getAll: async () => {
    const user = getUser()
    if (!user) throw new Error('Not authenticated')
    
    const response = await fetch(`${API_URL}/tasks/?user_id=${user.id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  create: async (task: { title: string; description?: string; priority?: string; due_date?: string }) => {
    const user = getUser()
    if (!user) throw new Error('Not authenticated')
    
    console.log('Creating task:', { ...task, user_id: user.id })
    
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...task, user_id: user.id }),
    })
    
    console.log('Response status:', response.status)
    const text = await response.text()
    console.log('Response:', text)
    
    if (!response.ok) throw new Error('Request failed')
    return JSON.parse(text)
  },

  update: async (taskId: string, task: { title?: string; description?: string; completed?: boolean; priority?: string }) => {
    const user = getUser()
    if (!user) throw new Error('Not authenticated')
    
    const response = await fetch(`${API_URL}/tasks/${taskId}?user_id=${user.id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...task, user_id: user.id }),
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  delete: async (taskId: string) => {
    const user = getUser()
    if (!user) throw new Error('Not authenticated')
    
    const response = await fetch(`${API_URL}/tasks/${taskId}?user_id=${user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    
if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }
  },
}

export const eventsApi = {
  getAll: async () => {
    const user = getUser()
    if (!user) throw new Error('Not authenticated')
    
    const response = await fetch(`${API_URL}/events/?userId=${user.id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  create: async (event: { title: string; date: string; time?: string; description?: string }) => {
    const user = getUser()
    if (!user) throw new Error('Not authenticated')
    
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...event, user_id: user.id }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }
    return response.json()
  },

  delete: async (eventId: string) => {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    })
    
    if (!response.ok) throw new Error('Request failed')
  },
}