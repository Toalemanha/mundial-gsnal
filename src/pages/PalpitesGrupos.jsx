import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { NOMES_AMIGOS, EQUIPAS_POR_GRUPO } from '../data/torneio.js'

const GRUPOS = Object.keys(EQUIPAS_POR_GRUPO)
const PAGINAS = []
for (let i = 0; i < GRUPOS.length; i += 2) {
  PAGINAS.push(GRUPOS.slice(i, i + 2))
}

export default function PalpitesGrupos({ jogador, isAdmin }) {
  const [paginaIdx, setPaginaIdx] = useState(0)
  const [palpites, setPalpites] = useState({})
  const [resultados, setResultados] = useState({})
  const [loading, setLoading] = useState(true)
  const agora = new Date()
  const LIMITE_GRUPOS = new Date("2026-06-18T12:00:00+01:00")
  const gruposEncerrados = agora >= LIMITE_GRUPOS

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      const [{ data: palp }, { data: res }] = await Promise.all([
        supabase.from('palpites_grupos').select('jogador, grupo, primeiro, segundo'),
        supabase.from('resultados_grupos').select('grupo, primeiro, segundo'),
      ])
      const mp = {}
      if (palp) palp.forEach(r => {
        if (!mp[r.jogador]) mp[r.jogador] = {}
        mp[r.jogador][r.grupo] = { primeiro: r.primeiro, segundo: r.segundo }
      })
      setPalpites(mp)
      const mr = {}
      if (res) res.forEach(r => { mr[r.grupo] = { primeiro: r.primeiro, segundo: r.segundo } })
      setResultados(mr)
    } catch {}
    setLoading(false)
  }

  if (loading) return <div className="spinner">A carregar...</div>

  const gruposDaPagina = PAGINAS[paginaIdx] || []

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>🗂️ Vencedores dos grupos</h2>

      {/* Grelha de 6 botões dispostos em duas filas de 3 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '24px'
      }}>
        {PAGINAS.map((par, idx) => {
          const label = par.map(g => g.replace('Grupo ', '')).join(' / ')
          const ativo = paginaIdx === idx
          return (
            <button
              key={idx}
              type="button"
              className={`btn ${ativo ? 'active' : ''}`}
              style={{
                padding: '12px 4px',
                fontSize: '13px',
                fontFamily: 'Oswald, sans-serif',
                textTransform: 'uppercase',
                border: ativo ? '1px solid var(--gold)' : '1px solid #2a2a2a',
                color: ativo ? 'var(--gold)' : '#aaa',
                background: ativo ? '#161616' : '#0d0d0d',
                fontWeight: ativo ? 'bold' : 'normal'
              }}
              onClick={() => setPaginaIdx(idx)}
            >
              Gr. {label}
            </button>
          )
        })}
      </div>

      {gruposDaPagina.map(grupo => {
        const resGrupo = resultados[grupo]

        return (
          <div key={grupo} className="palpite-card" style={{ marginBottom: 24, padding: '16px' }}>
            {/* Título do Grupo (Aumentado) */}
            <p style={{ textAlign: 'center', fontSize: 16, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Oswald,sans-serif', fontWeight: 'bold' }}>
              {grupo}
            </p>

            {/* Resultado real (Aumentado) */}
            <div style={{ textAlign: 'center', marginBottom: 14, padding: '10px 0', borderBottom: '1px solid #222', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              {resGrupo?.primeiro ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                  <span style={{ fontSize: 18, color: '#00C853', fontWeight: 'bold', letterSpacing: 0.5 }}>🥇 {resGrupo.primeiro}</span>
                  <span style={{ fontSize: 18, color: '#C0C0C0', fontWeight: 'bold', letterSpacing: 0.5 }}>🥈 {resGrupo.segundo || '—'}</span>
                </div>
              ) : (
                <span style={{ fontSize: 14, color: '#555', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 0.5 }}>⏳ Resultado ainda não disponível</span>
              )}
            </div>

            {/* Palpites de cada jogador ("Tabela" XL) */}
            {NOMES_AMIGOS.map(amigo => {
              const p = palpites[amigo]?.[grupo]
              const podeVer = gruposEncerrados || amigo === jogador || isAdmin

              if (!p || (!p.primeiro && !p.segundo)) {
                return (
                  <p key={amigo} style={{ margin: 0, padding: '10px 0', borderTop: '1px solid #1a1a1a', fontSize: 15, color: '#444', textAlign: 'center', fontFamily: 'Barlow Condensed,sans-serif' }}>
                    <strong>{amigo}</strong> — sem aposta
                  </p>
                )
              }

              const p1 = podeVer ? (p.primeiro || '—') : '🔒'
              const p2 = podeVer ? (p.segundo || '—') : '🔒'
              const destaque = amigo === jogador ? 'var(--gold)' : '#fff'
              const acertou1  = resGrupo && p.primeiro === resGrupo.primeiro
              const acertou1b = resGrupo && p.primeiro === resGrupo.segundo
              const acertou2  = resGrupo && p.segundo  === resGrupo.segundo
              const acertou2b = resGrupo && p.segundo  === resGrupo.primeiro
              const pts = (acertou1 ? 3 : acertou1b ? 1 : 0) + (acertou2 ? 3 : acertou2b ? 1 : 0)

              return (
                <div key={amigo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #1a1a1a' }}>
                  {/* Nome do Amigo (XL + Bold) */}
                  <span style={{ fontSize: 'clamp(16px,4vw,20px)', color: destaque, fontFamily: 'Barlow Condensed,sans-serif', flexShrink: 0, minWidth: 75, fontWeight: 'bold' }}>
                    {amigo}
                  </span>
                  
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
                    {/* Primeiro Lugar (XL) */}
                    <span style={{ fontSize: 'clamp(15px,3.5vw,18.5px)', color: podeVer ? (acertou1 ? '#00C853' : acertou1b ? 'var(--gold)' : '#bbb') : '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%', fontWeight: 500 }}>
                      🥇 {p1}
                    </span>
                    
                    {/* Segundo Lugar (XL) */}
                    <span style={{ fontSize: 'clamp(15px,3.5vw,18.5px)', color: podeVer ? (acertou2 ? '#00C853' : acertou2b ? 'var(--gold)' : '#bbb') : '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%', fontWeight: 500 }}>
                      🥈 {p2}
                    </span>
                    
                    {/* Pontuação (XL) */}
                    {podeVer && resGrupo?.primeiro && (
                      <span style={{ fontFamily: 'VT323,monospace', fontSize: 26, color: pts > 0 ? '#00C853' : '#FF3D00', flexShrink: 0, minWidth: 28, textAlign: 'right', fontWeight: 'bold' }}>
                        {pts > 0 ? `+${pts}` : '✗'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
