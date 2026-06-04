import { useState } from 'react'
import { NOMES_AMIGOS, SENHA_ADMIN, SENHAS_DEFAULT } from '../data/torneio.js'
import { supabase } from '../lib/supabase.js'

export default function Login({ onLogin }) {
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const entrar = async () => {
    if (!nome) { setErro('Escolhe o teu nome primeiro!'); return }
    setLoading(true)
    setErro('')

    // Admin entra com qualquer nome
    if (senha === SENHA_ADMIN) {
      onLogin(nome, true)
      setLoading(false)
      return
    }

    try {
      const { data } = await supabase
        .from('jogadores')
        .select('senha')
        .eq('nome', nome)
        .single()

      // Supabase tem prioridade; fallback para SENHAS_DEFAULT
      const senhaCorreta = (data?.senha && data.senha.trim()) ? data.senha.trim() : SENHAS_DEFAULT[nome]

      if (senha === senhaCorreta) {
        onLogin(nome, false)
      } else {
        setErro('PIN incorreto. Tenta novamente.')
      }
    } catch {
      // Sem Supabase, usa senhas do código
      if (senha === SENHAS_DEFAULT[nome]) {
        onLogin(nome, false)
      } else {
        setErro('PIN incorreto. Tenta novamente.')
      }
    }

    setLoading(false)
  }

  return (
    <div>
      <div className="logo-container" style={{ marginTop: 32 }}>
        <div className="logo-sub">Mundial GSNAL <span style={{ color: 'var(--gold)' }}>26</span></div>
        <div className="logo-title">⚽ GSNAL 26</div>
        <img
          src="/logo.png"
          alt="Logo Mundial GSNAL"
          style={{ width: '60%', maxWidth: 200, margin: '12px auto 0', display: 'block', borderRadius: 8 }}
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <select value={nome} onChange={e => setNome(e.target.value)}>
          <option value="">Quem és tu?</option>
          {NOMES_AMIGOS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <div style={{ position: 'relative' }}>
          <input
            type={mostrarSenha ? 'text' : 'password'}
            placeholder="Palavra-passe"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            style={{
              position: 'absolute', right: 0, top: 0, height: '100%',
              width: 42, background: 'transparent', border: 'none',
              cursor: 'pointer', color: '#666', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            aria-label={mostrarSenha ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
          >
            {mostrarSenha ? '🙈' : '👁️'}
          </button>
        </div>

        {erro && <div className="alert alert-error">{erro}</div>}

        <button className="btn btn-primary" onClick={entrar} disabled={loading}>
          {loading ? 'A entrar...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
