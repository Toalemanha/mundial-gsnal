import { useState } from 'react'
import Login from './pages/Login.jsx'
import Classificacao from './pages/Classificacao.jsx'
import Apostas from './pages/Apostas.jsx'
import PalpitesDeTodos from './pages/PalpitesDeTodos.jsx'
import Admin from './pages/Admin.jsx'
import { indiceDiaHoje } from './data/torneio.js'

export default function App() {
  const [autenticado, setAutenticado] = useState(false)
  const [jogador, setJogador] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [pagina, setPagina] = useState('classificacao')
  const [menuAberto, setMenuAberto] = useState(false)

  function onLogin(nome, admin) {
    setJogador(nome)
    setIsAdmin(admin)
    setAutenticado(true)
    setPagina('classificacao')
  }

  function sair() {
    setAutenticado(false)
    setJogador('')
    setIsAdmin(false)
    setPagina('classificacao')
    setMenuAberto(false)
  }

  function irParaApostas() {
    setPagina('apostas')
    setMenuAberto(false)
  }

  if (!autenticado) return <Login onLogin={onLogin} />

  return (
    <div>
      {/* ── Header ── */}
      <button
        className="btn"
        style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(28px,8vw,40px)', color: 'var(--gold)', background: '#000', border: '1px solid #2a2a2a', height: 'auto', padding: '6px 0', marginBottom: 8, letterSpacing: 1 }}
        onClick={() => { setPagina('classificacao'); setMenuAberto(false) }}
      >
        MUNDIAL GSNAL 26
      </button>

      {/* ── Barra de ação ── */}
      <div className="nav-row" style={{ marginBottom: 8 }}>
        <div style={{ flex: 1, fontSize: 'clamp(11px,2.5vw,13px)', color: '#888' }}>
          👤 <strong style={{ color: '#eee' }}>{jogador}</strong>
          {isAdmin && <span style={{ color: 'var(--gold)' }}> ★</span>}
        </div>
        <button className="btn" style={{ width: 'auto', padding: '0 14px', flex: 'none' }} onClick={irParaApostas}>
          ⚽ Apostar hoje
        </button>
        <button
          className="btn btn-icon"
          onClick={() => setMenuAberto(!menuAberto)}
          aria-label="Menu"
        >
          {menuAberto ? '✕' : '☰'}
        </button>
      </div>

      {/* ── Menu dropdown ── */}
      {menuAberto && (
        <div className="card" style={{ marginBottom: 12 }}>
          {[
            { icon: '🏆', label: 'Classificação', id: 'classificacao' },
            { icon: '🎯', label: 'As minhas apostas', id: 'apostas' },
            { icon: '👥', label: 'Palpites de todos', id: 'todos' },
            ...(isAdmin ? [{ icon: '⚙️', label: 'Admin', id: 'admin' }] : []),
          ].map(item => (
            <button
              key={item.id}
              className="btn"
              style={{ marginBottom: 6, textAlign: 'left', paddingLeft: 14 }}
              onClick={() => { setPagina(item.id); setMenuAberto(false) }}
            >
              {item.icon}  {item.label}
            </button>
          ))}
          <hr />
          <button className="btn" style={{ textAlign: 'left', paddingLeft: 14 }} onClick={sair}>
            ↩  Sair
          </button>
        </div>
      )}

      {/* ── Páginas ── */}
      {pagina === 'classificacao' && <Classificacao />}
      {pagina === 'apostas'       && <Apostas jogador={jogador} isAdmin={isAdmin} />}
      {pagina === 'todos'         && <PalpitesDeTodos jogador={jogador} isAdmin={isAdmin} />}
      {pagina === 'admin'         && isAdmin && <Admin />}
    </div>
  )
}
