# ⚽ Mundial GSNAL 2026

App de palpites de futebol — React + Supabase + Vercel.

---

## 🚀 Como pôr online em 4 passos

### Passo 1 — Criar a base de dados no Supabase (5 min)

1. Vai a [supabase.com](https://supabase.com) e cria uma conta gratuita
2. Clica em **New Project** → dá um nome (ex: `mundial-gsnal`) → cria
3. Vai ao menu **SQL Editor** → clica em **New Query**
4. Copia o conteúdo do ficheiro `supabase_setup.sql` e clica em **Run**
5. Vai a **Settings → API** e copia:
   - **Project URL** (ex: `https://xyzabc.supabase.co`)
   - **anon public key** (chave longa)

### Passo 2 — Ligar o Supabase ao código (2 min)

Abre o ficheiro `src/lib/supabase.js` e substitui:

```js
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'   // ← a tua URL
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI'             // ← a tua key
```

### Passo 3 — Pôr o código no GitHub (3 min)

1. Cria uma conta no [github.com](https://github.com) se não tens
2. Clica em **New Repository** → nome `mundial-gsnal` → **Create**
3. Na pasta do projeto, abre um terminal e corre:

```bash
npm install
git init
git add .
git commit -m "Mundial GSNAL 2026"
git branch -M main
git remote add origin https://github.com/SEU_UTILIZADOR/mundial-gsnal.git
git push -u origin main
```

### Passo 4 — Deploy no Vercel (2 min)

1. Vai a [vercel.com](https://vercel.com) e cria conta (podes entrar com GitHub)
2. Clica em **Add New → Project**
3. Importa o repositório `mundial-gsnal`
4. Clica em **Deploy** — é tudo automático!
5. Recebes um URL tipo `mundial-gsnal.vercel.app` — partilha com os amigos! 🎉

---

## 💻 Correr localmente (para testar)

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` no browser.

---

## 📁 Estrutura do projeto

```
src/
  data/
    torneio.js        ← Todos os dados: equipas, jogos, calendário, prazos
  lib/
    supabase.js       ← Ligação à base de dados (mete aqui as tuas chaves)
  pages/
    Login.jsx         ← Ecrã de login
    Classificacao.jsx ← Tabela de classificação
    Apostas.jsx       ← Apostas por jogo e vencedores dos grupos
    PalpitesDeTodos.jsx ← Ver os palpites de todos
    Admin.jsx         ← Painel admin: resultados e palavras-passe
  components/
    Toast.jsx         ← Notificações
  App.jsx             ← App principal com navegação
  index.css           ← Estilos globais (tema escuro)
```

---

## ⚙️ Sistema de pontuação

| Evento | Pontos |
|--------|--------|
| Resultado exato de um jogo | 3 pts |
| Vencedor/empate correto | 1 pt |
| 1.º lugar do grupo correto | 3 pts |
| 2.º lugar do grupo correto | 3 pts |
| 1.º ou 2.º trocados | 1 pt |
| Campeão do mundo correto | 10 pts |
| Melhor marcador correto | 6 pts |

---

## 🔐 Senhas default

| Jogador | Senha |
|---------|-------|
| André | 1111 |
| Filipe | 2222 |
| Paulo | 3333 |
| Tiago | 4444 |
| Hugo | 5555 |
| Raul | 6666 |
| Tó | 7777 |
| Ricardo | 8888 |
| Admin (qualquer) | gsnal2026 |
