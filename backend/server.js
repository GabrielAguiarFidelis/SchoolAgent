import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GROQ_API_KEY = process.env.GROQ_API_KEY

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
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
    
    if (!user || user.length === 0) {
      return res.status(400).json({ detail: 'Usuário não encontrado' })
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
    console.error('Task create error:', err)
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
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
    
    if (!user || user.length === 0) {
      return res.status(400).json({ detail: 'Usuário não encontrado' })
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

app.delete('/api/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
    
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

// ==================== CHAT / ANÁLISE DIÁRIA ====================

app.post('/api/chat', async (req, res) => {
  try {
    const { message, user_id } = req.body
    
    // Buscar dados do usuário
    const [{ data: tasks }, { data: events }, { data: user }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user_id),
      supabase.from('events').select('*').eq('user_id', user_id),
      supabase.from('users').select('*').eq('id', user_id)
    ])
    
    const tarefasPendentes = (tasks || []).filter(t => !t.completed)
    const tarefasVencidas = tarefasPendentes.filter(t => {
      if (!t.due_date) return false
      return new Date(t.due_date) < new Date()
    })
    
    const hoje = new Date().toISOString().split('T')[0]
    const eventosHoje = (events || []).filter(e => e.date === hoje)
    const eventosSemana = (events || []).filter(e => {
      const dataEvento = new Date(e.date)
      const agora = new Date()
      const diff = (dataEvento - agora) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 7
    })
    
    const nomeUsuario = user?.[0]?.full_name || 'Usuário'
    
    const tarefasLista = tarefasPendentes.slice(0, 5).map(t => {
  const prio = t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baixa'
  const prazo = t.due_date ? ' - vence ' + new Date(t.due_date).toLocaleDateString('pt-BR') : ''
  return '* ' + t.title + ' (' + prio + prazo + ')'
}).join('\n') || 'Nenhuma tarefa pendente'

const tarefasVencidasLista = tarefasVencidas.map(t => 'ATENCAO: ' + t.title).join('\n') || 'Nenhuma'

const eventosHojeLista = eventosHoje.map(e => 'Evento: ' + e.title + (e.time ? ' as ' + e.time : '')).join('\n') || 'Nenhum evento hoje'

const eventosSemanaLista = eventosSemana.slice(0, 3).map(e => '* ' + e.title + ' - ' + new Date(e.date).toLocaleDateString('pt-BR')).join('\n') || 'Nenhum evento na semana'

const pergunda = message && !message.includes('analise') ? '\nPergunta do usuario: ' + message : ''

    const dataAtual = new Date().toLocaleDateString('pt-BR')
    const saudacao = getSaudacao()
    
    let resumo = saudacao + ' ' + nomeUsuario + '! Seu resumo de hoje (' + dataAtual + '):\n\n'
    
    if (tarefasVencidas.length > 0) {
      resumo += 'ATENCAO! ' + tarefasVencidas.length + ' tarefa(s) vencida(s):\n'
      tarefasVencidas.slice(0, 3).forEach(t => {
        resumo += '- ' + t.title + '\n'
      })
      if (tarefasVencidas.length > 3) resumo += '... e mais ' + (tarefasVencidas.length - 3) + '\n'
      resumo += '\n'
    }
    
    resumo += 'Tarefas pendentes: ' + tarefasPendentes.length + '\n'
    if (tarefasPendentes.length > 0) {
      tarefasPendentes.slice(0, 5).forEach(t => {
        const prio = t.priority === 'high' ? '[URGENTE]' : t.priority === 'medium' ? '[medio]' : '[baixo]'
        const prazo = t.due_date ? ' ate ' + new Date(t.due_date).toLocaleDateString('pt-BR') : ''
        resumo += '- ' + prio + ' ' + t.title + prazo + '\n'
      })
    }
    
    if (eventosHoje.length > 0) {
      resumo += '\nEventos hoje:\n'
      eventosHoje.forEach(e => {
        resumo += '- ' + e.title + (e.time ? ' as ' + e.time : '') + '\n'
      })
    }
    
    if (eventosSemana.length > 0) {
      resumo += '\nEventos da semana:\n'
      eventosSemana.slice(0, 3).forEach(e => {
        resumo += '- ' + e.title + ' em ' + new Date(e.date).toLocaleDateString('pt-BR') + '\n'
      })
    }
    
    resumo += '\nDica: Foque nas tarefas [URGENTE] primeiro!'
    
    const perguntaUsuario = message || ''
    
    if (GROQ_API_KEY) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + GROQ_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: 'Voce e um assistente de produtividade amigavel e motivador. Sempre inclua um resumo do dia e uma dica de produtividade. Responda em portugues brasileiro, seja direto e util. Maximo 300 caracteres na resposta final.'
              },
              {
                role: 'user',
                content: 'Contexto do usuario ' + nomeUsuario + ':\n' + resumo + '\n\nPergunta do usuario: ' + perguntaUsuario
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          })
        })
        
        const groqData = await groqResponse.json()
        if (groqData.choices && groqData.choices[0]) {
          response = groqData.choices[0].message.content
        } else {
          response = resumo
        }
      } catch (iaErr) {
        console.log('Groq error:', iaErr.message)
        response = resumo
      }
    } else {
      response = resumo
    }
    
    res.json({ response: response })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ response: 'Desculpe, tive um problema ao processar sua mensagem.' })
  }
})

