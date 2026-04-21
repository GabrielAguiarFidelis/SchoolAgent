# Productivity Agent

Sistema de produtividade com tarefas, eventos e chat com IA.

## Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Express.js (serverless)
- Database: Supabase
- AI: OpenAI (fallback para respostas simples)

## Setup Local

```bash
# Frontend
cd frontend
npm install

# Backend (opcional - local)
cd backend
npm install
```

## Variáveis de Ambiente

```env
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-key
OPENAI_API_KEY=your-key
```

## Deploy

1. Fork/clonar no GitHub
2. Conectar ao Vercel
3. Adicionar Environment Variables no Vercel

## Funcionalidades
- ✅ Registro/Login
- ✅ CRUD de Tarefas
- ✅ CRUD de Eventos
- ✅ Chat com IA
- ✅ Dashboard com estatísticas
- ✅ Design responsivo (mobile)
- ⏳ Notificações diarias