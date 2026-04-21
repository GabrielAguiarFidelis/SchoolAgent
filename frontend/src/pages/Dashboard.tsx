import { useEffect, useState } from 'react'
import { CheckSquare, Calendar, TrendingUp, Clock, Sparkles } from 'lucide-react'
import { tasksApi, eventsApi } from '../services/api'

interface Stats {
  tasksTotal: number
  tasksCompleted: number
  tasksPending: number
  eventsTotal: number
}

interface User {
  id: string
  email: string
  full_name: string | null
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    tasksTotal: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    eventsTotal: 0,
  })
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    const fetchStats = async () => {
      try {
        const tasks = await tasksApi.getAll()
        const events = await eventsApi.getAll()
        
        const completed = tasks.filter((t: { completed: boolean }) => t.completed).length
        
        setStats({
          tasksTotal: tasks.length,
          tasksCompleted: completed,
          tasksPending: tasks.length - completed,
          eventsTotal: events.length,
        })
      } catch (err) {
        console.log('Stats fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Tarefas Totais',
      value: stats.tasksTotal,
      icon: CheckSquare,
      color: 'bg-blue-500',
    },
    {
      label: 'Concluídas',
      value: stats.tasksCompleted,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Pendentes',
      value: stats.tasksPending,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      label: 'Eventos',
      value: stats.eventsTotal,
      icon: Calendar,
      color: 'bg-purple-500',
    },
  ]

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting()}{user?.full_name ? `, ${user.full_name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Aqui está o resumo do seu dia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-lg font-semibold">
            Dica do dia
          </h2>
        </div>
        <p className="mt-2 text-primary-100">
          Comece pelo mais importante! Organize suas tarefas do dia agora.
        </p>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Próximos passos
        </h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            Adicione suas tarefas do dia
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            Marque as tarefas concluídas
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            Planeje seus eventos
          </li>
        </ul>
      </div>
    </div>
  )
}