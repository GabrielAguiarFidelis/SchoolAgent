import { useState, useEffect } from 'react'
import { User, Moon, Sun, Bell, Shield, Trash2, Save } from 'lucide-react'
import type { LoginResponse } from '../services/api'

interface SettingsProps {
  user: LoginResponse['user']
  onUserUpdate: (user: LoginResponse['user']) => void
}

export default function Settings({ user, onUserUpdate }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [fullName, setFullName] = useState(user.full_name || '')

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    const prefs = user.preferences as Record<string, unknown>
    if (prefs?.darkMode !== undefined) {
      setDarkMode(prefs.darkMode as boolean)
    }
    if (prefs?.notifications !== undefined) {
      setNotifications(prefs.notifications as boolean)
    }
  }, [user])

  const handleSaveName = async () => {
    setSaving(true)
    
    const newPreferences = { ...user.preferences, fullName: fullName }
    const updatedUser = { ...user, full_name: fullName, preferences: newPreferences }
    
    onUserUpdate(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    setSaving(false)
    setEditingName(false)
  }

  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    
    if (newValue) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }

    const newPreferences = { ...user.preferences, darkMode: newValue }
    const updatedUser = { ...user, preferences: newPreferences }
    onUserUpdate(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const toggleNotifications = () => {
    const newValue = !notifications
    setNotifications(newValue)

    const newPreferences = { ...user.preferences, notifications: newValue }
    const updatedUser = { ...user, preferences: newPreferences }
    onUserUpdate(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Configurações
      </h1>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Perfil
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Nome</label>
              {editingName ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Seu nome"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-900 dark:text-white flex-1">
                    {user.full_name || 'Não definido'}
                  </p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">E-mail</label>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Membro desde</label>
              <p className="text-gray-900 dark:text-white">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-gray-500" />
              ) : (
                <Sun className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tema Escuro
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ative para usar o tema escuro
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notificações
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receba lembretes e alertas
                </p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Privacidade
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Seus dados são criptografados e armazenados com segurança.
          </p>
          <button className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" />
            Excluir minha conta
          </button>
        </div>
      </div>
    </div>
  )
}