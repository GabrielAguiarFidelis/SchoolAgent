const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ==================== AUTH ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters' })
    }
    
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
    
    if (existing?.length > 0) {
      return res.status(400).json({ detail: 'Email already registered' })
    }
    
    const password_hash = await bcrypt.hash(password, 10)
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name: full_name || null,
        preferences: {}
      })
      .select()
    
    if (error) throw error
    
    res.json({ user: data[0] })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ detail: err.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' })
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return res.status(401).json({ detail: 'Invalid email or password' })
    }
    
    const user = data[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid email or password' })
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        preferences: user.preferences,
        created_at: user.created_at
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ detail: err.message })
  }
})

// ==================== TASKS ====================

app.get('/api/tasks', async (req, res) => {
  try {
    const userId = req.query.user_id
    if (!userId) return res.status(400).json({ detail: 'user_id required' })
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const { user_id, title, description, priority, due_date } = req.body
    
    if (!user_id || !title) {
      return res.status(400).json({ detail: 'user_id and title required' })
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id,
        title,
        description: description || null,
        priority: priority || 'medium',
        due_date: due_date || null,
        completed: false
      })
      .select()
    
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id
    const { user_id, ...updates } = req.body
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', user_id)
      .select()
    
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id
    const userId = req.query.user_id
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)
    
    if (error) throw error
    res.json({ message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

// ==================== EVENTS ====================

app.get('/api/events', async (req, res) => {
  try {
    const userId = req.query.userId
    if (!userId) return res.status(400).json({ detail: 'userId required' })
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

app.post('/api/events', async (req, res) => {
  try {
    const { user_id, title, date, time, description } = req.body
    
    if (!user_id || !title || !date) {
      return res.status(400).json({ detail: 'user_id, title and date required' })
    }
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id,
        title,
        date,
        time: time || null,
        description: description || null
      })
      .select()
    
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

// ==================== CHAT ====================

app.post('/api/chat', async (req, res) => {
  try {
    const { message, user_id } = req.body
    
    const [{ data: tasks }, { data: events }, { data: user }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user_id),
      supabase.from('events').select('*').eq('user_id', user_id),
      supabase.from('users').select('*').eq('id', user_id)
    ])
    
    const tarefasPendentes = (tasks || []).filter(t => !t.completed)
    const nomeUsuario = user?.[0]?.full_name || 'Usuario'
    
    // Simple response (no AI due to serverless limitations)
    const response = gerarRespostaSimples(tarefasPendentes, nomeUsuario)
    
    res.json({ response })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ response: 'Desculpe, tuve un problema.' })
  }
})

function gerarRespostaSimples(tarefas, nome) {
  const pendentes = tarefas.length
  const urgentes = tarefas.filter(t => t.priority === 'high').length
  
  return `Ola ${nome}! Voce tem ${pendentes} tarefas pendentes, sendo ${urgentes} urgentes. Foque nas tarefas de alta prioridade primeiro!`
}

module.exports = app