export const API_URL = (import.meta.env.VITE_API_URL || 'https://schoolagent-backend.onrender.com').replace(/\/$/, '') + '/api'

export interface User {
  id: string
  email: string
  full_name: string | null
  preferences: Record<string, unknown>
  created_at: string
}

export interface LoginResponse {
  user: User
  token: string
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

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
})

const getResponseJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const authApi = {
  register: async (email: string, password: string, fullName?: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
    
    const data = await getResponseJson(response)
    
    if (!response.ok) {
      throw new Error(data?.detail || 'Registration failed')
    }
    
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    
    const data = await getResponseJson(response)
    
    if (!response.ok) {
      throw new Error(data?.detail || 'Login failed')
    }
    
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  deleteAccount: async () => {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    
    if (!response.ok) {
      const data = await getResponseJson(response)
      throw new Error(data?.detail || 'Delete failed')
    }
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

export const tasksApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: authHeaders(),
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  create: async (task: { title: string; description?: string; priority?: string; due_date?: string }) => {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(task),
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  update: async (taskId: string, task: { title?: string; description?: string; completed?: boolean; priority?: string }) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(task),
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  delete: async (taskId: string) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    
    if (!response.ok) throw new Error('Request failed')
  },
}

export const eventsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/events`, {
      headers: authHeaders(),
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  create: async (event: { title: string; date: string; time?: string; description?: string }) => {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(event),
    })
    
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  },

  delete: async (eventId: string) => {
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    
    if (!response.ok) throw new Error('Request failed')
  },
}

export const chatApi = {
  send: async (message: string) => {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message }),
    })
    
    const data = await getResponseJson(response)
    
    if (!response.ok) {
      throw new Error(data?.response || 'Chat failed')
    }
    
    return data.response
  },
}