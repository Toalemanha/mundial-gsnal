import { useState } from 'react'
import Login from './pages/Login.jsx'
import Classificacao from './pages/Classificacao.jsx'
import Apostas from './pages/Apostas.jsx'
import PalpitesDeTodos from './pages/PalpitesDeTodos.jsx'
import PalpitesGrupos from './pages/PalpitesGrupos.jsx'
import Admin from './pages/Admin.jsx'
import Regras from './pages/Regras.jsx'

const NAV_ITEMS = [
  { id: 'classificacao', icon: '🏆', label: 'Tabela' },
  { id: 'apostas',       icon: '🎯', label: 'Apostar' },
  { id: 'todos',         icon: '👥', label: 'Jogos' },
  { id: 'grupos',        icon: '🗂️', label: 'Grupos' },
  { id: 'regras',        icon: '📋', label: 'Regras' },
]

export default function App() {
  const [autenticado, setAutenticado] = useState(() => !!localStorage.getItem('gsnal_jogador'))
  const [jogador, setJogador] = useState(() => localStorage.getItem('gsnal_jogador') || '')
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('gsnal_admin') === 'true')
  const [pagina, setPagina] = useState('classificacao')
  const [menuAberto, setMenuAberto] = useState(false)

  function onLogin(nome, admin) {
    setJogador(nome)
    setIsAdmin(admin)
    setAutenticado(true)
    setPagina('classificacao')
    localStorage.setItem('gsnal_jogador', nome)
    localStorage.setItem('gsnal_admin', admin ? 'true' : 'false')
  }

  function sair() {
    setAutenticado(false)
    setJogador('')
    setIsAdmin(false)
    setPagina('classificacao')
    setMenuAberto(false)
    localStorage.removeItem('gsnal_jogador')
    localStorage.removeItem('gsnal_admin')
  }

  if (!autenticado) return <Login onLogin={onLogin} />

  return (
    <div style={{ paddingBottom: 72 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(24px,7vw,36px)', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1, padding: 0 }}
          onClick={() => setPagina('classificacao')}
        >
          MUNDIAL GSNAL 26
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#666', fontFamily: 'Barlow Condensed,sans-serif' }}>
            <strong style={{ color: '#eee' }}>{jogador}</strong>
            {isAdmin && <span style={{ color: 'var(--gold)' }}> ★</span>}
          </div>
          {isAdmin ? (
            <button
              className="btn btn-icon"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label="Menu"
              style={{ flexShrink: 0 }}
            >
              {menuAberto ? '✕' : '☰'}
            </button>
          ) : (
            <button
              className="btn btn-icon"
              onClick={sair}
              aria-label="Sair"
              style={{ flexShrink: 0, fontSize: 16 }}
            >
              ↩
            </button>
          )}
        </div>
      </div>

      {/* ── Menu dropdown (só admin) ── */}
      {isAdmin && menuAberto && (
        <div className="card" style={{ marginBottom: 12 }}>
          <button className="btn" style={{ marginBottom: 6, textAlign: 'left', paddingLeft: 14 }}
            onClick={() => { setPagina('admin'); setMenuAberto(false) }}>
            ⚙️  Admin
          </button>
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
      {pagina === 'grupos'        && <PalpitesGrupos jogador={jogador} isAdmin={isAdmin} />}
      {pagina === 'admin'         && isAdmin && <Admin />}
      {pagina === 'regras'        && <Regras />}

      {/* ── Barra de navegação inferior ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0a0a0a', borderTop: '1px solid #1e1e1e',
        display: 'flex', zIndex: 50,
        maxWidth: 480, margin: '0 auto',
      }}>
        {NAV_ITEMS.map(item => {
          const ativo = pagina === item.id
          return (
            <button
              key={item.id}
              onClick={() => { setPagina(item.id); setMenuAberto(false) }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '10px 0 12px', background: 'none',
                border: 'none', cursor: 'pointer', gap: 3,
                borderTop: ativo ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{
                fontSize: 10, fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 0.5,
                color: ativo ? 'var(--gold)' : '#555', textTransform: 'uppercase',
                transition: 'color 0.15s',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '10px 0 12px', background: 'none',
            border: 'none', cursor: 'pointer', gap: 3,
            borderTop: menuAberto ? '2px solid var(--gold)' : '2px solid transparent',
            transition: 'border-color 0.15s',
          }}
        >
          <span style={{ fontSize: 20 }}>{menuAberto ? '✕' : '☰'}</span>
          <span style={{
            fontSize: 10, fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 0.5,
            color: menuAberto ? 'var(--gold)' : '#555', textTransform: 'uppercase',
          }}>
            Mais
          </span>
        </button>
      </nav>
    </div>
  )
}
