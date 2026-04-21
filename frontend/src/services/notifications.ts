// Serviço de Notificações Push

const VAPID_PUBLIC_KEY = 'sua_chave_vapid_publica'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações')
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

export async function subscribeToPush() {
  const permission = await requestNotificationPermission()
  if (!permission) return null
  
  const registration = await navigator.serviceWorker.ready
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  })
  
  return subscription
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

export async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscription)
  })
  
  if (!response.ok) {
    throw new Error('Erro ao salvar subscription')
  }
}

export async function enableNotifications(): Promise<boolean> {
  try {
    const subscription = await subscribeToPush()
    if (!subscription) return false
    
    await savePushSubscription(subscription)
    
    // Salvar preferência no banco
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: { ...user.preferences, notifications: true }
        })
      })
      
      if (response.ok) {
        const updated = await response.json()
        localStorage.setItem('user', JSON.stringify(updated))
      }
    }
    
    return true
  } catch (err) {
    console.error('Erro ao ativar notificações:', err)
    return false
  }
}

export async function disableNotifications(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  
  if (subscription) {
    await subscription.unsubscribe()
  }
  
  // Remover preferência no banco
  const userData = localStorage.getItem('user')
  if (userData) {
    const user = JSON.parse(userData)
    await fetch(`/api/auth/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        preferences: { ...user.preferences, notifications: false }
      })
    })
  }
}