function gerarRespostaSimples(tarefasPendentes, tarefasVencidas, eventosHoje, nomeUsuario, perguntaUsuario) {
  const dataAtual = new Date().toLocaleDateString('pt-BR')
  const saudacao = getSaudacao()
  
  let msg = saudacao + ' ' + nomeUsuario + '! Aqui esta seu resumo de hoje (' + dataAtual + '):\n\n'
  
  // Tarefas vencidas
  if (tarefasVencidas.length > 0) {
    msg += 'ATENCAO! Voce tem ' + tarefasVencidas.length + ' tarefa(s) vencida(s):\n'
    tarefasVencidas.slice(0, 3).forEach(t => {
      msg += ' - ' + t.title + '\n'
    })
    if (tarefasVencidas.length > 3) msg += ' ... e mais ' + (tarefasVencidas.length - 3) + '\n'
    msg += '\n'
  }
  
  // Tarefas pendentes
  msg += 'Tarefas pendentes: ' + tarefasPendentes.length + '\n'
  if (tarefasPendentes.length > 0) {
    tarefasPendentes.slice(0, 3).forEach(t => {
      const prio = t.priority === 'high' ? '[URGENTE]' : t.priority === 'medium' ? '[medio]' : '[baixo]'
      const prazo = t.due_date ? ' - ate ' + new Date(t.due_date).toLocaleDateString('pt-BR') : ''
      msg += ' ' + prio + ' ' + t.title + prazo + '\n'
    })
  }
  
  // Eventos hoje
  if (eventosHoje.length > 0) {
    msg += '\nEventos de hoje:\n'
    eventosHoje.forEach(e => {
      msg += ' - ' + e.title + (e.time ? ' as ' + e.time : '') + '\n'
    })
  }
  
  // Resposta a perguntas
  if (perguntaUsuario) {
    const p = perguntaUsuario.toLowerCase()
    if (p.includes('prioridad') || p.includes('importante')) {
      const urgentes = tarefasPendentes.filter(t => t.priority === 'high')
      if (urgentes.length > 0) {
        msg += '\nSuas prioridades hoje:\n'
        urgentes.forEach(t => msg += ' - ' + t.title + '\n')
      } else {
        msg += '\nVoce nao tem tarefas urgentes hoje!\n'
      }
    } else if (p.includes('dica') || p.includes('produtividad')) {
      msg += '\nDica: Comece pelo mais dificil primeiro! Isso aumenta sua motivacao.\n'
    } else if (p.includes('resumo') || p.includes('analise')) {
      // Ja tem resumo completo
    }
  } else {
    msg += '\nDica: Foque nas tarefas [URGENTE] primeiro para melhorar sua produtividade.\n'
  }
  
  return msg
}

function getSaudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ==================== HEALTH ====================

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('/', (req, res) => {
  res.json({ message: 'Productivity Agent API', status: 'running' })
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})