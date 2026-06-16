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

  const gruposDaPagina = PAGINAS[paginaIdx]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>🗂️ Vencedores dos grupos</h2>

      <div className="nav-row">
        <button className="btn btn-icon" onClick={() => setPaginaIdx(Math.max(0, paginaIdx - 1))}>◀</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3.5vw,17px)', letterSpacing: 1, color: '#eee' }}>
          {gruposDaPagina.join(' · ')}
        </div>
        <button className="btn btn-icon" onClick={() => setPaginaIdx(Math.min(PAGINAS.length - 1, paginaIdx + 1))}>▶</button>
      </div>

      {gruposDaPagina.map(grupo => {
        const resGrupo = resultados[grupo]

        return (
          <div key={grupo} className="palpite-card" style={{ marginBottom: 16 }}>
            <p style={{ textAlign: 'center', fontSize: 13, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Oswald,sans-serif' }}>
              {grupo}
            </p>

            {/* Resultado real */}
            <div style={{ textAlign: 'center', marginBottom: 10, padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
              {resGrupo?.primeiro ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <span style={{ fontSize: 14, color: '#00C853' }}>🥇 {resGrupo.primeiro}</span>
                  <span style={{ fontSize: 14, color: '#C0C0C0' }}>🥈 {resGrupo.segundo || '—'}</span>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: '#333', fontFamily: 'Barlow Condensed,sans-serif' }}>⏳ Resultado ainda não disponível</span>
              )}
            </div>

            {/* Palpites de cada jogador */}
            {NOMES_AMIGOS.map(amigo => {
              const p = palpites[amigo]?.[grupo]
              const podeVer = gruposEncerrados || amigo === jogador || isAdmin

              if (!p || (!p.primeiro && !p.segundo)) {
                return (
                  <p key={amigo} style={{ margin: 0, padding: '4px 0', borderTop: '1px solid #1a1a1a', fontSize: 12, color: '#3a3a3a', textAlign: 'center' }}>
                    {amigo} — sem aposta
                  </p>
                )
              }

              const p1 = podeVer ? (p.primeiro || '—') : '🔒'
              const p2 = podeVer ? (p.segundo || '—') : '🔒'
              const destaque = amigo === jogador ? 'var(--gold)' : '#ccc'
              const acertou1  = resGrupo && p.primeiro === resGrupo.primeiro
              const acertou1b = resGrupo && p.primeiro === resGrupo.segundo
              const acertou2  = resGrupo && p.segundo  === resGrupo.segundo
              const acertou2b = resGrupo && p.segundo  === resGrupo.primeiro
              const pts = (acertou1 ? 3 : acertou1b ? 1 : 0) + (acertou2 ? 3 : acertou2b ? 1 : 0)

              return (
                <div key={amigo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 'clamp(12px,3vw,14px)', color: destaque, fontFamily: 'Barlow Condensed,sans-serif', flexShrink: 0, minWidth: 52 }}>
                    {amigo}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
                    <span style={{ fontSize: 'clamp(11px,2.5vw,13px)', color: podeVer ? (acertou1 ? '#00C853' : acertou1b ? 'var(--gold)' : '#888') : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '38%' }}>
                      🥇 {p1}
                    </span>
                    <span style={{ fontSize: 'clamp(11px,2.5vw,13px)', color: podeVer ? (acertou2 ? '#00C853' : acertou2b ? 'var(--gold)' : '#888') : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '38%' }}>
                      🥈 {p2}
                    </span>
                    {podeVer && resGrupo?.primeiro && (
                      <span style={{ fontFamily: 'VT323,monospace', fontSize: 18, color: pts > 0 ? '#00C853' : '#FF3D00', flexShrink: 0 }}>
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
