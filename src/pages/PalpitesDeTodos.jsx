import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { CALENDARIO, NOMES_AMIGOS, prazoJogo, indiceDiaHoje } from '../data/torneio.js'

export default function PalpitesDeTodos({ jogador, isAdmin }) {
  const [diaIdx, setDiaIdx] = useState(indiceDiaHoje())
  const [palpites, setPalpites] = useState({})
  const [resultados, setResultados] = useState({})
  const [loading, setLoading] = useState(true)
  const agora = new Date()

  useEffect(() => { carregarPalpites() }, [])

  async function carregarPalpites() {
    try {
      const [{ data }, { data: res }] = await Promise.all([
        supabase.from('palpites').select('jogador, id_jogo, casa, fora'),
        supabase.from('resultados').select('id_jogo, casa, fora'),
      ])

      const mapa = {}
      if (data) data.forEach(r => {
        if (!mapa[r.id_jogo]) mapa[r.id_jogo] = {}
        mapa[r.id_jogo][r.jogador] = { casa: r.casa, fora: r.fora }
      })
      setPalpites(mapa)

      const mapaRes = {}
      if (res) res.forEach(r => { mapaRes[r.id_jogo] = { casa: r.casa, fora: r.fora } })
      setResultados(mapaRes)
    } catch {}
    setLoading(false)
  }

  if (loading) return <div className="spinner">A carregar...</div>

  const dia = CALENDARIO[diaIdx]

  function jogoADecorrer(j) {
    const partes = dia.data.split(", ")[1].split("/")
    const d = parseInt(partes[0]), m = parseInt(partes[1])
    const [h, min] = j.hora.split(":").map(Number)
    const inicio = new Date(2026, m - 1, d, h, min, 0)
    const fim = new Date(inicio.getTime() + 2 * 60 * 60 * 1000)
    return agora >= inicio && agora <= fim
  }

  function pontosAposta(idJogo, palpite) {
    const r = resultados[idJogo]
    if (!r || r.casa === null || r.fora === null) return null
    if (palpite.casa === r.casa && palpite.fora === r.fora) return 3
    if ((palpite.casa > palpite.fora && r.casa > r.fora) ||
        (palpite.casa < palpite.fora && r.casa < r.fora) ||
        (palpite.casa === palpite.fora && r.casa === r.fora)) return 1
    return 0
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>👥 Palpites de todos</h2>

      <div className="nav-row">
        <button className="btn btn-icon" onClick={() => setDiaIdx(Math.max(0, diaIdx - 1))}>◀</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(14px,3.5vw,17px)', letterSpacing: 1 }}>
          {dia.data}
        </div>
        <button className="btn btn-icon" onClick={() => setDiaIdx(Math.min(CALENDARIO.length - 1, diaIdx + 1))}>▶</button>
      </div>

      {dia.jogos.map(j => {
        const prazo = prazoJogo(j.id)
        const encerrado = prazo && agora >= prazo
        const aDecorrer = jogoADecorrer(j)
        const resReal = resultados[j.id]

        return (
          <div key={j.id} className="palpite-card" style={{
            borderColor: aDecorrer ? 'rgba(255,215,0,0.4)' : '#1e1e1e',
            boxShadow: aDecorrer ? '0 0 12px rgba(255,215,0,0.08)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: aDecorrer ? 'var(--gold)' : '#555', textTransform: 'uppercase', margin: 0 }}>
                {aDecorrer ? '🟢 A DECORRER' : `⏱ ${j.hora} Lisboa`}
              </p>
            </div>

            {resReal && resReal.casa !== null && (
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'VT323,monospace', fontSize: 28, color: 'var(--green)', letterSpacing: 3 }}>
                  {resReal.casa} — {resReal.fora}
                </span>
                <span style={{ fontSize: 10, color: '#555', display: 'block', fontFamily: 'Barlow Condensed,sans-serif', letterSpacing: 1 }}>RESULTADO REAL</span>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: 'clamp(14px,3.5vw,17px)', marginBottom: 10, color: '#eee' }}>
              {j.casa} <span style={{ color: '#333', padding: '0 6px' }}>VS</span> {j.fora}
            </p>

            {NOMES_AMIGOS.map(amigo => {
              const p = palpites[j.id]?.[amigo]
              const podeVer = encerrado || amigo === jogador || isAdmin

              if (!p) {
                return (
                  <p key={amigo} style={{ margin: 0, padding: '4px 0', borderTop: '1px solid #1a1a1a', fontSize: 12, color: '#3a3a3a', textAlign: 'center' }}>
                    {amigo} — sem aposta
                  </p>
                )
              }

              const vc = podeVer ? p.casa : '🔒'
              const vf = podeVer ? p.fora : '🔒'
              const destaque = amigo === jogador ? 'var(--gold)' : '#ccc'
              const pts = podeVer ? pontosAposta(j.id, p) : null
              const corPts = pts === 3 ? '#00C853' : pts === 1 ? 'var(--gold)' : pts === 0 ? '#FF3D00' : null

              return (
                <div key={amigo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 'clamp(12px,3vw,14px)', color: destaque, fontFamily: 'Barlow Condensed,sans-serif' }}>
                    {amigo}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'VT323,monospace', fontSize: 'clamp(18px,4vw,22px)', color: '#eee', letterSpacing: 2 }}>
                      {vc} - {vf}
                    </span>
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
