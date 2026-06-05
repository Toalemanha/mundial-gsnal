import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { FASES_ELIMINACAO, JOGOS_ELIMINACAO, LABEL_FASE, PRAZOS_ELIMINACAO, NOMES_AMIGOS } from '../data/torneio.js'

export default function PalpitesDeTodosEliminacao({ jogador, isAdmin }) {
  const [fase, setFase] = useState('quartos')
  const [palpites, setPalpites] = useState({})    // { id_jogo: { nome: {casa,fora} } }
  const [equipas, setEquipas] = useState({})
  const [resultados, setResultados] = useState({})
  const [loading, setLoading] = useState(true)
  const agora = new Date()

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      const [{ data: palp }, { data: eq }, { data: res }] = await Promise.all([
        supabase.from('palpites_eliminacao').select('jogador, id_jogo, casa, fora'),
        supabase.from('equipas_eliminacao').select('id_jogo, casa, fora'),
        supabase.from('resultados_eliminacao').select('id_jogo, casa, fora'),
      ])

      const mp = {}
      if (palp) palp.forEach(r => {
        if (!mp[r.id_jogo]) mp[r.id_jogo] = {}
        mp[r.id_jogo][r.jogador] = { casa: r.casa, fora: r.fora }
      })
      setPalpites(mp)

      const eq2 = {}
      if (eq) eq.forEach(e => { eq2[e.id_jogo] = { casa: e.casa, fora: e.fora } })
      setEquipas(eq2)

      const res2 = {}
      if (res) res.forEach(r => { res2[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(res2)
    } catch {}
    setLoading(false)
  }

  function pontosAposta(idJogo, p) {
    const r = resultados[idJogo]
    if (!r || r.casa === null || r.fora === null) return null
    if (p.casa === r.casa && p.fora === r.fora) return 3
    if ((p.casa > p.fora && r.casa > r.fora) || (p.casa < p.fora && r.casa < r.fora) || (p.casa === p.fora && r.casa === r.fora)) return 1
    return 0
  }

  if (loading) return <div className="spinner">A carregar...</div>

  const prazo = PRAZOS_ELIMINACAO[fase]
  const encerrado = agora >= prazo

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>👥 Eliminatórias — todos</h2>

      <div className="submenu" style={{ flexWrap: 'wrap' }}>
        {FASES_ELIMINACAO.map(f => (
          <button key={f} className={`submenu-btn ${fase === f ? 'active' : ''}`} onClick={() => setFase(f)}>
            {f === 'quartos' ? 'Quartos' : f === 'meias' ? 'Meias' : f === 'terceiro' ? '3.º' : 'Final'}
          </button>
        ))}
      </div>

      <h4 style={{ color: 'var(--gold)', textAlign: 'center', margin: '12px 0', fontFamily: 'Oswald,sans-serif', letterSpacing: 1 }}>
        {LABEL_FASE[fase]}
      </h4>

      {JOGOS_ELIMINACAO[fase].map(j => {
        const nomeCasa = equipas[j.id]?.casa
        const nomeFora = equipas[j.id]?.fora
        const resReal = resultados[j.id]

        return (
          <div key={j.id} className="palpite-card">
            <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: 2, color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>
              {j.label}
            </p>

            {resReal && resReal.casa !== null && (
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'VT323,monospace', fontSize: 28, color: 'var(--green)', letterSpacing: 3 }}>
                  {resReal.casa} — {resReal.fora}
                </span>
                <span style={{ fontSize: 10, color: '#555', display: 'block', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1 }}>RESULTADO REAL</span>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: 'clamp(14px,3.5vw,17px)', marginBottom: 10, color: '#eee' }}>
              {nomeCasa || '?'} <span style={{ color: '#333', padding: '0 6px' }}>VS</span> {nomeFora || '?'}
            </p>

            {NOMES_AMIGOS.map(amigo => {
              const p = palpites[j.id]?.[amigo]
              const podeVer = encerrado || amigo === jogador || isAdmin

              if (!p) return (
                <p key={amigo} style={{ margin: 0, padding: '4px 0', borderTop: '1px solid #1a1a1a', fontSize: 12, color: '#3a3a3a', textAlign: 'center' }}>
                  {amigo} — sem aposta
                </p>
              )

              const vc = podeVer ? p.casa : '🔒'
              const vf = podeVer ? p.fora : '🔒'
              const destaque = amigo === jogador ? 'var(--gold)' : '#ccc'
              const pts = podeVer ? pontosAposta(j.id, p) : null
              const corPts = pts === 3 ? '#00C853' : pts === 1 ? 'var(--gold)' : pts === 0 ? '#FF3D00' : null

              return (
                <div key={amigo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 'clamp(12px,3vw,14px)', color: destaque, fontFamily: 'Barlow Condensed,sans-serif' }}>{amigo}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(18px,4vw,22px)', color: '#eee', letterSpacing: 2 }}>{vc} - {vf}</span>
                    {pts !== null && (
                      <span style={{ fontFamily: 'VT323,monospace', fontSize: 18, color: corPts, minWidth: 32, textAlign: 'right' }}>
                        {pts === 3 ? '+3' : pts === 1 ? '+1' : '✗'}
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
