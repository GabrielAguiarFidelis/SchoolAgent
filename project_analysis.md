# Relatório de Análise do Projeto: SchoolAgent (Productivity Agent)

## 📌 Visão Geral
O projeto **SchoolAgent** é um agente de produtividade pessoal focado em estudantes. Seu objetivo principal é resolver a dificuldade na organização pessoal, gerenciamento de tarefas, hábitos e compromissos. O diferencial do produto é a combinação de uma interface de organização tradicional (como um todo-list e calendário) com um **chatbot inteligente (IA)** que auxilia o usuário de forma conversacional.

## 🛠️ Stack Tecnológica (Arquitetura)
A aplicação está dividida em duas partes principais (Frontend e Backend), utilizando as seguintes tecnologias:

### Frontend
- **Framework:** React com Vite (TypeScript/JavaScript).
- **Estilização:** TailwindCSS, `clsx`, `tailwind-merge`.
- **Roteamento:** React Router (`react-router-dom`).
- **Ícones e Gráficos:** `lucide-react` (ícones), `recharts` (gráficos para as estatísticas).
- **Manipulação de Datas:** `date-fns`.

### Backend
- **Framework:** Express.js (Node.js). Notei que a especificação inicial (`SPEC.md`) mencionava FastAPI (Python), mas a implementação real no diretório `/backend` (e as dependências em `package.json`) foi feita em Node.js com Express.
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL + Supabase Auth).
- **IA/LLM:** Integração com a API da OpenAI.
- **Segurança e Outros:** `bcryptjs` (para hash de senhas), `cors`, `dotenv`.

## 📁 Estrutura do Repositório
O repositório está bem documentado e organizado:
- `README.md`: Contém as instruções de setup e informações resumidas do projeto.
- `ROADMAP.md`: Um plano de desenvolvimento detalhado, dividido em 9 fases (desde a fundação até as iterações pós-lançamento).
- `SPEC.md`: A especificação técnica e de negócios do produto.
- `frontend/`: Diretório contendo a aplicação React.
- `backend/`: Diretório contendo a API em Node.js.

## 🎯 Funcionalidades e Escopo (MVP)
O escopo principal do Minimum Viable Product (MVP) foca em:
1. **Tarefas:** CRUD completo, prioridades, datas limite e categorização por tags.
2. **Calendário:** Visualização de eventos integrados com tarefas.
3. **Chatbot com IA:** Respostas contextuais, sugestões de tarefas e resumo do dia.
4. **Dashboard:** Gráficos e estatísticas de produtividade.
5. **Autenticação:** Sistema de Login/Registro.

## 💼 Modelo de Negócios e Visão Futura
- **Monetização (Freemium):** O projeto foi pensado para ter uma versão gratuita com limitações (ex: número de tarefas/mensagens com IA por mês) e uma versão premium ilimitada.
- **Expansão:** O roadmap prevê integrações futuras com ferramentas como Google Calendar, Notion, Trello, e a possibilidade de criar uma versão mobile nativa.

## ⚠️ Observações e Pontos de Atenção
> [!NOTE]
> Há algumas discrepâncias entre a documentação original e a implementação atual. O `SPEC.md` cita o backend em **FastAPI (Python)**, mas a pasta `backend/` contém um projeto Node.js/Express. O `frontend/package.json` também tem `express` e `bcryptjs` nas dependências, o que pode indicar que em algum momento houve uma tentativa de misturar backend/frontend ou usar Server-Side Rendering de forma customizada, ou foi um erro na instalação das dependências do frontend.

> [!TIP]
> Seria interessante fazer uma limpeza nas dependências do `frontend/package.json` (removendo `express`, `cors` e `bcryptjs` se for um projeto React puro com Vite) para evitar pacotes desnecessários no build do cliente.

## Conclusão
O projeto possui uma base muito sólida, uma documentação bem elaborada (visão de produto, roadmap e especificações) e uma stack moderna e escalável. Ele está preparado para ser desenvolvido seguindo as fases estipuladas no `ROADMAP.md`.
