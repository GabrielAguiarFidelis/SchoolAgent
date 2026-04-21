// Sistema de Notificações e Análise Diária

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// VAPID keys para Web Push (gere em https://web-push-codelab.glitch.me/)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'sua_chave_publica'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'sua_chave_privada'

// ==================== SALVAR PUSH SUBSCRIPTION ====================

export async function savePushSubscription(userId, subscription) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      subscription: JSON.stringify(subscription),
      created_at: new Date().toISOString()
    })
    .select()
  
  if (error) throw error
  return data
}

// ==================== GERAR ANÁLISE COM GEMINI ====================

async function gerarAnalise(tasks, events, userName) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const tarefasPendentes = tasks.filter(t => !t.completed)
  const tarefasVencidas = tarefasPendentes.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date()
  })
  
  const eventosHoje = events.filter(e => e.date === new Date().toISOString().split('T')[0])
  
  const prompt = `Você é um assistente de produtividade. Analise os dados do usuário ${userName || 'usuário'} e gere um resumo matinal.

Tarefas pendentes (${tarefasPendentes.length}):
${tarefasPendentes.map(t => `- ${t.title} (prioridade: ${t.priority}, prazo: ${t.due_date || 'sem prazo'}`).join('\n')}

Tarefas vencidas (${tarefasVencidas.length}):
${tarefasVencidas.map(t => `- ${t.title}`).join('\n') || 'Nenhuma'}

Eventos de hoje (${eventosHoje.length}):
${eventosHoje.map(e => `- ${e.title} ${e.time || ''}`).join('\n') || 'Nenhum'}

Gere um resumo:
1. Saudação personalizada
2. Quantidade de tarefas pendentes
3. Tarefas que vencem hoje
4. Prioridades do dia
5. Uma dica de produtividade
6. Se não houver tarefas, mensagem motivacional

Mantenha curto (máximo 200 caracteres no total).`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (err) {
    console.error('Erro Gemini:', err)
    // Fallback simples
    return `Bom dia! Você tem ${tarefasPendentes.length} tarefas pendentes. Vamos ser produtivos hoje!`
  }
}

// ==================== ENVIAR NOTIFICAÇÃO ====================

async function enviarNotificacao(userId, titulo, corpo) {
  const { data: subscription } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
  
  if (!subscription || subscription.length === 0) {
    console.log('Usuário não tem subscription push')
    return
  }
  
  const sub = JSON.parse(subscription[0].subscription)
  
  // Web Push payload
  const payload = JSON.stringify({
    title: titulo,
    body: corpo,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'daily-summary',
    data: { url: '/' }
  })
  
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: sub.endpoint,
        notification: {
          title: titulo,
          body: corpo
        },
        data: { url: '/' }
      })
    })
    
    console.log('Notificação enviada:', response.ok)
  } catch (err) {
    console.error('Erro ao enviar notificação:', err)
  }
}

// ==================== ANÁLISE DIÁRIA ====================

export async function executarAnaliseDiaria() {
  console.log('Executando análise diária...')
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
  
  for (const user of users) {
    // Checar se usuário quer notificações
    const prefs = user.preferences || {}
    if (!prefs.notifications || prefs.notifications !== true) {
      console.log(`Usuário ${user.email} não quer notificações`)
      continue
    }
    
    // Buscar tarefas e eventos
    const [{ data: tasks }, { data: events }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('events').select('*').eq('user_id', user.id)
    ])
    
    // Gerar análise
    const analise = await gerarAnalise(tasks || [], events || [], user.full_name)
    
    // Enviar notificação
    await enviarNotificacao(user.id, '☀️ Resumo do Dia', analise)
  }
  
  console.log('Análise diária finalizada')
}

// ==================== SCHEDULER ====================

import { setTimeout as setTimeoutPromise } from 'timers/promises'

export async function iniciarScheduler() {
  const AGENDAR_AS = 8 // 8h
  
  while (true) {
    const agora = new Date()
    const proximaExecucao = new Date()
    proximaExecucao.setHours(AGENDAR_AS, 0, 0, 0)
    
    if (agora > proximaExecucao) {
      proximaExecucao.setDate(proximaExecucao.getDate() + 1)
    }
    
    const delay = proximaExecucao - agora
    console.log(`Próxima análise às ${proximaExecucao.toLocaleString('pt-BR')}`)
    
    await setTimeoutPromise(delay)
    await executarAnaliseDiaria()
  }
}

// Para testar manualmente:
if (process.argv.includes('--test')) {
  executarAnaliseDiaria()
    .then(() => console.log('Teste concluído'))
    .catch(console.error)
}