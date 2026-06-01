import { useState } from 'react'
import { NOMES_AMIGOS, SENHA_ADMIN, SENHAS_DEFAULT } from '../data/torneio.js'
import { supabase } from '../lib/supabase.js'

export default function Login({ onLogin }) {
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const entrar = async () => {
    if (!nome) { setErro('Escolhe o teu nome primeiro!'); return }
    setLoading(true)
    setErro('')

    try {
      // Busca a senha no Supabase (ou usa a default se ainda não foi alterada)
      const { data } = await supabase
        .from('jogadores')
        .select('senha')
        .eq('nome', nome)
        .single()

      const senhaCorreta = data?.senha || SENHAS_DEFAULT[nome]

      if (senha === SENHA_ADMIN) {
        onLogin(nome, true)
      } else if (senha === senhaCorreta) {
        onLogin(nome, false)
      } else {
        setErro('PIN incorreto. Tenta novamente.')
      }
    } catch {
      // Fallback para senhas default se o Supabase não estiver configurado
      if (senha === SENHA_ADMIN) {
        onLogin(nome, true)
      } else if (senha === SENHAS_DEFAULT[nome]) {
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

        <input
          type="password"
          placeholder="Palavra-passe"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && entrar()}
        />

        {erro && <div className="alert alert-error">{erro}</div>}

        <button className="btn btn-primary" onClick={entrar} disabled={loading}>
          {loading ? 'A entrar...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
